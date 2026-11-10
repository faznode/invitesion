/**
 * B-031 end to end (D-063): the owner's deletion and restore on a scratch database, through product code. Only Next.js's
 * request primitives and Clerk's session are stubbed; the actions, pages, loaders, routes, access checks and writers are
 * the real ones. Durations are fixture values (a 30-day window), not policy.
 *
 *   POSTGRES_URL=postgres://postgres@127.0.0.1:5433/scratch npx tsx scripts/verify-retention.ts
 *   JOBS_BIN=…/invitesion-jobs POSTGRES_URL=… npx tsx scripts/verify-retention.ts   # plus the Rust purge, cross-language
 *
 * It proves, with the answer and the stored rows each time:
 *  1. availability: flag off, or on without a window, refuses at the action with nothing written; the list offers the
 *     control only when both are set;
 *  2. the boundary: an outsider, a co-host holding a live grant and a post without the confirmation change nothing;
 *  3. the owner's deletion: one transaction writes `deleted_at`, `purge_after` and the purge job (payload, dedupe key,
 *     run time, attempts); a repeat answers `already`; two concurrent deletions write one deletion and one job;
 *  4. gone everywhere: the guest page and personal link, the side routes, the owner preview, the manage page, the
 *     registration page, every access check, every writer (content, host logs, roster, team links, self-registration,
 *     publish, the guest's RSVP form), the public media check; the list shows it deleted with its restore only;
 *  5. restore: refused to an outsider, allowed with the flag off, the invitation back exactly as it was;
 *  6. purged: restore and deletion refused, the tombstone off the list;
 *  7. with JOBS_BIN: the Rust runner consumes the job Next.js wrote (dry run first), the rows and objects go, the
 *     restore then answers "purged".
 * Fixture rows are fictional, tagged per run and removed.
 */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import Module from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}
class NotFound extends Error {}

const session = { clerkUserId: null as string | null };
const stubs: Record<string, unknown> = {
  'server-only': {},
  'next/navigation': {
    redirect: (url: string) => {
      throw new Redirect(url);
    },
    notFound: () => {
      throw new NotFound('notFound');
    },
  },
  'next/cache': { revalidatePath: () => {}, revalidateTag: () => {} },
  'next/headers': {
    headers: async () => new Headers({ 'x-forwarded-proto': 'https', host: 'app.test' }),
    cookies: async () => ({ get: () => undefined, getAll: () => [], has: () => false, set: () => {}, delete: () => {} }),
  },
  '@clerk/nextjs/server': { auth: async () => ({ userId: session.clerkUserId, getToken: async () => null }), currentUser: async () => null },
};
const load = (Module as unknown as { _load: (r: string, ...rest: unknown[]) => unknown })._load;
(Module as unknown as { _load: unknown })._load = function (this: unknown, request: string, ...rest: unknown[]) {
  if (Object.hasOwn(stubs, request)) return stubs[request];
  return load.call(this, request, ...rest);
};

const env = process.env;
if (!env.POSTGRES_URL?.trim()) throw new Error('POSTGRES_URL must be set (see the header of this script)');

