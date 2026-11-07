import { asc, eq } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { db } from '@/lib/db/drizzle';
import { mediaAssets } from '@/lib/db/schema';
import { isFlagOn } from '@/lib/flags';
import { getLocale } from '@/lib/locale-server';
import { loadContentState, loadThemeTier } from '@/lib/invitation/content';
import { normalizeStoredConfig } from '@/lib/invitation/content-read';
import { ownerPreviewPath } from '@/lib/invitation/public-path';
import { themeSwitchOptions } from '@/lib/invitation/theme-switch';
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

  // B-035: the owner's config and its version from one statement, so the editor's first save is checked against the
  // version of exactly the config it shows.
  const invitation = await loadContentState(id, user.id);
  if (!invitation) notFound();

  // The guest page's lenient read (S18-Q4): one section that fails today's rules no longer opens an empty editor.
  const { config } = normalizeStoredConfig(invitation.config ?? {});

  const media = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.invitationId, id))
    .orderBy(asc(mediaAssets.sortOrder), asc(mediaAssets.id));

  const locale = await getLocale();
  // B-036: which catalog themes the picker offers as a free switch; the writers judge each switch again.
  const themeTier = (await loadThemeTier(id, user.id)) ?? 'standard';
  const storedTemplateId = (config.theme as { templateId?: unknown } | undefined)?.templateId;
  const themeOptions = themeSwitchOptions(invitation.eventType, typeof storedTemplateId === 'number' ? storedTemplateId : undefined);

  return (
    <InvitationEditor
      invitationId={id}
      previewHref={ownerPreviewPath(id)}
      embedPreviewHref={`${ownerPreviewPath(id)}?embed=1`}
      eventType={invitation.eventType}
      locale={locale}
      initialConfig={config}
      initialVersion={invitation.version}
      autosave={isFlagOn('EDITOR_AUTOSAVE')}
      themeOptions={themeOptions}
      themeTier={themeTier}
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
