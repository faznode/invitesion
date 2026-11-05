'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { analyticsEvents, guestMessages, guests, invitations } from '@/lib/db/schema';
import { isFlagOn } from '@/lib/flags';
import { normalizeStoredConfig } from '@/lib/invitation/content-read';
import { guestAudience, visibleEvents } from '@/lib/invitation/event-eligibility';
import { findGuestByLinkSegment } from '@/lib/invitation/public';
import { guestPath } from '@/lib/invitation/public-url';
import { parseRsvpAnswers, rsvpQuestionsOf, type RsvpAnswers } from '@/lib/invitation/rsvp-questions';
import {
  mergeEventAnswers,
  parseEventAnswers,
  perEventRsvpEvents,
  readEventAnswers,
  singleAnswerEventAnswers,
  type EventAnswers,
} from '@/lib/invitation/rsvp-events';
import { isRsvpStatus, rsvpAttendance, rsvpClosedReason, type RsvpStatus } from '@/lib/invitation/rsvp-rules';

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

export async function submitRsvp(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const guestSlug = String(formData.get('guestSlug') || '');

  const context = await openInvitationFor(slug, guestSlug);
  if (!context) redirect(`${guestPath(slug, guestSlug)}?rsvp=closed`);
  // B-027: a hidden form is not a closed one. RSVP switched off, or past its deadline, refuses every POST, including a
  // page that was rendered while it was still open.
  if (rsvpClosedReason(context.config.rsvp, Date.now())) redirect(`${guestPath(slug, guestSlug)}?rsvp=closed`);

  const maybe = isFlagOn('RSVP_MAYBE');
  let status: RsvpStatus;
  let attendingCount: number | null;
  // Undefined leaves the column as it is (flag off: per-event answers are neither read nor written).
  let rsvpEventAnswers: EventAnswers | null | undefined;
  const perEventOn = isFlagOn('RSVP_PER_EVENT');
  const listed = perEventRsvpEvents({ perEvent: context.config.rsvp?.perEvent, events: context.config.events }, perEventOn);
  // D-037: the guest answers only the listed events their page shows (open ones and the invite-only ones they are
  // invited to), by the rule the page used; fields naming any other event are never read.
  const events = visibleEvents(listed, guestAudience(context.guest), isFlagOn('INVITE_ONLY_EVENTS'));
  const storedEventAnswers = readEventAnswers(context.guest.rsvpEventAnswers);
  if (events.length >= 2) {
    // B-027 slice 2c (D-036): one answer per listed event, by event id; the overall status and headcount follow from them.
    // A form without them (rendered before the switch, or before an event was added) is refused, naming the event.
    const parsed = parseEventAnswers(formData, events, context.guest.guestCount, { maybe });
    if (!parsed.ok) redirect(`${guestPath(slug, guestSlug)}?rsvp=events&rsvpe=${encodeURIComponent(parsed.eventId)}`);
    status = parsed.status;
    attendingCount = parsed.attendingCount;
    rsvpEventAnswers = mergeEventAnswers(storedEventAnswers, parsed.answers);
  } else {
    const submitted = String(formData.get('status') || '');
    // B-027: "maybe" is accepted only while its flag is on, so switching the flag off also refuses stale forms.
    if (!isRsvpStatus(submitted, { maybe })) redirect(`${guestPath(slug, guestSlug)}?rsvp=invalid`);
    status = submitted;
    // The answer goes to attending_count; guest_count is the host's allowance and is never written here (B-007).
    attendingCount = rsvpAttendance(status, Number(formData.get('guestCount') || 1), context.guest.guestCount);
    // D-036: one answer for the whole invitation replaces earlier per-event answers, so they never contradict the latest;
    // D-037: a guest invited to one listed event answers for that event.
    rsvpEventAnswers = singleAnswerEventAnswers({ flagOn: perEventOn, listed, asked: events, stored: storedEventAnswers, answer: { status, attending: attendingCount } });
  }

  // B-027 (D-034): answers to the host's questions, by the rules the form was rendered with. Undefined leaves the column
  // as it is (flag off or no questions), so switching either off never erases stored answers; null clears on a decline.
  let rsvpAnswers: RsvpAnswers | null | undefined;
  const questions = isFlagOn('RSVP_QUESTIONS') ? rsvpQuestionsOf(context.config.registrationForm ?? {}) : [];
  if (questions.length) {
    const parsed = parseRsvpAnswers(formData, questions, status);
    if (!parsed.ok) redirect(`${guestPath(slug, guestSlug)}?rsvp=answers&rsvpq=${encodeURIComponent(parsed.questionId)}`);
    rsvpAnswers = parsed.answers;
  }

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
