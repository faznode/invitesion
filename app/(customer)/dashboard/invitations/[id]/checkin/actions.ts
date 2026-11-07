'use server';

import { and, eq } from 'drizzle-orm';
import { ownerSessionToken } from '@/lib/auth/clerk-user';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { invitations } from '@/lib/db/schema';
import { isFlagOn } from '@/lib/flags';
import { passManualAllowed } from '@/lib/invitation/guest-pass';
import { rosterOperation } from '@/lib/invitation/roster';

export type ManualCheckInResult =
  | { ok: true; checkedInAt: string }
  | { ok: false; reason: 'signin' | 'off' | 'notfound' | 'manual-off' | 'unconfirmed' };

/**
 * B-024: the scanner's manual fallback (a pass that will not scan, a guest without one). It is the guest list's own
 * check-in (`rosterOperation('checkin')`, one roster writer), refused where the host turned manual check-in off or
 * requires the QR. Server actions already refuse cross-site posts.
 */
export async function manualCheckIn(invitationId: number, guestId: number): Promise<ManualCheckInResult> {
  const user = await getUser();
  if (!user || user.role === 'ADMIN') return { ok: false, reason: 'signin' };
  if (!isFlagOn('GUEST_PASS')) return { ok: false, reason: 'off' };
  if (!Number.isInteger(invitationId) || !Number.isInteger(guestId)) return { ok: false, reason: 'notfound' };
  const [invitation] = await db
    .select({ config: invitations.config })
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), eq(invitations.userId, user.id)))
    .limit(1);
  if (!invitation) return { ok: false, reason: 'notfound' };
  if (!passManualAllowed(invitation.config)) return { ok: false, reason: 'manual-off' };
  const outcome = await rosterOperation({ userId: user.id, ownerToken: ownerSessionToken }, { invitationId, guestId, operation: 'checkin' });
  return outcome.kind === 'saved' ? { ok: true, checkedInAt: new Date().toISOString() } : { ok: false, reason: outcome.kind };
}
