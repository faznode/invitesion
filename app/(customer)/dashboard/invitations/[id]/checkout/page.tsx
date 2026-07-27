import { and, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { CheckCircle2, Clock3, QrCode } from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { orders } from '@/lib/db/schema';
import { getLocale } from '@/lib/locale-server';
import { OwnershipError, requireOwnedInvitation } from '@/lib/invitation/service';
import { formatMoney, isCurrency, money } from '@/lib/payment/money';
import { getProvider, railStatus } from '@/lib/payment/registry';
import { startCheckout } from './actions';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string; paid?: string; cancelled?: string; error?: string }>;
};

/**
 * Payment page for one invitation.
 *
 * Deliberately does not decide anything about payment state. `?paid=1` is only
 * where the provider sent the browser back — it is not evidence of payment, and
 * this page never treats it as such. The status shown is read from our own
 * `orders` row, which only a verified webhook or an operator confirmation can
 * move. A customer who reloads this URL with `?paid=1` gets whatever the database
 * says, which is the point.
 */
export default async function CheckoutPage({ params, searchParams }: Params) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');

  const invitationId = Number((await params).id);
  if (!Number.isInteger(invitationId) || invitationId <= 0) notFound();

  let invitation;
  try {
    invitation = await requireOwnedInvitation(invitationId, user.id);
  } catch (error) {
    if (error instanceof OwnershipError) notFound();
    throw error;
  }

  const query = await searchParams;
  const locale = await getLocale();
  const en = locale === 'en';

  // Ownership is enforced by user id as well as reference, so a guessed
  // reference cannot show someone else's order.
  const [order] = query.ref
    ? await db
        .select()
        .from(orders)
        .where(and(eq(orders.reference, query.ref), eq(orders.userId, user.id)))
        .limit(1)
    : await db
        .select()
        .from(orders)
        .where(and(eq(orders.invitationId, invitationId), eq(orders.userId, user.id)))
        .orderBy(desc(orders.createdAt))
        .limit(1);

  const currency = order && isCurrency(order.currency) ? order.currency : 'IDR';
  const amount = order ? formatMoney(money(order.amount, currency), en ? 'en' : 'id') : null;

  // Rendered server-side into an SVG: no client-side QR library, and the raw
  // payload never has to reach the browser as data.
  let qrSvg: string | null = null;
  let qrisNote: string | null = null;
  if (order?.status === 'PENDING' && order.rail === 'qris') {
    const status = railStatus('qris');
    if (status.available) {
      const provider = getProvider('qris');
      const handle = await provider.createCharge({
        reference: order.reference,
        price: money(order.amount, currency),
        description: `Aktivasi undangan /${invitation.slug}`,
        customerEmail: user.email,
        successUrl: '',
        cancelUrl: '',
      });
      if (handle.qrisPayload) {
        qrSvg = await QRCode.toString(handle.qrisPayload, { type: 'svg', margin: 1, width: 240 });
      }
      qrisNote = status.note ?? null;
    } else {
      qrisNote = status.reason;
    }
  }

  return (
    <section className="min-h-full bg-slate-50/70 p-4 lg:p-8">
      <div className="mx-auto max-w-xl">
        <Link href="/dashboard/invitations" className="text-sm font-semibold text-slate-600 hover:text-brand-700">
          ← {en ? 'My invitations' : 'Undangan saya'}
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {en ? 'Activate invitation' : 'Aktivasi undangan'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">/{invitation.slug}</p>

        {query.error === 'rail' && (
          <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {en
              ? 'Payment is not available right now. Please contact support.'
              : 'Pembayaran belum tersedia saat ini. Silakan hubungi kami.'}
          </p>
        )}

        {invitation.status === 'PUBLISHED' ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {en ? 'This invitation is already live.' : 'Undangan ini sudah tayang.'}
            </p>
          </div>
        ) : !order ? (
          <form action={startCheckout} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="invitationId" value={invitationId} />
            <p className="text-sm text-slate-600">
              {en
                ? 'One-time payment. The invitation goes live for 12 months once payment is confirmed.'
                : 'Bayar sekali. Undangan tayang selama 12 bulan setelah pembayaran dikonfirmasi.'}
            </p>
            <button
              type="submit"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {en ? 'Continue to payment' : 'Lanjut ke pembayaran'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">{en ? 'Amount' : 'Nominal'}</span>
                <span className="text-lg font-bold text-slate-900">{amount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">{en ? 'Reference' : 'Referensi'}</span>
                <span className="font-mono text-xs text-slate-700">{order.reference}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Status</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {order.status === 'PAID' ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                {en ? 'Payment confirmed. Your invitation is live.' : 'Pembayaran terkonfirmasi. Undangan kamu sudah tayang.'}
              </p>
            ) : qrSvg ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-900">
                  <QrCode className="h-4 w-4 text-brand-600" />
                  {en ? 'Scan with any QRIS app' : 'Scan pakai aplikasi apa pun yang mendukung QRIS'}
                </p>
                {/* Server-rendered SVG from our own encoder; no third-party image host. */}
                <div className="mx-auto mt-4 w-[240px]" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <p className="mt-4 text-xs leading-6 text-slate-500">
                  {en
                    ? 'The amount is already embedded in the code — no need to type it.'
                    : 'Nominal sudah tertanam di dalam kode — tidak perlu diketik manual.'}
                </p>
                {qrisNote && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-left text-xs leading-5 text-amber-800">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {en
                      ? 'Payment is verified manually, so activation can take a short while after you pay.'
                      : 'Pembayaran diverifikasi manual, jadi aktivasi bisa perlu waktu sebentar setelah kamu bayar.'}
                  </p>
                )}
              </div>
            ) : order.rail === 'stripe' ? (
              <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                {en
                  ? 'Complete the payment on the Stripe page that was opened. This page updates once payment is confirmed.'
                  : 'Selesaikan pembayaran di halaman Stripe yang terbuka. Halaman ini akan berubah setelah pembayaran terkonfirmasi.'}
              </p>
            ) : (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
                {qrisNote ?? (en ? 'Payment is unavailable.' : 'Pembayaran tidak tersedia.')}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
