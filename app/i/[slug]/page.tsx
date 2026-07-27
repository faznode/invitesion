import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { PublicInvitationRenderer } from '@/components/invitation/public-renderer';
import { loadPublicInvitation, trackInvitationView } from '@/lib/invitation/public';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadPublicInvitation(slug);
  if (!data) return { title: 'Undangan tidak ditemukan' };
  return {
    title: data.config.settings?.title || 'Undangan Digital',
    description: data.config.settings?.openingCopy ?? undefined,
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
    />
  );
}
