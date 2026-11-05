'use server';

import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { analyticsEvents, guests, invitations } from '@/lib/db/schema';
import { isFlagOn } from '@/lib/flags';
import { normalizeStoredConfig } from '@/lib/invitation/content-read';
import { guestAudience, inviteOnlyEvents, invitedIdsFromForm, visibleEvents } from '@/lib/invitation/event-eligibility';
import { newGuestLinkToken } from '@/lib/invitation/guest-link';
import { hostRsvpUpdate, perEventRsvpEvents, readEventAnswers, type HostRsvpStatus } from '@/lib/invitation/rsvp-events';

const HOST_STATUSES: readonly HostRsvpStatus[] = ['PENDING', 'CONFIRMED', 'DECLINED', 'MAYBE'];
const isHostStatus = (value: string): value is HostRsvpStatus => (HOST_STATUSES as readonly string[]).includes(value);

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tamu'; }

/** The signed-in owner's invitation named by the form, with its config read leniently like every other reader. */
async function context(formData: FormData) {
  const user = await getUser(); if (!user || user.role === 'ADMIN') redirect('/sign-in');
  const invitationId = Number(formData.get('invitationId')); if (!Number.isInteger(invitationId)) redirect('/dashboard/invitations');
  const [inv] = await db.select().from(invitations).where(and(eq(invitations.id, invitationId), eq(invitations.userId, user.id))).limit(1);
  if (!inv) redirect('/dashboard/invitations');
  return { invitationId, config: normalizeStoredConfig(inv.config ?? {}).config, path: `/dashboard/invitations/${invitationId}/guests` };
}

export async function addScopedGuest(formData: FormData) {
  const { invitationId, config, path } = await context(formData); const name=String(formData.get('name')||'').trim(); const phone=String(formData.get('phone')||'').trim(); const category=String(formData.get('category')||'').trim(); const guestCount=Number(formData.get('guestCount')||1);
  if (!name || name.length>150 || (phone && !/^[+0-9()\-\s]{7,30}$/.test(phone)) || !Number.isInteger(guestCount) || guestCount<1 || guestCount>50) redirect(`${path}?error=invalid`);
  const base=slugify(name); let slug=base; for(let n=2;n<100;n++){const found=await db.select({id:guests.id}).from(guests).where(and(eq(guests.invitationId,invitationId),eq(guests.slug,slug))).limit(1);if(!found.length)break;slug=`${base}-${n}`;}
  const linkToken = isFlagOn('OPAQUE_GUEST_LINKS') ? newGuestLinkToken() : null;
  // D-037: the invite-only events ticked in the form (only this invitation's current invite-only events are read).
  const invited = isFlagOn('INVITE_ONLY_EVENTS') ? invitedIdsFromForm(formData, config.events, null) : [];
  await db.insert(guests).values({invitationId,name,phone:phone||null,category:category||null,guestCount,slug,linkToken,invitedEventIds:invited.length?invited:null}); revalidatePath(path); redirect(`${path}?added=1`);
}

/**
 * Dashboard operations on one guest. RSVP operations (`CONFIRMED`, …, or `event:<eventId>:<STATUS>` for one event) go
 * through `hostRsvpUpdate` (D-037): the status, the people attending and the per-event answers are written by one UPDATE,
 * so the dashboard never leaves them contradicting each other.
 */
