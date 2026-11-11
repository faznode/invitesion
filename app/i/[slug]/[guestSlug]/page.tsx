import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { PublicInvitationRenderer } from '@/components/invitation/public-renderer';
import { isFlagOn } from '@/lib/flags';
import { guestCopy, guestLanguageOf } from '@/lib/invitation/guest-copy';
import { passCheckInEnabled, passSigningSecret } from '@/lib/invitation/guest-pass';
import { invitationShareMetadata } from '@/lib/invitation/preview-image';
import { loadPublicInvitation, trackInvitationView } from '@/lib/invitation/public';
import { formKey, rsvpFormKey } from '@/lib/invitation/rsvp-form-key';
import { saveDataRequested } from '@/lib/media/variants';

// Rendered whole, never as a prerendered shell + stream (no Cache Components, no loading boundary above it), so an
// unknown guest link answers 404 rather than 200 (B-011; next.config.ts).
export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ slug: string; guestSlug: string }>;
  searchParams: Promise<{ rsvp?: string; wish?: string; rsvpq?: string; rsvpe?: string; rsvpr?: string; rsvpk?: string; wishr?: string; wishk?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, guestSlug } = await params;
  const data = await loadPublicInvitation(slug, guestSlug);
  if (!data) return { title: 'Undangan tidak ditemukan' };
  return {
    title: data.config.settings?.title || guestCopy(guestLanguageOf(data.config.settings?.language)).pageTitle,
    // Link preview (B-010): per invitation, never per guest — the guest name stays out of shared metadata.
    ...invitationShareMetadata(data.invitation, data.config),
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
  // B-024 (D-056): the pass link only for a recognised guest, with the flag on, the invitation opted in and a secret.
  const guestPassHref =
    data.guest && isFlagOn('GUEST_PASS') && passCheckInEnabled(data.invitation.config) && passSigningSecret()
      ? `/i/${encodeURIComponent(slug)}/${encodeURIComponent(guestSlug)}/pass`
      : null;

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
      rsvpKey={rsvpFormKey(status.rsvp === 'retry' ? status.rsvpk : undefined)}
      wishKey={formKey(status.wish === 'retry' ? status.wishk : undefined)}
      giftWithheld={data.giftWithheld}
      imageVariants={data.imageVariants}
      saveData={saveDataRequested((await headers()).get('save-data'))}
      guestPassHref={guestPassHref}
    />
  );
}
