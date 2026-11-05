import { and, eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { guests, invitations } from '@/lib/db/schema';
import { isFlagOn } from '@/lib/flags';
import { normalizeStoredConfig } from '@/lib/invitation/content-read';
import { inviteOnlyEvents } from '@/lib/invitation/event-eligibility';
import { guestExportCsv } from '@/lib/invitation/guest-export';
import { exportedEvents } from '@/lib/invitation/rsvp-events';

/** Guest list export for the invitation owner; rows and neutralisation in `lib/invitation/guest-export.ts` (B-006, B-027). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const id = Number((await params).id);
  const [inv] = await db
    .select({ id: invitations.id, slug: invitations.slug, config: invitations.config })
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
    .limit(1);
  if (!inv) return new Response('Not found', { status: 404 });
  const rows = await db.select().from(guests).where(eq(guests.invitationId, id));
  // Every stored question, switched on or not, so answers collected before the host closed the form are exported (D-034).
  const { config } = normalizeStoredConfig(inv.config ?? {});
  const questions = config.registrationForm?.customQuestions ?? [];
  // D-037: who is invited to each invite-only event, while invite-only events are switched on.
  const inviteOnly = isFlagOn('INVITE_ONLY_EVENTS') ? inviteOnlyEvents(config.events) : [];
  return new Response(guestExportCsv(rows, questions, exportedEvents(config, rows), inviteOnly), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${inv.slug}-guests.csv"`,
    },
  });
}
