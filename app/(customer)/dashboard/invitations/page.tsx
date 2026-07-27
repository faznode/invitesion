import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { ClipboardList, ExternalLink, FileText } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { db } from '@/lib/db/drizzle';
import { invitations } from '@/lib/db/schema';
import { getLocale } from '@/lib/locale-server';
import { invitationStatusLabel } from '@/lib/i18n';
import { invitationPath } from '@/lib/invitation/public-url';
import { publishBlockers } from '@/lib/invitation/publish-rules';
import { paidInvitationIds } from '@/lib/payment/service';
import { publish, unpublish } from './actions';

export const dynamic = 'force-dynamic';

type Search = { published?: string; unpublished?: string; error?: string; why?: string };

export default async function CustomerInvitations({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');

  const locale = await getLocale();
  const en = locale === 'en';
  const feedback = await searchParams;

  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.userId, user.id))
    .orderBy(desc(invitations.createdAt));

  // Which invitations have been paid for, resolved in one query rather than one
  // per card. Publishing is the thing the customer buys, so this decides whether
  // a card offers "publish" or "activate".
  const paidIds = await paidInvitationIds(user.id);
  const cards = rows.map((row) => ({ row, paid: row.id !== null && paidIds.has(row.id) }));

  return (
    <section className="min-h-full bg-slate-50/70 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {en ? 'My workspace' : 'Ruang saya'}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {en ? 'My Invitations' : 'Undangan saya'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {en
                ? 'Manage your digital invitation and its event preparation separately.'
                : 'Kelola undangan digital dan persiapan acaranya secara terpisah.'}
            </p>
          </div>
          <Link
            href="/dashboard/event-blueprint"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            + {en ? 'Build an event' : 'Buat event'}
          </Link>
        </header>

        <Feedback feedback={feedback} en={en} />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ row: r, paid }) => {
            const isPublished = r.status === 'PUBLISHED';
            // Evaluated before the customer clicks, so a disabled button always
            // explains itself instead of failing only on submit.
            const blockers = isPublished ? [] : publishBlockers(r.eventType, r.config);

            return (
              <article
                key={r.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-medium capitalize text-slate-500">
                    <FileText className="h-4 w-4 text-brand-600" />
                    {r.eventType}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {invitationStatusLabel(r.status, locale)}
                  </span>
                </div>

                <h2 className="mt-5 truncate text-lg font-bold text-slate-900">/{r.slug}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {en ? 'Created' : 'Dibuat'}{' '}
                  {r.createdAt.toLocaleDateString(en ? 'en-GB' : 'id-ID')}
                </p>

                {isPublished && r.expiresAt && (
                  <p className="mt-1 text-xs text-slate-500">
                    {en ? 'Active until' : 'Aktif sampai'}{' '}
                    {r.expiresAt.toLocaleDateString(en ? 'en-GB' : 'id-ID')}
                  </p>
                )}

                <div className="mt-5 grid gap-2">
                  <Link
                    href={`/dashboard/invitations/${r.id}/manage`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {en ? 'Open control center' : 'Buka pusat kontrol'}
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/invitations/${r.id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {en ? 'Edit invitation' : 'Edit undangan'}
                    </Link>
                    <Link
                      href={`/dashboard/invitations/${r.id}/planner`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Planner
                    </Link>
                  </div>

                  <PublishControl
                    id={r.id}
                    slug={r.slug}
                    isPublished={isPublished}
                    paid={paid}
                    blockers={blockers}
                    en={en}
                  />
                </div>
              </article>
            );
          })}

          {!rows.length && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              {en ? 'No invitations yet.' : 'Belum ada undangan.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PublishControl({
  id,
  slug,
  isPublished,
  paid,
  blockers,
  en,
}: {
  id: number;
  slug: string;
  isPublished: boolean;
  paid: boolean;
  blockers: string[];
  en: boolean;
}) {
  if (isPublished) {
    return (
      <div className="mt-1 grid gap-2 border-t border-slate-100 pt-3">
        <a
          href={invitationPath(slug)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <ExternalLink className="h-4 w-4" />
          {en ? 'View live page' : 'Lihat halaman live'}
        </a>
        <form action={unpublish}>
          <input type="hidden" name="invitationId" value={id} />
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {en ? 'Unpublish' : 'Tarik dari publik'}
          </button>
        </form>
      </div>
    );
  }

  if (blockers.length) {
    return (
      <div className="mt-1 border-t border-slate-100 pt-3">
        <button
          type="button"
          disabled
          className="inline-flex min-h-10 w-full cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-400"
        >
          {en ? 'Publish' : 'Terbitkan'}
        </button>
        <ul className="mt-2 space-y-1 text-[11px] leading-5 text-amber-700">
          {blockers.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Content is ready but the invitation has not been bought yet. Sending the
  // customer to checkout is more honest than a publish button that redirects
  // there anyway.
  if (!paid) {
    return (
      <div className="mt-1 border-t border-slate-100 pt-3">
        <Link
          href={`/dashboard/invitations/${id}/checkout`}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          {en ? 'Activate & publish' : 'Aktivasi & terbitkan'}
        </Link>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {en ? 'One-time payment, active for 12 months.' : 'Bayar sekali, aktif 12 bulan.'}
        </p>
      </div>
    );
  }

  return (
    <form action={publish} className="mt-1 border-t border-slate-100 pt-3">
      <input type="hidden" name="invitationId" value={id} />
      <button
        type="submit"
        className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-700"
      >
        {en ? 'Publish invitation' : 'Terbitkan undangan'}
      </button>
    </form>
  );
}

function Feedback({ feedback, en }: { feedback: Search; en: boolean }) {
  if (feedback.published) {
    return (
      <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {en
          ? 'Invitation published. The guest link is live for 12 months.'
          : 'Undangan terbit. Tautan tamu aktif selama 12 bulan.'}
      </p>
    );
  }
  if (feedback.unpublished) {
    return (
      <p className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        {en
          ? 'Invitation is back to draft. Its active period was not reset.'
          : 'Undangan kembali ke draf. Masa aktifnya tidak direset.'}
      </p>
    );
  }
  if (feedback.error === 'incomplete') {
    return (
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {(en ? 'Cannot publish yet: ' : 'Belum bisa terbit: ') + (feedback.why ?? '')}
      </p>
    );
  }
  if (feedback.error) {
    return (
      <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {en ? 'That action could not be completed.' : 'Aksi tersebut tidak bisa diselesaikan.'}
      </p>
    );
  }
  return null;
}