export async function updateGuestOperation(formData: FormData) {
  const { invitationId, config, path }=await context(formData); const guestId=Number(formData.get('guestId')); const operation=String(formData.get('operation'));
  const [owned]=await db.select().from(guests).where(and(eq(guests.id,guestId),eq(guests.invitationId,invitationId))).limit(1); if(!owned) redirect(`${path}?error=notfound`);
  if(operation==='sent') await db.update(guests).set({sentAt:new Date()}).where(eq(guests.id,guestId));
  else if(operation==='checkin'){await db.update(guests).set({checkedInAt:new Date()}).where(eq(guests.id,guestId));await db.insert(analyticsEvents).values({invitationId,guestId,eventType:'CHECKIN'});}
  else if(operation==='undo-checkin') await db.update(guests).set({checkedInAt:null}).where(eq(guests.id,guestId));
  else {
    const [scope, eventId, eventStatus] = operation.startsWith('event:') ? operation.split(':') : [undefined, undefined, operation];
    const status = String(eventStatus ?? '');
    if (scope !== undefined && !eventId) redirect(`${path}?error=invalid`);
    if (!isHostStatus(status)) redirect(`${path}?error=invalid`);
    const perEventOn = isFlagOn('RSVP_PER_EVENT');
    const listed = perEventRsvpEvents({ perEvent: config.rsvp?.perEvent, events: config.events }, perEventOn);
    const asked = visibleEvents(listed, guestAudience(owned), isFlagOn('INVITE_ONLY_EVENTS'));
    const update = hostRsvpUpdate({
      status, eventId, flagOn: perEventOn, listed, asked, stored: readEventAnswers(owned.rsvpEventAnswers),
      previous: { rsvpStatus: owned.rsvpStatus, attendingCount: owned.attendingCount },
    });
    if (!update) redirect(`${path}?error=invalid`);
    await db.update(guests).set(update).where(and(eq(guests.id,guestId),eq(guests.invitationId,invitationId)));
    await db.insert(analyticsEvents).values({invitationId,guestId,eventType:'RSVP',meta:{status:update.rsvpStatus,source:'dashboard'}});
  }
  revalidatePath(path);
}

/** D-037: which invite-only events one guest is invited to, from the checkboxes of the guest's row. */
export async function setGuestInvitedEvents(formData: FormData) {
  const { invitationId, config, path } = await context(formData);
  if (!isFlagOn('INVITE_ONLY_EVENTS')) redirect(`${path}?error=invalid`);
  const guestId = Number(formData.get('guestId'));
  const [owned] = await db.select({ id: guests.id, invitedEventIds: guests.invitedEventIds }).from(guests).where(and(eq(guests.id, guestId), eq(guests.invitationId, invitationId))).limit(1);
  if (!owned) redirect(`${path}?error=notfound`);
  const invited = invitedIdsFromForm(formData, config.events, owned.invitedEventIds);
  await db.update(guests).set({ invitedEventIds: invited.length ? invited : null }).where(and(eq(guests.id, guestId), eq(guests.invitationId, invitationId)));
  revalidatePath(path);
  redirect(`${path}?invites=1`);
}

/**
 * D-037: invite (or uninvite) every guest of one category to one invite-only event, in one UPDATE scoped to the owner's
 * invitation. The event must be a current invite-only event of this invitation; an empty category means guests without one.
 */
export async function setCategoryInvitation(formData: FormData) {
  const { invitationId, config, path } = await context(formData);
  if (!isFlagOn('INVITE_ONLY_EVENTS')) redirect(`${path}?error=invalid`);
  const eventId = String(formData.get('eventId') || '');
  const category = String(formData.get('category') ?? '').trim();
  const mode = String(formData.get('mode') || '');
  if (!inviteOnlyEvents(config.events).some((event) => event.id === eventId) || category.length > 50 || (mode !== 'add' && mode !== 'remove')) redirect(`${path}?error=invalid`);
  const inCategory = category ? eq(guests.category, category) : sql`(${guests.category} IS NULL OR ${guests.category} = '')`;
  const invited = sql`coalesce(${guests.invitedEventIds}, '[]'::jsonb)`;
  const changed = mode === 'add'
    ? await db.update(guests)
        .set({ invitedEventIds: sql`(CASE WHEN jsonb_typeof(${invited}) = 'array' THEN ${invited} ELSE '[]'::jsonb END) || jsonb_build_array(${eventId}::text)` })
        .where(and(eq(guests.invitationId, invitationId), inCategory, sql`NOT (${invited} ? ${eventId})`))
        .returning({ id: guests.id })
    : await db.update(guests)
        .set({ invitedEventIds: sql`nullif(${guests.invitedEventIds} - ${eventId}::text, '[]'::jsonb)` })
        .where(and(eq(guests.invitationId, invitationId), inCategory, sql`${invited} ? ${eventId}`))
        .returning({ id: guests.id });
  revalidatePath(path);
  redirect(`${path}?invites=${changed.length}`);
}
