'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { analyticsEvents, guestMessages, guests, invitations } from '@/lib/db/schema';
import { normalizeStoredConfig } from '@/lib/invitation/content-read';
import { findGuestByLinkSegment } from '@/lib/invitation/public';
import { guestPath } from '@/lib/invitation/public-url';
import { isRsvpStatus, rsvpAttendance, rsvpClosedReason } from '@/lib/invitation/rsvp-rules';

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
  const status = String(formData.get('status') || '');
  const attending = Number(formData.get('guestCount') || 1);

  const context = await openInvitationFor(slug, guestSlug);
  if (!context) redirect(`${guestPath(slug, guestSlug)}?rsvp=closed`);
  // B-027: a hidden form is not a closed one. RSVP switched off, or past its deadline, refuses every POST, including a
  // page that was rendered while it was still open.
  if (rsvpClosedReason(context.config.rsvp, Date.now())) redirect(`${guestPath(slug, guestSlug)}?rsvp=closed`);

  if (!isRsvpStatus(status)) {
    redirect(`${guestPath(slug, guestSlug)}?rsvp=invalid`);
  }

  // The answer goes to attending_count; guest_count is the host's allowance and is never written here (B-007).
  const attendingCount = rsvpAttendance(status, attending, context.guest.guestCount);

  await db.update(guests).set({ rsvpStatus: status, attendingCount }).where(eq(guests.id, context.guest.id));
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
