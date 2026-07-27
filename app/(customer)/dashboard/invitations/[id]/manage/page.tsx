import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { invitations } from '@/lib/db/schema';
import { detailConfigSchema } from '@/lib/invitation/detail-config';
import { ManageCenter } from './manage-center';

export const dynamic = 'force-dynamic';

export default async function InvitationManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [invitation] = await db
    .select({ id: invitations.id, slug: invitations.slug, config: invitations.config })
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
    .limit(1);
  if (!invitation) notFound();

  const { module } = await searchParams;
  const parsed = detailConfigSchema.safeParse(invitation.config ?? {});
  return <ManageCenter invitationId={invitation.id} slug={invitation.slug} module={module} config={parsed.success ? parsed.data : {}} />;
}
