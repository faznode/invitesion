import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { PublicInvitationRenderer } from '@/components/invitation/public-renderer';
import { loadPublicInvitation, trackInvitationView } from '@/lib/invitation/public';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ slug: string; guestSlug: string }>;
  searchParams: Promise<{ rsvp?: string; wish?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, guestSlug } = await params;
  const data = await loadPublicInvitation(slug, guestSlug);
  if (!data) return { title: 'Undangan tidak ditemukan' };
  return {
    title: data.config.settings?.title || 'Undangan Digital',
    robots: { index: false, follow: false },
  };
}

/**
 * Canonical guest URL: /i/:invitationSlug/:guestSlug (handoff 1.5).
 * The guest slug personalises the page, prefills RSVP, and attributes tracking.
 */
export default async function PersonalInvitationPage({ params, searchParams }: Params) {
  const { slug, guestSlug } = await params;
  const data = await loadPublicInvitation(slug, guestSlug);
  if (!data) notFound();

  // Analytics runs after the response is flushed. Awaiting it here added three
  // sequential database round-trips to time-to-first-byte on the one page that
  // receives a WhatsApp blast to hundreds of guests at once — a traffic shape
  // that is a spike, not a curve. Tracking is best-effort and already swallows
  // its own errors, so deferring it costs nothing.
  after(() => trackInvitationView(data.invitation.id, data.guest?.id));

  const status = await searchParams;

  return (
    <PublicInvitationRenderer
      invitation={data.invitation}
      config={data.config}
      guest={data.guest}
      media={data.media}
      messages={data.messages}
      totalMessages={data.totalMessages}
      hiddenMessageCount={data.hiddenMessageCount}
      readOnly={data.readOnly}
      status={status}
    />
  );
}
