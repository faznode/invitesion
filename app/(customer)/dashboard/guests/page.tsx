import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getPrivateAdminPath } from '@/lib/auth/admin-access';
import { db } from '@/lib/db/drizzle';
import { guests, invitations } from '@/lib/db/schema';
import { getLocale } from '@/lib/locale-server';
import { rsvpStatusLabel } from '@/lib/i18n';
import { getPublicOrigin, guestPath, toWhatsAppNumber } from '@/lib/invitation/public-url';
import { addGuest, markGuestSent } from './actions';

export const dynamic = 'force-dynamic';

/**
 * Personal share link for one guest. The guest slug is the whole point of the
 * canonical URL format, so it is always part of the link (see handoff 1.5).
 */
function waUrl(origin: string, invitationSlug: string, guest: { phone: string | null; name: string; slug: string }, en: boolean) {
  const number = toWhatsAppNumber(guest.phone);
  if (!number) return null;
  const link = `${origin}${guestPath(invitationSlug, guest.slug)}`;
  const text = en
    ? `Hi ${guest.name}, we would love to have you at our event. Your personal invitation: ${link}`
    : `Halo ${guest.name}, kami mengundang Anda ke acara kami. Undangan personal Anda: ${link}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export default async function CustomerGuests({ searchParams }: { searchParams: Promise<{ added?: string; error?: string; invitation?: string }> }) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');
  const en = (await getLocale()) === 'en';
  const query = await searchParams;
  const invites = await db.select().from(invitations).where(eq(invitations.userId, user.id)).orderBy(desc(invitations.createdAt));
  // Explicit context: which invitation is being managed comes from the URL
  // (?invitation=<id>), never implicitly from "the newest one". Picking
  // invites[0] silently attached guests to whichever invitation happened to be
  // created last — with more than one invitation that is the wrong list to
  // read and the wrong list to write to. The list is already scoped to this
  // user, so an id that is not theirs simply falls back to the default.
  const requestedId = Number(query.invitation);
  const invitation = invites.find((inv) => inv.id === requestedId) ?? invites[0];
  const rows = invitation ? await db.select().from(guests).where(eq(guests.invitationId, invitation.id)).orderBy(desc(guests.id)) : [];
  const confirmed = rows.filter((g) => g.rsvpStatus === 'CONFIRMED').length;
  const origin = await getPublicOrigin();

  return <section className="min-h-full bg-slate-50/70 p-4 lg:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-sm font-semibold text-brand-600">{en ? 'Guest management' : 'Manajemen tamu'}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{en ? 'Guests & RSVP' : 'Tamu & RSVP'}</h1><p className="mt-2 text-sm text-slate-500">{en ? 'Add guests, send each invitation through WhatsApp, and monitor responses.' : 'Tambah tamu, kirim undangan personal lewat WhatsApp, lalu pantau responsnya.'}</p></header>
    {invites.length > 1 && invitation && <nav aria-label={en ? 'Choose invitation' : 'Pilih undangan'} className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-500">{en ? 'Invitation:' : 'Undangan:'}</span>{invites.map((inv) => <Link key={inv.id} href={`/dashboard/guests?invitation=${inv.id}`} aria-current={inv.id === invitation.id ? 'page' : undefined} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${inv.id === invitation.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>/{inv.slug}</Link>)}</nav>}
    {query.added && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{en ? 'Guest added.' : 'Tamu berhasil ditambahkan.'}</p>}
    {query.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{en ? 'Could not save guest. Check the entered details.' : 'Tamu gagal disimpan. Periksa lagi data yang diisi.'}</p>}
    {!invitation ? <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">{en ? 'Create an invitation first before adding guests.' : 'Buat undangan terlebih dahulu sebelum menambah tamu.'}</div> : <>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label={en ? 'Total guests' : 'Total tamu'} value={rows.length}/><Metric label={en ? 'Confirmed RSVP' : 'RSVP hadir'} value={confirmed}/><Metric label={en ? 'Sent' : 'Terkirim'} value={rows.filter((x) => x.sentAt).length}/></div>
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]"><form action={addGuest} className="h-fit rounded-xl border bg-white p-5 shadow-sm"><input type="hidden" name="invitationId" value={invitation.id}/><h2 className="font-bold text-slate-900">{en ? 'Add guest' : 'Tambah tamu'}</h2><p className="mt-1 text-sm text-slate-500">/{invitation.slug}</p><div className="mt-5 space-y-4"><Field name="name" label={en ? 'Guest name' : 'Nama tamu'} required/><Field name="phone" label="WhatsApp" placeholder="0812xxxx"/><Field name="category" label={en ? 'Category' : 'Kategori'} placeholder={en ? 'Family, friend, colleague' : 'Keluarga, teman, kolega'}/><Field name="guestCount" label={en ? 'Number of guests' : 'Jumlah tamu'} type="number" defaultValue="1" required/></div><button className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">{en ? 'Save guest' : 'Simpan tamu'}</button></form>
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-bold text-slate-900">{en ? 'Guest list' : 'Daftar tamu'}</h2><p className="mt-1 text-sm text-slate-500">{en ? 'Each guest gets a personalised WhatsApp action.' : 'Setiap tamu punya aksi WhatsApp personal.'}</p></div>{rows.length ? <div className="divide-y">{rows.map((g) => { const link = waUrl(origin, invitation.slug, g, en); return <article key={g.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-slate-900">{g.name}</h3><p className="mt-1 text-xs text-slate-500">{g.phone || (en ? 'No WhatsApp number' : 'Belum ada nomor WhatsApp')} · {g.category || '—'} · {g.guestCount} {en ? 'guest(s)' : 'tamu'}</p><p className="mt-1 truncate font-mono text-[11px] text-slate-400">{guestPath(invitation.slug, g.slug)}</p></div><span className="text-xs font-medium text-slate-500">{rsvpStatusLabel(g.rsvpStatus, en ? 'en' : 'id')}</span><div className="flex gap-2">{link ? <a href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">WhatsApp</a> : null}<form action={markGuestSent}><input type="hidden" name="guestId" value={g.id}/><input type="hidden" name="invitationId" value={invitation.id}/><button className="rounded-lg border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{g.sentAt ? (en ? 'Sent' : 'Terkirim') : (en ? 'Mark sent' : 'Tandai kirim')}</button></form></div></article> })}</div> : <div className="p-10 text-center text-sm text-slate-500">{en ? 'No guests yet. Add the first one from the form.' : 'Belum ada tamu. Tambahkan tamu pertama dari formulir.'}</div>}</section></div>
    </>}
  </div></section>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div>; }
function Field({ name, label, type = 'text', required, placeholder, defaultValue }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string }) { return <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">{label}</span><input name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} min={type === 'number' ? 1 : undefined} max={type === 'number' ? 50 : undefined} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" /></label>; }