let failures = 0;
let passes = 0;
function check(label: string, ok: boolean, detail = '') {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok || !detail ? '' : ` (${detail})`}`);
}

type Outcome = { kind: 'returned'; value: unknown } | { kind: 'redirect'; url: string } | { kind: 'notfound' };
async function outcome(run: () => Promise<unknown>): Promise<Outcome> {
  try {
    return { kind: 'returned', value: await run() };
  } catch (error) {
    if (error instanceof Redirect) return { kind: 'redirect', url: error.url };
    if (error instanceof NotFound) return { kind: 'notfound' };
    throw error;
  }
}
const describe = (o: Outcome) =>
  o.kind === 'redirect' ? `redirect ${o.url}` : o.kind === 'returned' && o.value instanceof Response ? `status ${o.value.status}` : o.kind;
const redirectedTo = (o: Outcome, fragment: string) => o.kind === 'redirect' && o.url.includes(fragment);
const status = (o: Outcome) => (o.kind === 'returned' && o.value instanceof Response ? o.value.status : o.kind === 'notfound' ? 404 : -1);

/** Every element in a rendered tree whose component has this name (nested components are not called). */
function elementsOf(node: unknown, name: string, found: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    for (const child of node) elementsOf(child, name, found);
    return found;
  }
  if (!node || typeof node !== 'object') return found;
  const element = node as { type?: unknown; props?: Record<string, unknown> };
  if (typeof element.type === 'function' && (element.type as { name?: string }).name === name && element.props) found.push(element.props);
  if (element.props) for (const value of Object.values(element.props)) elementsOf(value, name, found);
  return found;
}

/** A `timestamp` column as milliseconds: the raw client returns its text (UTC, no zone), Drizzle a Date. */
function ms(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value !== 'string') return Number.NaN;
  return Date.parse(/[zZ]|[+-]\d\d(:?\d\d)?$/.test(value) ? value : `${value.replace(' ', 'T')}Z`);
}

function form(values: Record<string, string | number>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, String(value));
  return data;
}

const DAY = 86_400_000;

async function main() {
  const { client: sql } = await import('../lib/db/drizzle');
  const deletion = await import('../lib/invitation/deletion-db');
  const actions = await import('../app/(customer)/dashboard/invitations/actions');
  const { default: ListPage } = await import('../app/(customer)/dashboard/invitations/page');
  const { default: GuestPage } = await import('../app/i/[slug]/page');
  const { default: PersonalPage } = await import('../app/i/[slug]/[guestSlug]/page');
  const { GET: calendarRoute } = await import('../app/i/[slug]/calendar.ics/route');
  const { GET: ogRoute } = await import('../app/i/[slug]/og.png/route');
  const { default: PreviewPage } = await import('../app/preview/[id]/page');
  const { default: ManagePage } = await import('../app/(customer)/dashboard/invitations/[id]/manage/page');
  const { default: RegistrationPage } = await import('../app/daftar/[token]/page');
  const { submitRsvp } = await import('../app/i/[slug]/actions');
  const publicLoaders = await import('../lib/invitation/public');
  const members = await import('../lib/invitation/members-db');
  const { requireOwnedInvitation, OwnershipError } = await import('../lib/invitation/service');
  const { writeContentNext } = await import('../lib/invitation/content-next');
  const { addTable } = await import('../lib/invitation/host-logs-db');
  const { addGuestNext, registerNext } = await import('../lib/invitation/roster-next');
  const { PURGE_JOB_KIND, PURGE_MAX_ATTEMPTS } = await import('../lib/invitation/retention');

  const tag = randomUUID().replaceAll('-', '').slice(0, 12);
  const created = { users: [] as number[], invitations: [] as number[] };
  const names = ['FLAG_INVITATION_DELETION', 'INVITATION_DELETION_WINDOW_DAYS', 'FLAG_TEAM_ACCESS', 'FLAG_SELF_REGISTRATION', 'FLAG_GUEST_CALENDAR', 'BACKEND_RSVP', 'BACKEND_CONTENT', 'BACKEND_ROSTER'];
  const saved = Object.fromEntries(names.map((name) => [name, env[name]]));
  for (const name of names) delete env[name];
  env.FLAG_TEAM_ACCESS = 'on';
  env.FLAG_SELF_REGISTRATION = 'on';
  env.FLAG_GUEST_CALENDAR = 'on';
  const uploads = join(tmpdir(), `invitesion-b031-verify-${tag}`);

  type Person = { id: number; clerk: string };
  async function person(name: string): Promise<Person> {
    const clerk = `user_b031v_${name}_${tag}`;
    const [row] = await sql`insert into users (email, clerk_user_id, name) values (${`b031v-${name}-${tag}@example.invalid`}, ${clerk}, ${`Uji ${name}`}) returning id`;
    created.users.push(row.id);
    return { id: row.id as number, clerk };
  }
  const as = (who: Person | null) => {
    session.clerkUserId = who?.clerk ?? null;
  };
  const config = { settings: { title: 'Budi & Sari' }, events: [{ id: 'akad', name: 'Akad', date: '2027-02-14', time: '09:00', venue: 'Masjid Raya', address: 'Jl. Contoh 1' }] };
  async function invitation(owner: Person, name: string): Promise<{ id: number; slug: string }> {
    const slug = `b031v-${name}-${tag}`;
    const [row] = await sql`insert into invitations (user_id, slug, event_type, status, config, published_at, expires_at)
      values (${owner.id}, ${slug}, 'wedding', 'PUBLISHED', ${JSON.stringify(config)}::text::jsonb, now(), now() + interval '300 days') returning id`;
    created.invitations.push(row.id);
    return { id: row.id as number, slug };
  }
  async function guest(invitationId: number, name: string): Promise<{ id: number; slug: string }> {
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomUUID().slice(0, 8)}`;
    const [row] = await sql`insert into guests (invitation_id, name, slug) values (${invitationId}, ${name}, ${slug}) returning id`;
    return { id: row.id as number, slug };
  }
  const rowOf = async (id: number) =>
    (await sql`select status, config, published_at, expires_at, deleted_at, purge_after, purged_at from invitations where id = ${id}`)[0];
  const jobsOf = async (id: number) =>
    sql`select kind, payload, dedupe_key, run_at, max_attempts from jobs where kind = ${PURGE_JOB_KIND} and (payload->>'invitationId')::int = ${id} order by id`;
  const params = <T extends Record<string, string>>(value: T) => ({ params: Promise.resolve(value), searchParams: Promise.resolve({}) });

  try {
    const owner = await person('owner');
    const outsider = await person('outsider');
    const cohost = await person('cohost');
    const mine = await invitation(owner, 'mine');
    const budi = await guest(mine.id, 'Budi Hartono');
    await sql`insert into invitation_members (invitation_id, user_id, role, label, token_hash, expires_at, accepted_at)
      values (${mine.id}, ${cohost.id}, 'cohost', 'Ipar', ${`cohost-${tag}`}, now() + interval '7 days', now())`;
    const teamLink = await members.createJoinLink(owner.id, mine.id, { role: 'usher', label: 'Pintu' });
    const joinToken = teamLink.kind === 'created' ? teamLink.token : '';
    const regToken = `r${tag}${randomUUID().replaceAll('-', '').slice(0, 19)}`;
    await sql`insert into guest_registration_links (invitation_id, token) values (${mine.id}, ${regToken})`;
    const before = await rowOf(mine.id);
    check('fixture: the invitation is live for guests, its owner and its co-host', Boolean(await publicLoaders.loadPublicInvitation(mine.slug, budi.slug)) && Boolean(await members.accessFor(cohost.id, mine.id, 'guests')) && joinToken !== '');

    // ── 1. Availability.
    as(owner);
    let o = await outcome(() => actions.deleteInvitation(form({ invitationId: mine.id, confirm: 'yes' })));
    check('flag off: the action refuses and writes nothing', redirectedTo(o, 'error=deletion-off') && (await rowOf(mine.id)).deleted_at === null && (await jobsOf(mine.id)).length === 0, describe(o));
    let page = await ListPage({ searchParams: Promise.resolve({}) });
    check('flag off: no delete control on the list', elementsOf(page, 'DeleteControl').length === 0);
    env.FLAG_INVITATION_DELETION = 'on';
    o = await outcome(() => actions.deleteInvitation(form({ invitationId: mine.id, confirm: 'yes' })));
    check('flag on without a window: still refused, nothing written', redirectedTo(o, 'error=deletion-off') && (await rowOf(mine.id)).deleted_at === null, describe(o));
    env.INVITATION_DELETION_WINDOW_DAYS = '30';
    page = await ListPage({ searchParams: Promise.resolve({}) });
    const controls = elementsOf(page, 'DeleteControl');
    check('flag on with a window: the card offers deletion with the window', controls.length === 1 && controls[0].id === mine.id && controls[0].windowDays === 30);

    // ── 2. The boundary.
    as(outsider);
    o = await outcome(() => actions.deleteInvitation(form({ invitationId: mine.id, confirm: 'yes' })));
    check('an outsider is refused as "not found", nothing written', redirectedTo(o, 'error=notfound') && (await rowOf(mine.id)).deleted_at === null, describe(o));
    as(cohost);
    o = await outcome(() => actions.deleteInvitation(form({ invitationId: mine.id, confirm: 'yes' })));
    check('a co-host with a live grant cannot delete (owner only)', redirectedTo(o, 'error=notfound') && (await rowOf(mine.id)).deleted_at === null, describe(o));
    as(owner);
    o = await outcome(() => actions.deleteInvitation(form({ invitationId: mine.id })));
    check('a post without the confirmation changes nothing', redirectedTo(o, 'error=unconfirmed') && (await rowOf(mine.id)).deleted_at === null, describe(o));
    as(null);
    o = await outcome(() => actions.deleteInvitation(form({ invitationId: mine.id, confirm: 'yes' })));
    check('signed out: sent to sign in', redirectedTo(o, '/sign-in'), describe(o));

    // ── 3. The owner's deletion.
    as(owner);
    const t = Date.now();
    o = await outcome(() => actions.deleteInvitation(form({ invitationId: mine.id, confirm: 'yes' })));
    const deleted = await rowOf(mine.id);
    const jobs = await jobsOf(mine.id);
    const deletedAt = ms(deleted.deleted_at);
    check('the owner deletes: redirected with the notice', redirectedTo(o, `deleted=${mine.id}`), describe(o));
    check('deleted_at now, purge_after 30 days later, status and content untouched',
      Math.abs(deletedAt - t) < 60_000 && ms(deleted.purge_after) - deletedAt === 30 * DAY && deleted.status === 'PUBLISHED' && JSON.stringify(deleted.config) === JSON.stringify(before.config));
    check('one purge job in the same transaction: payload, dedupe key, run time, attempts',
      jobs.length === 1 && jobs[0].payload.invitationId === mine.id && jobs[0].payload.deletedAt === new Date(deletedAt).toISOString() &&
        jobs[0].dedupe_key === `invitation:${mine.id}:${deletedAt}` && ms(jobs[0].run_at) === ms(deleted.purge_after) && jobs[0].max_attempts === PURGE_MAX_ATTEMPTS,
      JSON.stringify(jobs));
    const again = await deletion.scheduleInvitationDeletion(owner.id, mine.id);
    check('a repeated deletion answers "already" with the original date, no second job', again.kind === 'already' && again.purgeAfter.getTime() === ms(deleted.purge_after) && (await jobsOf(mine.id)).length === 1);
    const racing = await invitation(owner, 'racing');
    const both = await Promise.all([deletion.scheduleInvitationDeletion(owner.id, racing.id), deletion.scheduleInvitationDeletion(owner.id, racing.id)]);
    check('two concurrent deletions: one scheduled, one already, one job', both.map((r) => r.kind).sort().join() === 'already,scheduled' && (await jobsOf(racing.id)).length === 1, JSON.stringify(both));

    // ── 4. Gone everywhere.
    check('guest loaders: the page, a personal link, the owner preview\u2019s load, the side-route loaders all answer nothing',
      !(await publicLoaders.loadPublicInvitation(mine.slug)) && !(await publicLoaders.loadPublicInvitation(mine.slug, budi.slug)) &&
        !(await publicLoaders.loadPublicInvitation(mine.slug, undefined, true)) && !(await publicLoaders.loadPublishedInvitationSummary(mine.slug)) &&
        !(await publicLoaders.loadInvitationForGiftAudience(mine.slug)) && !(await publicLoaders.loadInvitationForGiftAudience(mine.slug, budi.slug)));
    as(null);
    o = await outcome(() => GuestPage(params({ slug: mine.slug }) as never));
    check('the guest page is a 404', o.kind === 'notfound', describe(o));
    o = await outcome(() => PersonalPage(params({ slug: mine.slug, guestSlug: budi.slug }) as never));
    check('the personal link is a 404', o.kind === 'notfound', describe(o));
    o = await outcome(() => calendarRoute(new Request('https://app.test/'), { params: Promise.resolve({ slug: mine.slug }) }));
    check('the calendar file is a 404', status(o) === 404, describe(o));
    o = await outcome(() => ogRoute(new Request('https://app.test/'), { params: Promise.resolve({ slug: mine.slug }) } as never));
    check('the link-preview image is a 404', status(o) === 404, describe(o));
    o = await outcome(() => RegistrationPage({ params: Promise.resolve({ token: regToken }), searchParams: Promise.resolve({}) }));
    check('the self-registration page is a 404', o.kind === 'notfound', describe(o));
    const registered = await registerNext({ token: regToken, row: { name: 'Dewi Lestari' } });
    check('a self-registration post is refused (closed)', registered.kind === 'closed', JSON.stringify(registered));
    const rsvpBefore = (await sql`select rsvp_status from guests where id = ${budi.id}`)[0].rsvp_status;
    o = await outcome(() => submitRsvp(form({ slug: mine.slug, guestSlug: budi.slug, status: 'attending', attendingCount: 1 })));
    const rsvpAfter = (await sql`select rsvp_status from guests where id = ${budi.id}`)[0].rsvp_status;
    check('an old RSVP form posted after the deletion is refused, nothing written', redirectedTo(o, 'rsvp=closed') && rsvpAfter === rsvpBefore, `${describe(o)} ${rsvpBefore}->${rsvpAfter}`);

    as(owner);
    o = await outcome(() => PreviewPage(params({ id: String(mine.id) }) as never));
    check('the owner preview is a 404', o.kind === 'notfound', describe(o));
    o = await outcome(() => ManagePage({ params: Promise.resolve({ id: String(mine.id) }), searchParams: Promise.resolve({}) }));
    check('the manage page is a 404', o.kind === 'notfound', describe(o));
    const ownerError = await requireOwnedInvitation(mine.id, owner.id).then(() => null, (e: unknown) => e);
    check('access checks: owner and co-host hold nothing, requireOwnedInvitation refuses, the shared list drops it',
      !(await members.invitationAccess(owner.id, mine.id)) && !(await members.accessFor(cohost.id, mine.id, 'guests')) && ownerError instanceof OwnershipError &&
        !(await members.sharedInvitations(cohost.id)).some((s) => s.invitationId === mine.id));
    const contentBefore = JSON.stringify((await rowOf(mine.id)).config);
    const written = await writeContentNext({ userId: owner.id, invitationId: mine.id, baseVersion: 0, config: { settings: { title: 'Diubah' } } as never, touchedSections: ['settings'] });
    check('the content writer refuses ("not found"), the config unchanged', written.kind === 'notfound' && JSON.stringify((await rowOf(mine.id)).config) === contentBefore, JSON.stringify(written));
    check('the host-logs writer refuses', (await addTable(owner.id, mine.id, { name: 'Meja 9', capacity: null })).kind === 'notfound');
    const guestsBefore = (await sql`select count(*)::int as n from guests where invitation_id = ${mine.id}`)[0].n;
    const added = await addGuestNext({ userId: owner.id, invitationId: mine.id, row: { name: 'Tamu Baru' }, invitedEventIds: [], flags: { opaqueLinks: true, inviteOnlyEvents: false } });
    const guestsAfter = (await sql`select count(*)::int as n from guests where invitation_id = ${mine.id}`)[0].n;
    check('the roster writer refuses, no guest added', added.kind === 'notfound' && guestsAfter === guestsBefore, JSON.stringify(added));
    check('team links: a new one refused, an issued one shows nothing and cannot be accepted',
      (await members.createJoinLink(owner.id, mine.id, { role: 'usher', label: 'Lagi' })).kind === 'notfound' &&
        (await members.joinPreview(joinToken, outsider.id)).state === 'invalid' && (await members.acceptJoinLink(outsider.id, joinToken)).kind === 'invalid');
    o = await outcome(() => actions.publish(form({ invitationId: mine.id })));
    check('publishing is refused as "not found"', redirectedTo(o, 'error=notfound'), describe(o));
    check('the public media check refuses this invitation\u2019s uploads; an unknown id behaves as before', (await deletion.invitationMediaGone(mine.id)) && !(await deletion.invitationMediaGone(2_000_000_000)));

    page = await ListPage({ searchParams: Promise.resolve({}) });
    const deletedCards = elementsOf(page, 'DeletedCard');
    const mineCard = deletedCards.find((card) => card.id === mine.id);
    check('the list shows it deleted, with the purge date, and no delete control or other link for it',
      Boolean(mineCard) && (mineCard?.purgeAfter as Date).getTime() === ms(deleted.purge_after) && !elementsOf(page, 'DeleteControl').some((c) => c.id === mine.id) && !elementsOf(page, 'PublishControl').some((c) => c.id === mine.id));

    // ── 5. Restore.
    as(outsider);
    o = await outcome(() => actions.restoreInvitation(form({ invitationId: mine.id })));
    check('an outsider cannot restore', redirectedTo(o, 'error=notfound') && (await rowOf(mine.id)).deleted_at !== null, describe(o));
    as(owner);
    delete env.FLAG_INVITATION_DELETION;
    o = await outcome(() => actions.restoreInvitation(form({ invitationId: mine.id })));
    const restored = await rowOf(mine.id);
    check('the owner restores with the flag off', redirectedTo(o, `restored=${mine.id}`) && restored.deleted_at === null && restored.purge_after === null, describe(o));
    check('it returns exactly as it was (status, dates, content)',
      restored.status === before.status && ms(restored.published_at) === ms(before.published_at) && ms(restored.expires_at) === ms(before.expires_at) && JSON.stringify(restored.config) === JSON.stringify(before.config));
    check('guests, the co-host and its public uploads have it back',
      Boolean(await publicLoaders.loadPublicInvitation(mine.slug, budi.slug)) && Boolean(await members.accessFor(cohost.id, mine.id, 'guests')) && !(await deletion.invitationMediaGone(mine.id)));
    check('the earlier job stays, naming the earlier deletion (the purge finds a different deleted_at and does nothing)', (await jobsOf(mine.id))[0]?.payload.deletedAt === new Date(deletedAt).toISOString());
    const restoreLive = await deletion.restoreDeletedInvitation(owner.id, mine.id);
    check('restoring a live invitation answers "live"', restoreLive.kind === 'live');

    // ── 6. Purged (the columns the Rust job leaves): no restore, no deletion, off the list.
    env.FLAG_INVITATION_DELETION = 'on';
    await sql`update invitations set config = null, purged_at = now() where id = ${racing.id}`;
    o = await outcome(() => actions.restoreInvitation(form({ invitationId: racing.id })));
    check('a purged invitation cannot be restored', redirectedTo(o, 'error=purged'), describe(o));
    check('nor deleted again', (await deletion.scheduleInvitationDeletion(owner.id, racing.id)).kind === 'notfound');
    page = await ListPage({ searchParams: Promise.resolve({}) });
    check('the tombstone is off the owner\u2019s list', !elementsOf(page, 'DeletedCard').some((c) => c.id === racing.id) && !elementsOf(page, 'PublishControl').some((c) => c.id === racing.id));

    // ── 7. Cross-language: the Rust runner consumes the job Next.js wrote.
    const jobsBin = env.JOBS_BIN?.trim();
    if (!jobsBin) {
      console.log('SKIP  7 (set JOBS_BIN to the invitesion-jobs binary to run the Rust purge against this job)');
    } else {
      const doomed = await invitation(owner, 'doomed');
      const sari = await guest(doomed.id, 'Sari Wulandari');
      await sql`insert into guest_messages (invitation_id, guest_id, name, message) values (${doomed.id}, ${sari.id}, 'Sari', 'Bahagia selalu')`;
      const keys = [`${doomed.id}/${tag}00000000000a.jpg`, `${doomed.id}/${tag}00000000000b.jpg`, `protected/${doomed.id}/${tag}00000000000c.png`];
      await sql`insert into media_assets (invitation_id, type, url) values (${doomed.id}, 'image', ${`/media/${keys[0]}`})`;
      for (const key of keys) {
        mkdirSync(join(uploads, key, '..'), { recursive: true });
        writeFileSync(join(uploads, key), 'bytes');
      }
      const o7 = await outcome(() => actions.deleteInvitation(form({ invitationId: doomed.id, confirm: 'yes' })));
      // The window passes: a zero-length window is the only shortening the check constraint allows (purge_after >= deleted_at).
      await sql`update invitations set purge_after = deleted_at where id = ${doomed.id}`;
      await sql`update jobs set run_at = (select deleted_at from invitations where id = ${doomed.id}) where kind = ${PURGE_JOB_KIND} and (payload->>'invitationId')::int = ${doomed.id}`;
      const runEnv = { ...env, DATABASE_URL: env.POSTGRES_URL, UPLOAD_ROOT: uploads, RUST_LOG: 'warn' };
      const lastLine = (out: string) => out.trim().split('\n').pop() ?? '{}';
      const plan = JSON.parse(lastLine(execFileSync(jobsBin, ['--plan-purge', String(doomed.id)], { env: runEnv, encoding: 'utf8' })));
      check('the dry run (Rust) sees the deletion due, its rows and all three objects, and changes nothing',
        redirectedTo(o7, `deleted=${doomed.id}`) && plan.state === 'due' && plan.objects.length === 3 &&
          plan.rows.find((r: { table: string }) => r.table === 'guest_messages')?.rows === 1 && existsSync(join(uploads, keys[1])),
        JSON.stringify(plan));
      const pass = JSON.parse(lastLine(execFileSync(jobsBin, [], { env: runEnv, encoding: 'utf8' })));
      const left = (await sql`select (select count(*) from guests where invitation_id = ${doomed.id})::int as guests,
        (select count(*) from guest_messages where invitation_id = ${doomed.id})::int as wishes,
        (select count(*) from media_assets where invitation_id = ${doomed.id})::int as media`)[0];
      const tomb = await rowOf(doomed.id);
      check('the Rust runner purged the rows Next.js deleted', pass.done >= 1 && left.guests === 0 && left.wishes === 0 && left.media === 0 && tomb.purged_at !== null && tomb.config === null, `${JSON.stringify(pass)} ${JSON.stringify(left)}`);
      check('and the objects, including the orphan and the protected photo', keys.every((key) => !existsSync(join(uploads, key))));
      o = await outcome(() => actions.restoreInvitation(form({ invitationId: doomed.id })));
      check('after the purge the owner\u2019s restore answers "purged"', redirectedTo(o, 'error=purged'), describe(o));
    }
  } finally {
    as(null);
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete env[name];
      else env[name] = value;
    }
    if (created.invitations.length) {
      const ids = sql(created.invitations);
      await sql`delete from jobs where kind = ${PURGE_JOB_KIND} and (payload->>'invitationId')::int in ${ids}`;
      await sql`delete from guest_messages where invitation_id in ${ids}`;
      await sql`delete from media_assets where invitation_id in ${ids}`;
      await sql`delete from guest_registrations where invitation_id in ${ids}`;
      await sql`delete from guest_registration_links where invitation_id in ${ids}`;
      await sql`delete from invitation_members where invitation_id in ${ids}`;
      await sql`delete from guests where invitation_id in ${ids}`;
      await sql`delete from invitations where id in ${ids}`;
    }
    if (created.users.length) await sql`delete from users where id in ${sql(created.users)}`;
    rmSync(uploads, { recursive: true, force: true });
    await sql.end();
  }
  console.log(failures ? `verify-retention: ${failures} FAILED, ${passes} passed` : `verify-retention: all ${passes} checks passed`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
