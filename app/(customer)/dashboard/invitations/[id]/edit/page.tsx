import { and, asc, eq } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { db } from '@/lib/db/drizzle';
import { invitations, mediaAssets } from '@/lib/db/schema';
import { getLocale } from '@/lib/locale-server';
import { detailConfigSchema } from '@/lib/invitation/detail-config';
import { InvitationEditor } from './editor';

export const dynamic = 'force-dynamic';

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
    .limit(1);
  if (!invitation) notFound();

  const parsed = detailConfigSchema.safeParse(invitation.config ?? {});
  const config = parsed.success ? parsed.data : {};

  const media = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.invitationId, id))
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id));

  const locale = await getLocale();

  return (
    <InvitationEditor
      invitationId={id}
      slug={invitation.slug}
      eventType={invitation.eventType}
      locale={locale}
      initialConfig={config}
      initialMedia={media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        sortOrder: m.sortOrder,
        uploadSequence: m.uploadSequence,
      }))}
    />
  );
}
