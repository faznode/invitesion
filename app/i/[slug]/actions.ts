'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { backendFor } from '@/lib/backend';
import { db } from '@/lib/db/drizzle';
import { analyticsEvents, guestMessages, guests, invitations } from '@/lib/db/schema';
import { isFlagOn } from '@/lib/flags';
import { normalizeStoredConfig } from '@/lib/invitation/content-read';
import { findGuestByLinkSegment } from '@/lib/invitation/public';
import { guestPath } from '@/lib/invitation/public-url';
import { decideGuestRsvp, rsvpSubmissionFromForm, type GuestRsvpDecision, type RsvpFlags } from '@/lib/invitation/rsvp-decision';
import { RSVP_KEY_PATTERN, writeGuestRsvpThroughApi, type GuestRsvpOutcome } from '@/lib/invitation/rsvp-writer';

/**
 * Resolves the invitation + guest pair a public form submission refers to, and
 * refuses anything that is not currently open for responses. The link's last
 * segment is the credential: an opaque token, or the slug of a legacy guest
 * (B-011 rule, `lib/invitation/guest-link.ts`) — the same rule as the page.
 */
async function openInvitationFor(slug: string, guestSlug: string) {
  const [invitation] = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  if (!invitation || invitation.status === 'DRAFT') return null;
  if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) return null;
  if (invitation.status === 'EXPIRED') return null;

  const guest = await findGuestByLinkSegment(invitation.id, guestSlug);
  if (!guest) return null;

  // The same lenient read as the page, so the action enforces exactly the switches and deadline the guest saw.
  const { config } = normalizeStoredConfig(invitation.config ?? {});
  return { invitation, guest, config };
}

/** The switches this deployment renders the guest page with; the Rust writer receives the same values (R-03). */
function rsvpFlags(): RsvpFlags {
  return {
    maybe: isFlagOn('RSVP_MAYBE'),
    perEvent: isFlagOn('RSVP_PER_EVENT'),
    inviteOnlyEvents: isFlagOn('INVITE_ONLY_EVENTS'),
    questions: isFlagOn('RSVP_QUESTIONS'),
  };
}

/** The page's notice for a refused RSVP (`?rsvp=`; `rsvpe` names the unanswered event, `rsvpq` the question to fix). */
function rsvpRefusalQuery(refusal: Exclude<GuestRsvpDecision, { kind: 'write' }> | Exclude<GuestRsvpOutcome, { kind: 'saved' }>): string {
  if (refusal.kind === 'events') return `rsvp=events&rsvpe=${encodeURIComponent(refusal.eventId)}`;
  if (refusal.kind === 'answers') return `rsvp=answers&rsvpq=${encodeURIComponent(refusal.questionId)}`;
  if (refusal.kind === 'busy') return 'rsvp=busy';
  return refusal.kind === 'closed' ? 'rsvp=closed' : 'rsvp=invalid';
}

/**
 * The guest's public address for the per-address limit (B-013). Vercel overwrites `x-forwarded-for` at its edge; behind
 * another host, a trusted proxy must set it. Passed to the API only, which keeps a keyed hash and never the address.
 */
async function clientAddress(): Promise<string | null> {
  const forwarded = await headers();
  return forwarded.get('x-forwarded-for')?.split(',')[0]?.trim() || forwarded.get('x-real-ip')?.trim() || null;
}

export async function submitRsvp(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const guestSlug = String(formData.get('guestSlug') || '');
  const submission = rsvpSubmissionFromForm(formData);
  const flags = rsvpFlags();

  // R-03: exactly one writer per call (`BACKEND_RSVP`, default `next`). This branch always ends in a redirect, so the
  // TypeScript writer below is never reached as a fallback.
  if (backendFor('RSVP') === 'rust') {
    const key = String(formData.get('rsvpKey') ?? '');
    const outcome = await writeGuestRsvpThroughApi({
      slug,
      guestSlug,
      submission,
      flags,
      clientIp: await clientAddress(),
      idempotencyKey: RSVP_KEY_PATTERN.test(key) ? key : null,
    });
    if (outcome.kind !== 'saved') redirect(`${guestPath(slug, guestSlug)}?${rsvpRefusalQuery(outcome)}`);
    revalidatePath(guestPath(slug, guestSlug));
    redirect(`${guestPath(slug, guestSlug)}?rsvp=saved`);
  }

  const context = await openInvitationFor(slug, guestSlug);
  if (!context) redirect(`${guestPath(slug, guestSlug)}?rsvp=closed`);
  // R-03: closed (B-027), the single or per-event answer (B-007, D-036, D-037) and the questions (D-034, D-035) are one
  // pure decision, shared with the Rust writer through contracts/vectors/rsvp-decisions.json.
  const decision = decideGuestRsvp({ config: context.config, guest: context.guest, submission, flags, now: Date.now() });
  if (decision.kind !== 'write') redirect(`${guestPath(slug, guestSlug)}?${rsvpRefusalQuery(decision)}`);
  const { status, attendingCount, rsvpAnswers, rsvpEventAnswers } = decision;

  // One statement: status, headcount, question answers and per-event answers never disagree after a write (D-034, D-036).
  await db.update(guests).set({ rsvpStatus: status, attendingCount, ...(rsvpAnswers !== undefined && { rsvpAnswers }), ...(rsvpEventAnswers !== undefined && { rsvpEventAnswers }) }).where(eq(guests.id, context.guest.id));
  await db.insert(analyticsEvents).values({
    invitationId: context.invitation.id,
    guestId: context.guest.id,
    eventType: 'RSVP',
    // `guestCount` in event meta has always meant the people attending for this answer; kept for readers.
    meta: { status, guestCount: attendingCount, source: 'public' },
  });

  revalidatePath(guestPath(slug, guestSlug));
  redirect(`${guestPath(slug, guestSlug)}?rsvp=saved`);
}

export async function submitGuestMessage(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const guestSlug = String(formData.get('guestSlug') || '');
  const message = String(formData.get('message') || '').trim();

  const context = await openInvitationFor(slug, guestSlug);
  if (!context) redirect(`${guestPath(slug, guestSlug)}?wish=closed`);
  if (context.config.guestbook?.enabled === false) redirect(`${guestPath(slug, guestSlug)}?wish=closed`);

  if (!message || message.length > 1000) {
    redirect(`${guestPath(slug, guestSlug)}?wish=invalid`);
  }

  await db.insert(guestMessages).values({
    invitationId: context.invitation.id,
    guestId: context.guest.id,
    name: context.guest.name,
    message,
  });
  await db.insert(analyticsEvents).values({
    invitationId: context.invitation.id,
    guestId: context.guest.id,
    eventType: 'GUESTBOOK',
  });

  revalidatePath(guestPath(slug, guestSlug));
  redirect(`${guestPath(slug, guestSlug)}?wish=saved`);
}
