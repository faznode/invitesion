'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { guests, invitations } from '@/lib/db/schema';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tamu';
}

/**
 * Guests page URL that carries the explicit invitation context through
 * redirects, so acting on invitation B never bounces the customer back to
 * invitation A's list.
 */
function guestsPath(invitationId: number | null, params: string) {
  const valid = invitationId !== null && Number.isInteger(invitationId) && invitationId > 0;
  return valid ? `/dashboard/guests?invitation=${invitationId}&${params}` : `/dashboard/guests?${params}`;
}

export async function addGuest(formData: FormData) {
  const user = await getUser();
  if (!user || user.role === 'ADMIN') redirect('/sign-in');
  const invitationId = Number(formData.get('invitationId'));
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const guestCount = Number(formData.get('guestCount') || 1);
  if (!Number.isInteger(invitationId) || !name || name.length > 150 || (phone && !/^[+0-9()\-\s]{7,30}$/.test(phone)) || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) {
    redirect(guestsPath(Number.isInteger(invitationId) ? invitationId : null, 'error=invalid'));
  }
  const [invitation] = await db.select().from(invitations).where(and(eq(invitations.id, invitationId), eq(invitations.userId, user.id))).limit(1);
  if (!invitation) redirect(guestsPath(invitationId, 'error=notfound'));
  const base = slugify(name);
  let slug = base;
  for (let n = 2; n < 100; n++) {
    const exists = await db.select({ id: guests.id }).from(guests).where(and(eq(guests.invitationId, invitationId), eq(guests.slug, slug))).limit(1);
    if (!exists.length) break;
    slug = `${base}-${n}`;
  }
  await db.insert(guests).values({ invitationId, name, phone: phone || null, category: category || null, guestCount, slug });
  revalidatePath('/dashboard/guests');
  redirect(guestsPath(invitationId, 'added=1'));
}

export async function markGuestSent(formData: FormData) {
  const user = await getUser();
  if (!user || user.role === 'ADMIN') redirect('/sign-in');
  const guestId = Number(formData.get('guestId'));
  const invitationId = Number(formData.get('invitationId'));
  const [guest] = await db.select({ id: guests.id }).from(guests).innerJoin(invitations, eq(guests.invitationId, invitations.id)).where(and(eq(guests.id, guestId), eq(invitations.userId, user.id))).limit(1);
  if (!guest) redirect(guestsPath(Number.isInteger(invitationId) ? invitationId : null, 'error=notfound'));
  await db.update(guests).set({ sentAt: new Date() }).where(eq(guests.id, guestId));
  revalidatePath('/dashboard/guests');
}
