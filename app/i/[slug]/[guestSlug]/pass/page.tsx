import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { buildGuestView } from '@/components/invitation/guest-view';
import { isFlagOn } from '@/lib/flags';
import { passCheckInEnabled, passExpiresAt, passSigningSecret, signGuestPass } from '@/lib/invitation/guest-pass';
import { loadPublicInvitation } from '@/lib/invitation/public';

// Rendered per request: the token is signed now, and an unknown guest link answers 404 (B-011).
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; guestSlug: string }> };

export const metadata: Metadata = {
  title: 'QR pass tamu',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

/**
 * B-024 (I-01, D-056): the guest's pass, reached from their personal link only. The QR holds a signed token
 * (`lib/invitation/guest-pass.ts`): the pass's random id, an expiry and a MAC, never the guest id. The page shows the
 * guest's display name and the event, nothing else of theirs. Flag off, an invitation that has not opted in, the shared
 * invitation link or a missing secret: 404.
 */
export default async function GuestPassPage({ params }: Params) {
  const { slug, guestSlug } = await params;
  const data = await loadPublicInvitation(slug, guestSlug);
  const secret = passSigningSecret();
  if (!data?.guest || !secret || !isFlagOn('GUEST_PASS') || !passCheckInEnabled(data.invitation.config)) notFound();

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = passExpiresAt(data.config.events ?? [], now);
  const expired = now > expiresAt;
  const token = signGuestPass(secret, data.guest.passId, expiresAt);
  const qr = expired ? null : await QRCode.toDataURL(token, { errorCorrectionLevel: 'M', margin: 2, width: 320, color: { dark: '#000000', light: '#ffffff' } });
  const view = buildGuestView({ invitation: data.invitation, config: data.config, guest: data.guest, media: data.media, messages: [], readOnly: data.readOnly, status: {} });
  const event = view.primaryEvent;
  const title = data.config.settings?.title || 'Undangan';
  const backHref = `/i/${encodeURIComponent(slug)}/${encodeURIComponent(guestSlug)}`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-100 px-4 py-10 text-slate-900" lang="id">
      <section aria-labelledby="pass-title" className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm print:border-0 print:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">QR pass tamu</p>
        <h1 id="pass-title" dir="auto" className="text-balance text-2xl font-bold leading-snug [overflow-wrap:anywhere]">
          {data.guest.name}
        </h1>
        <div className="flex flex-col gap-1 text-sm leading-6 text-slate-600">
          <p dir="auto" className="font-semibold text-slate-800 [overflow-wrap:anywhere]">{title}</p>
          {event?.startAt && (
            <p>
              {view.formatDate(event.startAt)} · {view.formatTime(event.startAt)}
            </p>
          )}
        </div>
        {qr ? (
          <img src={qr} alt={`QR pass untuk ${data.guest.name}`} width={256} height={256} className="h-64 w-64" />
        ) : (
          <p role="status" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            Pass ini sudah tidak berlaku karena acaranya telah lewat.
          </p>
        )}
        <p className="text-pretty text-sm leading-6 text-slate-600">
          Tunjukkan QR ini kepada penerima tamu saat tiba. Pass ini khusus untukmu, mohon tidak dibagikan.
        </p>
      </section>
      <a href={backHref} className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-slate-700 underline underline-offset-4 print:hidden">
        Kembali ke undangan
      </a>
    </main>
  );
}
