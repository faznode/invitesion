import { and, eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { guests, invitations } from '@/lib/db/schema';
import { csvRow } from '@/lib/csv';

const HEADER = ['name', 'phone', 'category', 'guest_count', 'rsvp_status', 'sent_at', 'opened_count', 'checked_in_at', 'attending_count'];

/**
 * Guest list export for the invitation owner. Cells go through `csvRow`, which neutralises values a spreadsheet
 * would run as formulas (B-006): guest names come from host imports and must open as text. `guest_count` is the
 * host's allowance; `attending_count` (last column, added with B-007) is what the guest answered.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const id = Number((await params).id);
  const [inv] = await db
    .select({ id: invitations.id, slug: invitations.slug })
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
    .limit(1);
  if (!inv) return new Response('Not found', { status: 404 });
  const rows = await db.select().from(guests).where(eq(guests.invitationId, id));
  const body = rows.map((g) =>
    csvRow([
      g.name,
      g.phone,
      g.category,
      g.guestCount,
      g.rsvpStatus,
      g.sentAt?.toISOString(),
      g.openedCount,
      g.checkedInAt?.toISOString(),
      g.attendingCount,
    ]),
  );
  return new Response([HEADER.join(','), ...body].join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${inv.slug}-guests.csv"`,
    },
  });
}
