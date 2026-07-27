import 'server-only';

import { and, asc, count, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { analyticsEvents, guestMessages, guests, invitations, mediaAssets } from '@/lib/db/schema';
import { detailConfigSchema, type DetailConfig } from './detail-config';

export type PublicInvitation = Awaited<ReturnType<typeof loadPublicInvitation>>;

/**
 * How many guestbook messages a public page renders.
 *
 * Chosen to be generous for a normal event while keeping the payload bounded.
 * Everything beyond this is counted, not fetched, so the page can honestly say
 * how many wishes there are without paying to serialise them all.
 */
export const GUESTBOOK_PAGE_SIZE = 50;

/**
 * Loads everything the public renderer needs.
 *
 * Access rules (handoff 1.1 / 1.5):
 * - DRAFT invitations are not public at all.
 * - An invitation past `expiresAt` stays viewable but becomes read-only:
 *   RSVP and guestbook close while guest data is retained.
 * - The guest name is never part of the config; it is injected here from the
 *   guests table so one config can serve every guest.
 */
export async function loadPublicInvitation(slug: string, guestSlug?: string) {
  const [invitation] = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  if (!invitation || invitation.status === 'DRAFT') return null;

  const expired = invitation.status === 'EXPIRED' || (invitation.expiresAt ? invitation.expiresAt.getTime() < Date.now() : false);

  const guest = guestSlug
    ? (
        await db
          .select()
          .from(guests)
          .where(and(eq(guests.invitationId, invitation.id), eq(guests.slug, guestSlug)))
          .limit(1)
      )[0] ?? null
    : null;

  // An unknown guest slug is a wrong link, not a different view of the page.
  if (guestSlug && !guest) return null;

  const parsed = detailConfigSchema.safeParse(invitation.config ?? {});
  const config: DetailConfig = parsed.success ? parsed.data : {};

  const [media, messages, messageCount] = await Promise.all([
    db.select().from(mediaAssets).where(eq(mediaAssets.invitationId, invitation.id)).orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id)),
    config.guestbook?.enabled === false
      ? Promise.resolve([])
      : db
          .select()
          .from(guestMessages)
          .where(and(eq(guestMessages.invitationId, invitation.id), eq(guestMessages.isHidden, false)))
          // Newest first, capped. This query previously had no bound at all: a
          // wedding with 800 guests actively leaving wishes meant thousands of
          // rows fetched and re-serialised on every single page view, on the
          // hot path that receives a WhatsApp blast all at once.
          .orderBy(desc(guestMessages.createdAt))
          .limit(GUESTBOOK_PAGE_SIZE),
    config.guestbook?.enabled === false
      ? Promise.resolve([{ value: 0 }])
      : db
          .select({ value: count() })
          .from(guestMessages)
          .where(and(eq(guestMessages.invitationId, invitation.id), eq(guestMessages.isHidden, false))),
  ]);

  const totalMessages = Number(messageCount[0]?.value ?? 0);

  return {
    invitation,
    config,
    guest,
    media,
    // Restored to chronological order for display; the cap is applied to the
    // most recent, which is what a guest arriving late actually wants to read.
    messages: [...messages].reverse(),
    totalMessages,
    hiddenMessageCount: Math.max(0, totalMessages - messages.length),
    expired,
    readOnly: expired,
  };
}

/** A re-render caused by an RSVP redirect is not a new open. */
const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

/**
 * Records that the invitation was opened.
 *
 * The page is `force-dynamic`, so it re-renders on every RSC request —
 * including the redirect that follows an RSVP or guestbook submission. Counting
 * each of those would inflate per-guest open counts, which is precisely the
 * metric this product sells. Repeat views inside a short window therefore
 * collapse into the first one.
 *
 * Best-effort: a tracking failure must never stop a guest from seeing their
 * invitation.
 */
export async function trackInvitationView(invitationId: number, guestId?: number | null) {
  try {
    const since = new Date(Date.now() - VIEW_DEDUPE_WINDOW_MS);
    const [recent] = await db
      .select({ id: analyticsEvents.id })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.invitationId, invitationId),
          eq(analyticsEvents.eventType, 'VIEW'),
          guestId ? eq(analyticsEvents.guestId, guestId) : isNull(analyticsEvents.guestId),
          gte(analyticsEvents.createdAt, since),
        ),
      )
      .limit(1);
    if (recent) return;

    await db.insert(analyticsEvents).values({ invitationId, guestId: guestId ?? null, eventType: 'VIEW' });
    if (guestId) {
      await db
        .update(guests)
        .set({ openedAt: new Date(), openedCount: sql`${guests.openedCount} + 1` })
        .where(eq(guests.id, guestId));
    }
  } catch (error) {
    console.error('Failed to record invitation view', error);
  }
}
