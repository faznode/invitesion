'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { analyticsEvents, guests, invitations } from '@/lib/db/schema';

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tamu'; }
async function context(formData: FormData) {
  const user = await getUser(); if (!user || user.role === 'ADMIN') redirect('/sign-in');
  const invitationId = Number(formData.get('invitationId')); if (!Number.isInteger(invitationId)) redirect('/dashboard/invitations');
  const [inv] = await db.select().from(invitations).where(and(eq(invitations.id, invitationId), eq(invitations.userId, user.id))).limit(1);
  if (!inv) redirect('/dashboard/invitations'); return { invitationId, path: `/dashboard/invitations/${invitationId}/guests` };
}
export async function addScopedGuest(formData: FormData) {
  const { invitationId, path } = await context(formData); const name=String(formData.get('name')||'').trim(); const phone=String(formData.get('phone')||'').trim(); const category=String(formData.get('category')||'').trim(); const guestCount=Number(formData.get('guestCount')||1);
  if (!name || name.length>150 || (phone && !/^[+0-9()\-\s]{7,30}$/.test(phone)) || !Number.isInteger(guestCount) || guestCount<1 || guestCount>50) redirect(`${path}?error=invalid`);
  const base=slugify(name); let slug=base; for(let n=2;n<100;n++){const found=await db.select({id:guests.id}).from(guests).where(and(eq(guests.invitationId,invitationId),eq(guests.slug,slug))).limit(1);if(!found.length)break;slug=`${base}-${n}`;}
  await db.insert(guests).values({invitationId,name,phone:phone||null,category:category||null,guestCount,slug}); revalidatePath(path); redirect(`${path}?added=1`);
}
export async function updateGuestOperation(formData: FormData) {
  const { invitationId, path }=await context(formData); const guestId=Number(formData.get('guestId')); const operation=String(formData.get('operation'));
  const [owned]=await db.select({id:guests.id}).from(guests).where(and(eq(guests.id,guestId),eq(guests.invitationId,invitationId))).limit(1); if(!owned) redirect(`${path}?error=notfound`);
  if(operation==='sent') await db.update(guests).set({sentAt:new Date()}).where(eq(guests.id,guestId));
  else if(operation==='checkin'){await db.update(guests).set({checkedInAt:new Date()}).where(eq(guests.id,guestId));await db.insert(analyticsEvents).values({invitationId,guestId,eventType:'CHECKIN'});}
  else if(operation==='undo-checkin') await db.update(guests).set({checkedInAt:null}).where(eq(guests.id,guestId));
  else if(['PENDING','CONFIRMED','DECLINED'].includes(operation)){await db.update(guests).set({rsvpStatus:operation}).where(eq(guests.id,guestId));await db.insert(analyticsEvents).values({invitationId,guestId,eventType:'RSVP',meta:{status:operation,source:'dashboard'}});}
  revalidatePath(path);
}
