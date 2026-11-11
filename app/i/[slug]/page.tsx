import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { PublicInvitationRenderer } from '@/components/invitation/public-renderer';
import { guestCopy, guestPageLanguage } from '@/lib/invitation/guest-copy';
import { invitationShareMetadata } from '@/lib/invitation/preview-image';
import { loadPublicInvitation, trackInvitationView } from '@/lib/invitation/public';
import { getLocale } from '@/lib/locale-server';
import { saveDataRequested } from '@/lib/media/variants';

// Rendered whole so an unknown or draft invitation answers 404 rather than 200 (B-011; next.config.ts).
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPublicInvitation(slug);
  // A 404 reads in the visitor's locale, like its body and `<html lang>` (G-018).
  if (!data) return { title: guestCopy(await getLocale()).notFoundTitle };
  return {
    title: data.config.settings?.title || guestCopy(guestPageLanguage(data.config)).pageTitle,
    ...invitationShareMetadata(data.invitation, data.config),
    // A guest link is personal; keep it out of search results.
    robots: { index: false, follow: false },
  };
}

/**
 * Invitation without a guest slug. Renders the full invitation but cannot take
 * an RSVP, because RSVP identity comes from the personal guest link.
 */
export default async function PublicInvitationPage({ params }: Params) {
  const { slug } = await params;
  const data = await loadPublicInvitation(slug);
  if (!data) notFound();

  // Deferred until after the response flushes — see the guest page for why.
  after(() => trackInvitationView(data.invitation.id));

  return (
    <PublicInvitationRenderer
      invitation={data.invitation}
      config={data.config}
      guest={null}
      media={data.media}
      messages={data.messages}
      totalMessages={data.totalMessages}
      hiddenMessageCount={data.hiddenMessageCount}
      readOnly={data.readOnly}
      status={{}}
      giftWithheld={data.giftWithheld}
      imageVariants={data.imageVariants}
      saveData={saveDataRequested((await headers()).get('save-data'))}
    />
  );
}
