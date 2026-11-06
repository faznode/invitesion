import 'server-only';

import { cache } from 'react';
import { and, asc, count, desc, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { guestMessages, guests, invitations, mediaAssets } from '@/lib/db/schema';
import { normalizeStoredConfig } from './content-read';
import type { DetailConfig } from './detail-config';
import { pickGuestForSegment } from './guest-link';
import { writeInvitationView } from './view-writer';

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
 * - `includeDraft` is only for the owner preview (`app/preview/[id]`), which
 *   checks ownership before calling; public routes never pass it.
 *
 * Wrapped in React `cache()` (B-014 step 1): `generateMetadata` and the page
 * of one request share a single load instead of querying everything twice.
 * The cache lives for one server request only, so guests never share results.
 * Arguments are primitives so the cache key is stable.
 */
export const loadPublicInvitation = cache(async (slug: string, guestSlug?: string, includeDraft = false) => {
  const [invitation] = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  if (!invitation || (invitation.status === 'DRAFT' && !includeDraft)) return null;

  const expired = invitation.status === 'EXPIRED' || (invitation.expiresAt ? invitation.expiresAt.getTime() < Date.now() : false);

  const guest = guestSlug ? await findGuestByLinkSegment(invitation.id, guestSlug) : null;

  // An unknown guest slug is a wrong link, not a different view of the page.
  if (guestSlug && !guest) return null;

  const config = readStoredConfig(invitation.id, invitation.config);

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
});

/**
 * The guest a personal link's last segment refers to, under the B-011 rule (`guest-link.ts`): token first, then the
 * slug of a guest without a token. One indexed query; at most two candidate rows.
 */
export async function findGuestByLinkSegment(invitationId: number, segment: string) {
  if (!segment) return null;
  const rows = await db
    .select()
    .from(guests)
    .where(
      and(
        eq(guests.invitationId, invitationId),
        or(eq(guests.linkToken, segment), and(isNull(guests.linkToken), eq(guests.slug, segment))),
      ),
    )
    .limit(2);
  return pickGuestForSegment(rows, segment);
}

/**
 * Invitation row + parsed config for guest-facing side routes (calendar file, link-preview image) under the same
 * visibility rule as the page: drafts are never public. No guest lookup, media or guestbook queries.
 */
export async function loadPublishedInvitationSummary(slug: string) {
  const [invitation] = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  if (!invitation || invitation.status === 'DRAFT') return null;
  return { invitation, config: readStoredConfig(invitation.id, invitation.config) };
}

/**
 * Stored config → renderable config through the content contract's lenient read path. Before s11 any schema failure
 * turned the whole invitation into `{}` (an empty page for every guest); now only the failing section is dropped.
 * Only key names are logged, never values (they can hold personal data).
 */
function readStoredConfig(invitationId: number, stored: unknown): DetailConfig {
  const { config, dropped } = normalizeStoredConfig(stored ?? {});
  if (dropped.length) console.warn(`[invitation ${invitationId}] config sections skipped on read: ${dropped.join(', ')}`);
  return config;
}

/**
 * Records that the invitation was opened.
 *
 * The page is `force-dynamic`, so it re-renders on every RSC request —
 * including the redirect that follows an RSVP or guestbook submission. Counting
 * each of those would inflate per-guest open counts, which is precisely the
 * metric this product sells. Repeat views inside a short window therefore
 * collapse into the first one, atomically (B-017a, `view-tracking.ts`).
 *
 * Best-effort: a tracking failure must never stop a guest from seeing their
 * invitation. The writer (Next.js or the Rust API) is chosen per call by
 * `BACKEND_VIEWS` (R-02, `view-writer.ts`).
 */
export async function trackInvitationView(invitationId: number, guestId?: number | null) {
  try {
    await writeInvitationView(invitationId, guestId);
  } catch (error) {
    console.error('Failed to record invitation view', error);
  }
}
