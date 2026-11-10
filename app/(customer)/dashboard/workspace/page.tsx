import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { isFlagOn } from '@/lib/flags';
import { memberHome, WORKSPACE_ROLE_AS_MEMBER, WORKSPACE_ROLE_COPY, type TeamRowState } from '@/lib/invitation/members';
import {
  assignableInvitations,
  clientInvitations,
  ownedWorkspace,
  workspaceMemberships,
  workspaceStaff,
  type ClientInvitation,
} from '@/lib/workspace/workspace-db';
import {
  assignClientAction,
  createWorkspaceAction,
  leaveWorkspaceAction,
  revokeStaffAction,
  unassignClientAction,
} from './actions';
import { StaffLinkForm } from './staff-link-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ruang kerja · Invitesion', robots: { index: false, follow: false } };

const NOTICES: Record<string, { text: string; error?: boolean }> = {
  created: { text: 'Ruang kerja dibuat. Tambahkan undangan klien dan staf di bawah.' },
  revoked: { text: 'Akses dicabut. Staf tersebut ditolak sejak permintaan berikutnya.' },
  assigned: { text: 'Undangan klien disimpan.' },
  unassigned: { text: 'Undangan dikembalikan menjadi undangan pribadi. Staf tidak lagi bisa membukanya.' },
  left: { text: 'Anda sudah keluar dari ruang kerja itu.' },
  bergabung: { text: 'Anda sudah bergabung. Undangan klien ruang kerja itu ada di bawah.' },
  name: { text: 'Nama ruang kerja harus 2 sampai 80 karakter.', error: true },
  exists: { text: 'Akun ini sudah memiliki ruang kerja.', error: true },
  client: { text: 'Tulis nama klien, 2 sampai 80 karakter.', error: true },
  notfound: { text: 'Perubahan tidak dapat disimpan. Muat ulang halaman lalu coba lagi.', error: true },
};

const STATE_LABEL: Record<TeamRowState, string> = { active: 'Aktif', pending: 'Menunggu diterima', expired: 'Tautan kedaluwarsa' };
const STATUS_LABEL: Record<string, string> = { DRAFT: 'Draf', PUBLISHED: 'Terbit', EXPIRED: 'Berakhir' };

function noticeFrom(params: Record<string, string | undefined>) {
  if (params.error && NOTICES[params.error]?.error) return NOTICES[params.error];
  const key = ['created', 'revoked', 'assigned', 'unassigned', 'left', 'bergabung'].find((name) => params[name]);
  return key ? NOTICES[key] : null;
}

/**
 * G-052 (D-067): the reseller workspace. Its owner names it, makes their own invitations client invitations and
 * manages staff links; staff see the client invitations of the workspaces they staff, each opening on the page their
 * role allows. Administrator accounts and the flag off: 404.
 */
