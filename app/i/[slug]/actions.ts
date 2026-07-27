'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { analyticsEvents, guestMessages, guests, invitations } from '@/lib/db/schema';
import { guestPath } from '@/lib/invitation/public-url';

const RSVP_STATUSES = ['CONFIRMED', 'DECLINED'] as const;

/**
 * Resolves the invitation + guest pair a public form submission refers to, and
 * refuses anything that is not currently open for responses. The guest slug is
 * the only credential, exactly as the canonical URL format intends.
 */
async function openInvitationFor(slug: string, guestSlug: string) {
  const [invitation] = await db.select().from(invitations).where(eq(invitations.slug, slug)).limit(1);
  if (!invitation || invitation.status === 'DRAFT') return null;
  if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) return null;
  if (invitation.status === 'EXPIRED') return null;

  const [guest] = await db
    .select()
    .from(guests)
    .where(and(eq(guests.invitationId, invitation.id), eq(guests.slug, guestSlug)))
    .limit(1);
  if (!guest) return null;

  return { invitation, guest };
}

export async function submitRsvp(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const guestSlug = String(formData.get('guestSlug') || '');
  const status = String(formData.get('status') || '');
  const attending = Number(formData.get('guestCount') || 1);

  const context = await openInvitationFor(slug, guestSlug);
  if (!context) redirect(`${guestPath(slug, guestSlug)}?rsvp=closed`);

  if (!(RSVP_STATUSES as readonly string[]).includes(status)) {
    redirect(`${guestPath(slug, guestSlug)}?rsvp=invalid`);
  }

  // A decline never reserves seats, so the count only applies when attending.
  const maxPerRsvp = context.guest.guestCount || 1;
  const guestCount = status === 'CONFIRMED' ? Math.min(Math.max(attending, 1), maxPerRsvp) : 0;

  await db.update(guests).set({ rsvpStatus: status, guestCount }).where(eq(guests.id, context.guest.id));
  await db.insert(analyticsEvents).values({
    invitationId: context.invitation.id,
    guestId: context.guest.id,
    eventType: 'RSVP',
    meta: { status, guestCount, source: 'public' },
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