export default async function WorkspacePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!isFlagOn('WORKSPACES')) notFound();
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'ADMIN') notFound();

  const [owned, memberships, params] = await Promise.all([ownedWorkspace(user.id), workspaceMemberships(user.id), searchParams]);
  const notice = noticeFrom(params);
  const staffed = await Promise.all(memberships.map(async (membership) => ({ membership, invitations: await clientInvitations(membership.workspaceId) })));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-primary">Ruang kerja</p>
        <h1 className="text-balance font-serif text-3xl leading-tight text-foreground">{owned ? owned.name : 'Ruang kerja reseller'}</h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Kelola undangan klien bersama staf. Anda tetap pemilik setiap undangan: isi, tema, pembayaran dan publikasi hanya bisa diubah dari akun
          Anda.
        </p>
      </header>

      {notice ? (
        <p role={notice.error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${notice.error ? 'border-destructive text-destructive' : 'border-border bg-muted text-foreground'}`}>
          {notice.text}
        </p>
      ) : null}

      {owned && owned.disabledAt ? (
        <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
          Ruang kerja ini sedang dinonaktifkan. Staf tidak bisa membuka undangan klien sampai diaktifkan kembali.
        </p>
      ) : null}

      {owned && !owned.disabledAt ? <OwnerSections workspaceId={owned.id} ownerId={user.id} /> : null}

      {!owned ? (
        <section aria-labelledby="create-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <h2 id="create-heading" className="font-serif text-xl text-foreground">
            Buat ruang kerja
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Satu akun memiliki satu ruang kerja. Nama ini terlihat oleh staf yang Anda undang.</p>
          <form action={createWorkspaceAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="workspace-name" className="text-sm font-medium text-foreground">
                Nama ruang kerja
              </label>
              <input
                id="workspace-name"
                name="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Studio Undangan Melati"
                className="rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground"
              />
            </div>
            <button type="submit" className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">
              Buat ruang kerja
            </button>
          </form>
        </section>
      ) : null}

      {staffed.length > 0 ? (
        <section aria-labelledby="staffed-heading" className="flex flex-col gap-4">
          <h2 id="staffed-heading" className="font-serif text-xl text-foreground">
            Ruang kerja tempat Anda bertugas
          </h2>
          {staffed.map(({ membership, invitations }) => (
            <article key={membership.workspaceId} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-lg font-semibold text-foreground">{membership.name}</h3>
                <p className="text-sm text-muted-foreground">Peran: {WORKSPACE_ROLE_COPY[membership.role].name}</p>
              </div>
              {invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada undangan klien di ruang kerja ini.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {invitations.map((invitation) => (
                    <li key={invitation.invitationId} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <ClientName invitation={invitation} />
                      {/* A full page load: the check-in desk needs its own camera policy (D-056). */}
                      <a
                        href={memberHome(invitation.invitationId, WORKSPACE_ROLE_AS_MEMBER[membership.role])}
                        className="w-fit rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                      >
                        {membership.role === 'desk' ? 'Buka meja check-in' : 'Kelola tamu'}
                        <span className="sr-only">: {invitation.clientLabel ?? invitation.slug}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <form action={leaveWorkspaceAction}>
                <input type="hidden" name="workspaceId" value={membership.workspaceId} />
                <button type="submit" className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Keluar dari ruang kerja ini
                </button>
              </form>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function ClientName({ invitation }: { invitation: ClientInvitation }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="break-words font-semibold text-foreground">{invitation.clientLabel ?? 'Tanpa nama klien'}</span>
      <span className="break-words text-sm text-muted-foreground">
        /{invitation.slug} · {STATUS_LABEL[invitation.status] ?? invitation.status}
      </span>
    </div>
  );
}

async function OwnerSections({ workspaceId, ownerId }: { workspaceId: number; ownerId: number }) {
  const [clients, assignable, staff] = await Promise.all([clientInvitations(workspaceId), assignableInvitations(ownerId), workspaceStaff(workspaceId)]);
  return (
    <>
      <section aria-labelledby="clients-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <h2 id="clients-heading" className="font-serif text-xl text-foreground">
          Undangan klien
        </h2>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada. Pilih salah satu undangan Anda di bawah untuk dikelola bersama staf.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {clients.map((invitation) => (
              <li key={invitation.invitationId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <ClientName invitation={invitation} />
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/dashboard/invitations/${invitation.invitationId}/manage`}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    Buka<span className="sr-only"> undangan {invitation.clientLabel ?? invitation.slug}</span>
                  </a>
                  <form action={unassignClientAction}>
                    <input type="hidden" name="invitationId" value={invitation.invitationId} />
                    <button type="submit" className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                      Jadikan pribadi<span className="sr-only">: {invitation.clientLabel ?? invitation.slug}</span>
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        {assignable.length > 0 ? (
          <form action={assignClientAction} className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="assign-invitation" className="text-sm font-medium text-foreground">
                Undangan
              </label>
              <select id="assign-invitation" name="invitationId" className="rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground">
                {assignable.map((invitation) => (
                  <option key={invitation.invitationId} value={invitation.invitationId}>
                    /{invitation.slug}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="assign-client" className="text-sm font-medium text-foreground">
                Nama klien
              </label>
              <input
                id="assign-client"
                name="clientLabel"
                required
                minLength={2}
                maxLength={80}
                placeholder="Budi & Sari"
                className="rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground"
              />
            </div>
            <button type="submit" className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">
              Jadikan undangan klien
            </button>
          </form>
        ) : null}
      </section>

      <section aria-labelledby="staff-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1">
          <h2 id="staff-heading" className="font-serif text-xl text-foreground">
            Staf
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {WORKSPACE_ROLE_COPY.manager.name}: {WORKSPACE_ROLE_COPY.manager.summary} {WORKSPACE_ROLE_COPY.desk.name}: {WORKSPACE_ROLE_COPY.desk.summary}
          </p>
        </div>
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada staf atau tautan aktif.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {staff.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col">
                  <span className="break-words font-semibold text-foreground">{row.label}</span>
                  <span className="break-words text-sm text-muted-foreground">
                    {WORKSPACE_ROLE_COPY[row.role].name} · {STATE_LABEL[row.state]}
                    {row.state === 'active' && row.email ? ` · ${row.name ? `${row.name}, ` : ''}${row.email}` : ''}
                  </span>
                </div>
                <form action={revokeStaffAction}>
                  <input type="hidden" name="rowId" value={row.id} />
                  <button type="submit" className="rounded-full px-4 py-2 text-sm font-semibold text-destructive hover:bg-muted">
                    Cabut<span className="sr-only">: {row.label}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <StaffLinkForm />
      </section>
    </>
  );
}
