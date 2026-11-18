/**
 * R-04 end to end: the wish call sites, the guest's form action (`submitGuestMessage`) and the host's dashboard actions
 * (`moderateWish`, `replyToWish`), against a running Rust API and a scratch database, through the typed client and the
 * service signature. Only Next.js's request primitives (`redirect`, `revalidatePath`, `headers`) and Clerk's session are
 * stubbed; everything after them is product code, and the redirect an action ends in is the notice the guest or host sees.
 *
 *   POSTGRES_URL=… API_BASE_URL=http://127.0.0.1:8090 INTERNAL_API_SECRET=… OWNER_TOKEN_JWKS_PORT=8091 \
 *     OWNER_TOKEN_ISSUER=https://clerk.invitesion.test OWNER_TOKEN_AUTHORIZED_PARTIES=http://127.0.0.1:3100 \
 *     WISH_LIMIT_LINK=8 WISH_LIMIT_IP=20 npx tsx scripts/verify-wishes-api.ts
 *
 * The API must run with the same OWNER_TOKEN_* values, RATE_LIMIT_WISH_LINK=<link>/600 and RATE_LIMIT_WISH_IP=<ip>/600;
 * scripts/ci/rust.sh starts it so. The owner-token key pair is the one verify-rsvp-api.ts uses for the same API instance
 * (the API refetches its JWKS for an unknown `kid` at most once per 30 s, so both scripts must sign with one key). Fixture
 * rows are fictional, tagged per run and removed.
 *
 * It proves (06 R-04 and the s28 brief): both writers store the same rows and give the same notice, scenario by scenario;
 * moderation stores wishes pending, and pending or hidden wishes never render while replies do; segments that need
 * encoding are signed as sent and never reach another route; exactly one writer per call; a lost answer is retried under
 * the same key and replayed, never written twice; one rendered form stores one wish however often it is sent; limits
 * refuse at their boundary by link, by trusted-proxy address and per IPv6 /64; owner tokens are verified, and ownership
 * and role come from the database; the guest page's wish queries use `guest_messages_invitation_visible_idx` (EXPLAIN).
 */
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import Module from 'node:module';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { JWK } from 'jose';

class Redirect extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}

const session = { clerkUserId: null as string | null, token: null as string | null, headers: new Headers() };
const stubs: Record<string, unknown> = {
  'server-only': {},
  'next/navigation': {
    redirect: (url: string) => {
      throw new Redirect(url);
    },
    notFound: () => {
      throw new Error('notFound() was called');
    },
  },
  'next/cache': { revalidatePath: () => {}, revalidateTag: () => {} },
  'next/headers': { headers: async () => session.headers, cookies: async () => ({ get: () => undefined, getAll: () => [] }) },
  '@clerk/nextjs/server': {
    auth: async () => ({ userId: session.clerkUserId, getToken: async () => session.token }),
    currentUser: async () => null,
  },
};
const load = (Module as unknown as { _load: (r: string, ...rest: unknown[]) => unknown })._load;
(Module as unknown as { _load: unknown })._load = function (this: unknown, request: string, ...rest: unknown[]) {
  if (Object.hasOwn(stubs, request)) return stubs[request];
  return load.call(this, request, ...rest);
};

const env = process.env;
function need(name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} must be set (see the header of this script)`);
  return value;
}
const API = need('API_BASE_URL');
const SECRET = need('INTERNAL_API_SECRET');
const JWKS_PORT = Number(need('OWNER_TOKEN_JWKS_PORT'));
const ISSUER = need('OWNER_TOKEN_ISSUER');
const AZP = need('OWNER_TOKEN_AUTHORIZED_PARTIES').split(',')[0].trim();
const LIMIT_LINK = Number(need('WISH_LIMIT_LINK'));
const LIMIT_IP = Number(need('WISH_LIMIT_IP'));
if (!(LIMIT_LINK >= 6 && LIMIT_IP > LIMIT_LINK + 2)) throw new Error('WISH_LIMIT_LINK must be at least 6 and WISH_LIMIT_IP above it by 3 or more');
// W1.1 (D-071): the in-process default writer counts in the API's buckets, so it must run with the API's limits.
if (env.RATE_LIMIT_WISH_LINK?.trim() !== `${LIMIT_LINK}/600` || env.RATE_LIMIT_WISH_IP?.trim() !== `${LIMIT_IP}/600`) {
  throw new Error('RATE_LIMIT_WISH_LINK and RATE_LIMIT_WISH_IP must be <WISH_LIMIT_LINK>/600 and <WISH_LIMIT_IP>/600, as on the API');
}

let failures = 0;
let passes = 0;
function check(label: string, ok: boolean, detail = '') {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The limiter's bucket for an address key (services/api/src/limits.rs `ip_bucket`), so cleanup can find it. */
const ipBucket = (key: string) =>
  `wish:ip:${createHmac('sha256', SECRET).update('invitesion rate-limit address v1\0').update(key).digest('hex').slice(0, 32)}`;

const servers: http.Server[] = [];
async function listen(handler: http.RequestListener, port = 0): Promise<string> {
  const server = http.createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
async function bodyOf(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}
type Seen = { path: string; key?: string; body: string; signature?: string; status?: number; replayed?: string | null };
const FORWARDED = ['content-type', 'accept', 'x-invitesion-signature', 'idempotency-key', 'authorization', 'x-request-id'];
/** Forwards to the real API; `forward-drop` lets the API commit, then cuts the connection before the answer. */
function proxy(plan: Array<'forward' | 'forward-drop'>) {
  const seen: Seen[] = [];
  const handler: http.RequestListener = async (req, res) => {
    const body = await bodyOf(req);
    const step = plan.shift() ?? 'forward';
    const headers: Record<string, string> = {};
    for (const name of FORWARDED) if (typeof req.headers[name] === 'string') headers[name] = req.headers[name] as string;
    const upstream = await fetch(`${API}${req.url}`, { method: req.method, headers, body: req.method === 'POST' ? body : undefined });
    const text = await upstream.text();
    seen.push({ path: req.url ?? '', key: headers['idempotency-key'], body, status: upstream.status, replayed: upstream.headers.get('idempotent-replayed') });
    if (step === 'forward-drop') {
      req.socket.destroy();
      return;
    }
    res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
    res.end(text);
  };
  return { seen, handler };
}
/** Answers every request 503 without forwarding it, and records what was sent. */
function unavailable() {
  const seen: Seen[] = [];
  const handler: http.RequestListener = async (req, res) => {
    seen.push({ path: req.url ?? '', key: req.headers['idempotency-key'] as string | undefined, body: await bodyOf(req), signature: req.headers['x-invitesion-signature'] as string | undefined });
    res.writeHead(503, { 'content-type': 'application/problem+json' });
    res.end(JSON.stringify({ type: 'https://invitesion.id/problems/database.unavailable', title: 'Unavailable', status: 503, code: 'database.unavailable' }));
  };
  return { seen, handler };
}

async function withEnv<T>(values: Record<string, string | undefined>, run: () => Promise<T>): Promise<T> {
  const saved = Object.fromEntries(Object.keys(values).map((name) => [name, env[name]]));
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete env[name];
    else env[name] = value;
  }
  try {
    return await run();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete env[name];
      else env[name] = value;
    }
  }
}

async function redirectOf(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
    return '(no redirect)';
  } catch (error) {
    if (error instanceof Redirect) return error.url;
    throw error;
  }
}
const notice = (url: string) => Object.fromEntries(new URL(url, 'http://app.test').searchParams);

async function main() {
  const { client: sql } = await import('../lib/db/drizzle');
  const { submitGuestMessage } = await import('../app/i/[slug]/actions');
  const { moderateWish, replyToWish } = await import('../app/(customer)/dashboard/invitations/[id]/wishes/actions');
  const { moderateWishThroughApi, replyToWishThroughApi } = await import('../lib/invitation/wish-writer');
  const { loadPublicInvitation, visibleWishes, visibleWishCount } = await import('../lib/invitation/public');
  const { GuestbookBlock } = await import('../components/invitation/guest-blocks');
  const { buildGuestView } = await import('../components/invitation/guest-view');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { ApiProblem } = await import('../lib/api/client');
  const jose = await import('jose');

  const tag = randomUUID().replaceAll('-', '').slice(0, 12);
  const created = { users: [] as number[], invitations: [] as number[], guests: [] as number[], wishes: [] as number[] };
  const addressKeys = new Set<string>();

  const json = (value: unknown) => (value === undefined ? null : JSON.stringify(value));
  async function user(name: string, role: 'CUSTOMER' | 'ADMIN') {
    const clerk = `user_wishapi_${name}_${tag}`;
    const [row] = await sql`insert into users (email, clerk_user_id, role) values (${`wish-api-${name}-${tag}@example.invalid`}, ${clerk}, ${role}) returning id`;
    created.users.push(row.id);
    return { id: row.id as number, clerk };
  }
  type InvitationSeed = { status?: string; expiresAt?: Date };
  let invitationCount = 0;
  async function invitation(owner: number, config: unknown, seed: InvitationSeed = {}) {
    const slug = `wish-api-${++invitationCount}-${tag}`;
    const expiresAt = seed.expiresAt ? seed.expiresAt.toISOString() : null;
    const [row] = await sql`insert into invitations (user_id, slug, event_type, status, config, expires_at)
      values (${owner}, ${slug}, 'wedding', ${seed.status ?? 'PUBLISHED'}, ${json(config)}::text::jsonb, ${expiresAt}::timestamp) returning id`;
    created.invitations.push(row.id);
    return { id: row.id as number, slug };
  }
  type GuestSeed = { linkToken?: string };
  async function guest(inv: { id: number; slug: string }, name: string, seed: GuestSeed = {}) {
    const slug = `${name}-${tag}`;
    const [row] = await sql`insert into guests (invitation_id, name, slug, link_token)
      values (${inv.id}, ${`${name} (fiktif)`}, ${slug}, ${seed.linkToken ?? null}) returning id`;
    created.guests.push(row.id);
    return { id: row.id as number, slug: inv.slug, segment: seed.linkToken ?? slug, invitationId: inv.id };
  }
  type Target = Awaited<ReturnType<typeof guest>>;
  /** Every column a wish has outside its identity and timestamps; the timestamps are compared as set or not. */
  const wishRows = async (guestId: number) =>
    sql`select name, message, is_hidden, reviewed_at is not null as reviewed, host_reply, replied_at is not null as replied
      from guest_messages where guest_id = ${guestId} order by id`;
  const wishRow = async (id: number) =>
    (await sql`select name, message, is_hidden, reviewed_at is not null as reviewed, host_reply, replied_at is not null as replied
      from guest_messages where id = ${id}`)[0] ?? null;
  const events = async (guestId: number) => (await sql`select meta from analytics_events where guest_id = ${guestId} and event_type = 'GUESTBOOK' order by id`).map((r) => r.meta);
  const keysOf = async (guestId: number) => (await sql`select key from api_idempotency_keys where scope = ${`wish:guest:${guestId}`}`).map((r) => r.key as string);
  async function storedWish(target: Target, message: string, state: 'VISIBLE' | 'PENDING' | 'HIDDEN', hostReply: string | null = null) {
    const [row] = await sql`insert into guest_messages (invitation_id, guest_id, name, message, is_hidden, reviewed_at, host_reply, replied_at)
      values (${target.invitationId}, ${target.id}, ${'Tamu (fiktif)'}, ${message}, ${state !== 'VISIBLE'},
        ${state === 'HIDDEN' ? new Date().toISOString() : null}::timestamp, ${hostReply}, ${hostReply ? new Date().toISOString() : null}::timestamp) returning id`;
    created.wishes.push(row.id);
    return row.id as number;
  }

  async function guestAction(target: Pick<Target, 'slug' | 'segment'>, message: string, backend: 'next' | 'rust', options: { xff?: string; key?: string } = {}) {
    env.BACKEND_WISHES = backend;
    session.headers = new Headers(options.xff === undefined ? {} : { 'x-forwarded-for': options.xff });
    const data = new FormData();
    data.set('slug', target.slug);
    data.set('guestSlug', target.segment);
    data.set('wishKey', options.key ?? randomUUID());
    data.set('message', message);
    return redirectOf(() => submitGuestMessage(data));
  }
  async function hostAction(kind: 'moderate' | 'reply', invitationId: number, wishId: number, value: string, backend: 'next' | 'rust') {
    env.BACKEND_WISHES = backend;
    const data = new FormData();
    data.set('invitationId', String(invitationId));
    data.set('wishId', String(wishId));
    data.set(kind === 'moderate' ? 'action' : 'reply', value);
    return redirectOf(() => (kind === 'moderate' ? moderateWish(data) : replyToWish(data)));
  }

  // Owner tokens: the RS256 key pair verify-rsvp-api.ts keeps for this API instance (named by a hash of its secret).
  const keyFile = join(tmpdir(), `invitesion-rsvp-acceptance-${createHash('sha256').update(SECRET).digest('hex').slice(0, 16)}.json`);
  const stored = existsSync(keyFile) ? (JSON.parse(readFileSync(keyFile, 'utf8')) as { kid: string; privateJwk: JsonWebKey; publicJwk: JsonWebKey }) : null;
  const kid = stored?.kid ?? `rsvp-api-${tag}`;
  let privateKey: CryptoKey;
  let publicJwk: JsonWebKey;
  if (stored) {
    privateKey = (await jose.importJWK(stored.privateJwk as JWK, 'RS256')) as CryptoKey;
    publicJwk = stored.publicJwk;
  } else {
    const pair = await jose.generateKeyPair('RS256', { extractable: true });
    privateKey = pair.privateKey;
    publicJwk = await jose.exportJWK(pair.publicKey);
    writeFileSync(keyFile, JSON.stringify({ kid, privateJwk: await jose.exportJWK(pair.privateKey), publicJwk }), { mode: 0o600 });
  }
  const jwks = JSON.stringify({ keys: [{ ...publicJwk, kid, alg: 'RS256', use: 'sig' }] });
  const stranger = await jose.generateKeyPair('RS256');
  await listen((req, res) => {
    if (req.url === '/.well-known/jwks.json') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(jwks);
    } else {
      res.writeHead(404);
      res.end();
    }
  }, JWKS_PORT);
  type TokenOptions = { key?: CryptoKey; kid?: string; iss?: string; azp?: string; exp?: number };
  const tokenFor = (sub: string, o: TokenOptions = {}) =>
    new jose.SignJWT({ azp: o.azp ?? AZP, sid: `sess_${tag}` })
      .setProtectedHeader({ alg: 'RS256', kid: o.kid ?? kid })
      .setIssuer(o.iss ?? ISSUER)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(o.exp ?? Math.floor(Date.now() / 1000) + 120)
      .sign(o.key ?? privateKey);

  try {
    const owner = await user('owner', 'CUSTOMER');
    const other = await user('other', 'CUSTOMER');
    const admin = await user('admin', 'ADMIN');

    // ── 1. Both writers, scenario by scenario: the same notice, the same wish rows, the same analytics rows ──
    const past = new Date(Date.now() - 3_600_000);
    type Scenario = { name: string; config?: unknown; invitation?: InvitationSeed; seed?: GuestSeed; target?: (g: Target) => Pick<Target, 'slug' | 'segment'>; message: string; expect: string; rows: number };
    const scenarios: Scenario[] = [
      { name: 'an open guestbook stores the trimmed message', config: { guestbook: { enabled: true } }, message: '  Selamat menempuh hidup baru!  ', expect: 'saved', rows: 1 },
      { name: 'an absent section is an open guestbook', message: 'Barakallah', expect: 'saved', rows: 1 },
      { name: 'moderation stores the wish pending', config: { guestbook: { moderation: true } }, message: 'Semoga sakinah', expect: 'pending', rows: 1 },
      { name: 'hosts only stores it visible to the host', config: { guestbook: { visibility: 'host' } }, message: 'Untuk tuan rumah', expect: 'saved', rows: 1 },
      { name: 'moderated and hosts only', config: { guestbook: { moderation: true, visibility: 'host' } }, message: 'Halo', expect: 'pending', rows: 1 },
      { name: 'switched off', config: { guestbook: { enabled: false } }, message: 'Halo', expect: 'closed', rows: 0 },
      { name: 'switched off refuses before judging the message', config: { guestbook: { enabled: false } }, message: '', expect: 'closed', rows: 0 },
      { name: 'a broken section reopens the guestbook (lenient read)', config: { guestbook: { enabled: false, visibility: 'everyone' } }, message: 'Tetap tersimpan', expect: 'saved', rows: 1 },
      { name: 'empty', message: '', expect: 'invalid', rows: 0 },
      { name: 'JavaScript whitespace only', message: '\u00a0\ufeff\u3000\u2028', expect: 'invalid', rows: 0 },
      { name: 'NEL alone is a message', message: '\u0085', expect: 'saved', rows: 1 },
      { name: 'line breaks inside are kept', message: 'Baris satu\r\nBaris dua\n', expect: 'saved', rows: 1 },
      { name: '1,000 units pass', message: 'a'.repeat(1000), expect: 'saved', rows: 1 },
      { name: '1,001 units fail', message: 'a'.repeat(1001), expect: 'invalid', rows: 0 },
      { name: '500 emoji pass', message: '\u{1F389}'.repeat(500), expect: 'saved', rows: 1 },
      { name: '501 emoji fail', message: '\u{1F389}'.repeat(501), expect: 'invalid', rows: 0 },
      { name: 'a NUL character is refused', message: 'Halo\u0000dunia', expect: 'invalid', rows: 0 },
      { name: 'a draft is not public', invitation: { status: 'DRAFT' }, message: 'Halo', expect: 'closed', rows: 0 },
      { name: 'expired by status', invitation: { status: 'EXPIRED' }, message: 'Halo', expect: 'closed', rows: 0 },
      { name: 'expired by date', invitation: { expiresAt: past }, message: 'Halo', expect: 'closed', rows: 0 },
      { name: 'an unknown link', target: (g) => ({ slug: g.slug, segment: `tidak-ada-${tag}` }), message: 'Halo', expect: 'closed', rows: 0 },
      { name: 'a tokened guest is refused by slug (B-011)', seed: { linkToken: 'placeholder' }, target: (g) => ({ slug: g.slug, segment: `tamu-${tag}` }), message: 'Halo', expect: 'closed', rows: 0 },
      { name: 'a token with - and _ writes', seed: { linkToken: 'placeholder' }, message: 'Lewat token', expect: 'saved', rows: 1 },
    ];
    const parityFailures: string[] = [];
    for (const s of scenarios) {
      const results: Record<string, unknown> = {};
      for (const backend of ['next', 'rust'] as const) {
        const inv = await invitation(owner.id, s.config ?? {}, s.invitation);
        const seed = s.seed?.linkToken ? { linkToken: `tok_${backend}-${randomUUID().slice(0, 8)}_x` } : s.seed;
        const g = await guest(inv, 'tamu', seed);
        const url = await guestAction(s.target ? s.target(g) : g, s.message, backend);
        results[backend] = { notice: notice(url), wishes: await wishRows(g.id), events: await events(g.id) };
      }
      const next = results.next as { notice: Record<string, string>; wishes: unknown[]; events: unknown[] };
      const ok = same(results.next, results.rust) && next.notice.wish === s.expect && next.wishes.length === s.rows && next.events.length === s.rows;
      if (!ok) parityFailures.push(`${s.name}: ${JSON.stringify(results)}`);
    }
    check(`${scenarios.length - parityFailures.length} / ${scenarios.length} guest scenarios give the expected notice and identical wish and analytics rows through both writers`, parityFailures.length === 0, parityFailures.join(' | ').slice(0, 1500));

    // ── 2. Segments that need encoding are signed as sent and refused as closed, writing nothing ──
    const encodingInv = await invitation(owner.id, {});
    const encodingGuest = await guest(encodingInv, 'enc');
    const segments = ['a/b', 'a?b', 'a#b', '%', '%2e%2e', 'a b', 'ñ', 'x'.repeat(300), 'a\\b', '../../v1/health', '..', '.', ''];
    const encodingResults: string[] = [];
    for (const segment of segments) {
      for (const backend of ['next', 'rust'] as const) {
        try {
          encodingResults.push(notice(await guestAction({ slug: encodingInv.slug, segment }, 'Halo', backend)).wish ?? '(none)');
          encodingResults.push(notice(await guestAction({ slug: segment || '.', segment: encodingGuest.segment }, 'Halo', backend)).wish ?? '(none)');
        } catch (error) {
          encodingResults.push(`threw ${(error as Error).message}`);
        }
      }
    }
    check(`${segments.length} segments needing encoding, in either position and through both writers, are "closed" with no write and no signature error`,
      encodingResults.every((r) => r === 'closed') && (await wishRows(encodingGuest.id)).length === 0, encodingResults.filter((r) => r !== 'closed').join(', '));

    // ── 3. Exactly one writer per call ──
    const oneInv = await invitation(owner.id, {});
    const downGuest = await guest(oneInv, 'down');
    const formKey = `form-${tag}-down`;
    const down = await withEnv({ API_BASE_URL: 'http://127.0.0.1:9' }, () => guestAction(downGuest, 'Halo', 'rust', { key: formKey }));
    check('under `rust` with the API down: "unconfirmed" with the form\u2019s key, and nothing written by any writer',
      notice(down).wish === 'retry' && notice(down).wishk === formKey && (await wishRows(downGuest.id)).length === 0, down);
    const busy = unavailable();
    const busyUrl = await listen(busy.handler);
    const busyGuest = await guest(oneInv, 'busy');
    const busyAnswer = await withEnv({ API_BASE_URL: busyUrl }, () => quietly(() => guestAction(busyGuest, 'Halo', 'rust')));
    check('an API answering 503 is asked exactly twice, under one key, with the same signed path and bytes; nothing is written',
      busy.seen.length === 2 && busy.seen[0].key === busy.seen[1].key && busy.seen[0].path === busy.seen[1].path && busy.seen[0].body === busy.seen[1].body &&
        notice(busyAnswer).wish === 'retry' && (await wishRows(busyGuest.id)).length === 0, JSON.stringify(busy.seen.map((s) => s.path)));
    const recorder = unavailable();
    const recorderUrl = await listen(recorder.handler);
    const nextGuest = await guest(oneInv, 'next');
    const nextAnswer = await withEnv({ API_BASE_URL: recorderUrl }, () => guestAction(nextGuest, 'Halo', 'next'));
    check('under `next` the API is never called', recorder.seen.length === 0 && notice(nextAnswer).wish === 'saved' && (await wishRows(nextGuest.id)).length === 1);

    // ── 4. Transport ambiguity: a committed wish whose answer is lost is replayed, never stored twice ──
    const lost = proxy(['forward-drop', 'forward']);
    const lostUrl = await listen(lost.handler);
    const lostGuest = await guest(oneInv, 'lost');
    const lostAnswer = await withEnv({ API_BASE_URL: lostUrl }, () => guestAction(lostGuest, 'Bahagia selalu', 'rust'));
    check('the API commits and the answer is lost: the retry replays (`Idempotent-Replayed: true`) and one wish is stored',
      notice(lostAnswer).wish === 'saved' && lost.seen.length === 2 && lost.seen[1].replayed === 'true' && (await wishRows(lostGuest.id)).length === 1, JSON.stringify(lost.seen.map((s) => s.replayed)));
    const both = proxy(['forward-drop', 'forward-drop']);
    const bothUrl = await listen(both.handler);
    const bothGuest = await guest(oneInv, 'both');
    const bothAnswer = await withEnv({ API_BASE_URL: bothUrl }, () => quietly(() => guestAction(bothGuest, 'Doa terbaik', 'rust')));
    const carried = notice(bothAnswer).wishk;
    const resent = await guestAction(bothGuest, 'Doa terbaik', 'rust', { key: carried });
    check('both answers lost: "unconfirmed" with the key; re-sending the same wish under the carried key replays (still one wish)',
      notice(bothAnswer).wish === 'retry' && typeof carried === 'string' && notice(resent).wish === 'saved' && (await wishRows(bothGuest.id)).length === 1, `${bothAnswer} → ${resent}`);
    const changed = await guestAction(bothGuest, 'Doa yang lain', 'rust', { key: carried });
    check('the carried key with a changed message stores it once, as a new wish', notice(changed).wish === 'saved' && (await wishRows(bothGuest.id)).length === 2);

    // ── 5. One rendered form stores one wish however often it is sent ──
    const twinGuest = await guest(oneInv, 'twin');
    const twinKey = `form-${tag}-twins`;
    const twins = await Promise.all(Array.from({ length: 6 }, () => guestAction(twinGuest, 'Kembar enam', 'rust', { key: twinKey })));
    check('6 concurrent sends of one form: all "saved", one wish, one analytics row, one stored key',
      twins.every((url) => notice(url).wish === 'saved') && (await wishRows(twinGuest.id)).length === 1 && (await events(twinGuest.id)).length === 1 && (await keysOf(twinGuest.id)).length === 1,
      twins.map((url) => notice(url).wish).join(','));
    const badKeyGuest = await guest(oneInv, 'badkey');
    const badKey = await guestAction(badKeyGuest, 'Halo', 'rust', { key: 'not a key!' });
    const minted = await keysOf(badKeyGuest.id);
    check('an invalid form key is ignored and the writer mints one', notice(badKey).wish === 'saved' && minted.length === 1 && /^[0-9a-f-]{36}$/.test(minted[0]), minted.join(','));

    // ── 6. Limits (B-013): by link, by trusted-proxy address (IPv4 and IPv6 /64), at their boundary ──
    const limitInv = await invitation(owner.id, {});
    const linkGuest = await guest(limitInv, 'link');
    const linkAnswers: string[] = [];
    for (let n = 0; n <= LIMIT_LINK; n++) linkAnswers.push(await guestAction(linkGuest, `Ucapan ${n}`, 'rust'));
    const refused = notice(linkAnswers[LIMIT_LINK]);
    check(`per link: ${LIMIT_LINK} pass and the next is "busy" with a retry time inside the window, writing nothing`,
      linkAnswers.slice(0, LIMIT_LINK).every((url) => notice(url).wish === 'saved') && refused.wish === 'busy' && Number(refused.wishr) >= 1 && Number(refused.wishr) <= 600 &&
        (await wishRows(linkGuest.id)).length === LIMIT_LINK, JSON.stringify(refused));

    const ipv4 = `198.18.${Number.parseInt(tag.slice(0, 2), 16)}.${Number.parseInt(tag.slice(2, 4), 16)}`;
    addressKeys.add(ipv4);
    const addressGuests = [await guest(limitInv, 'ip-a'), await guest(limitInv, 'ip-b'), await guest(limitInv, 'ip-c')];
    const addressAnswers: string[] = [];
    for (let n = 0; n < LIMIT_IP; n++) addressAnswers.push(await guestAction(addressGuests[n % 3], `Dari satu jaringan ${n}`, 'rust', { xff: ipv4 }));
    const overAddress = await guestAction(addressGuests[0], 'Satu lagi', 'rust', { xff: ipv4 });
    const forged = await guestAction(addressGuests[1], 'Menyamar', 'rust', { xff: `203.0.113.250, ${ipv4}` });
    const stored3 = (await Promise.all(addressGuests.map((g) => wishRows(g.id)))).reduce((n, rows) => n + rows.length, 0);
    check(`per address: ${LIMIT_IP} wishes over 3 links pass, the next is "busy", and a client-supplied left entry does not escape the trusted proxy's address`,
      addressAnswers.every((url) => notice(url).wish === 'saved') && notice(overAddress).wish === 'busy' && notice(forged).wish === 'busy' && stored3 === LIMIT_IP, `${notice(overAddress).wish} ${notice(forged).wish} ${stored3}`);

    const prefix = `2001:db8:${tag.slice(0, 4)}:${tag.slice(4, 8)}`;
    addressKeys.add(`${prefix.replace(/:0+([0-9a-f])/g, ':$1')}::/64`);
    const nextPrefix = `2001:db8:${tag.slice(0, 4)}:${(Number.parseInt(tag.slice(4, 8), 16) ^ 1).toString(16)}`;
    addressKeys.add(`${nextPrefix.replace(/:0+([0-9a-f])/g, ':$1')}::/64`);
    const v6Guests = [await guest(limitInv, 'v6-a'), await guest(limitInv, 'v6-b'), await guest(limitInv, 'v6-c')];
    const v6Answers: string[] = [];
    for (let n = 0; n <= LIMIT_IP; n++) v6Answers.push(await guestAction(v6Guests[n % 3], `IPv6 ${n}`, 'rust', { xff: `${prefix}::${(n + 1).toString(16)}` }));
    const otherLine = await guestAction(await guest(limitInv, 'v6-d'), 'Jalur lain', 'rust', { xff: `${nextPrefix}::1` });
    check(`IPv6: ${LIMIT_IP} addresses of one /64 share one bucket (the ${LIMIT_IP + 1}st is "busy"), the next /64 has its own`,
      v6Answers.slice(0, LIMIT_IP).every((url) => notice(url).wish === 'saved') && notice(v6Answers[LIMIT_IP]).wish === 'busy' && notice(otherLine).wish === 'saved',
      `${notice(v6Answers[LIMIT_IP]).wish} ${notice(otherLine).wish}`);
    const [{ plain }] = await sql`select count(*)::int as plain from api_rate_limits where bucket like 'wish:ip:%' and (bucket like ${`%${ipv4}%`} or bucket like '%2001:db8%')`;
    check('the limiter table holds keyed hashes, never an address', plain === 0);

    // ── 6b. W1.1 (D-071): the default writer counts the same quota, in the same buckets, where the Rust writer counts ──
    const { addressKey, WRITE_LIMIT_DEFAULTS } = await import('../lib/rate-limit-keys');
    const hitsOf = async (bucket: string) => Number((await sql`select hits from api_rate_limits where bucket = ${bucket}`)[0]?.hits ?? 0);
    /** Seconds from now to the end of the 600 s window, so a refusal's retry time can be checked against the clock. */
    const toWindowEnd = () => 600 - (Math.floor(Date.now() / 1000) % 600);
    const retryFits = (raw: string | undefined) => {
      const gap = Math.abs(Number(raw) - toWindowEnd());
      return Number(raw) >= 1 && Number(raw) <= 600 && (gap <= 2 || gap >= 598);
    };
    const written = async (guestId: number) => ({ wishes: (await wishRows(guestId)).length, events: (await events(guestId)).length });
    const nextLinkGuest = await guest(limitInv, 'next-link');
    const nextLinkAnswers: string[] = [];
    for (let n = 0; n <= LIMIT_LINK; n++) nextLinkAnswers.push(await guestAction(nextLinkGuest, `Ucapan lewat Next ${n}`, 'next'));
    const nextRefused = notice(nextLinkAnswers[LIMIT_LINK]);
    check(`W1.1 next per link: ${LIMIT_LINK} pass and the next is "busy" with the retry time to the window's end, writing nothing, as through Rust`,
      nextLinkAnswers.slice(0, LIMIT_LINK).every((url) => notice(url).wish === 'saved') && same(Object.keys(nextRefused), Object.keys(refused)) && nextRefused.wish === 'busy' &&
        retryFits(nextRefused.wishr) && same(await written(nextLinkGuest.id), { wishes: LIMIT_LINK, events: LIMIT_LINK }) &&
        (await hitsOf(`wish:link:${nextLinkGuest.id}`)) === LIMIT_LINK + 1,
      JSON.stringify(nextRefused));

    const linkFlips: string[] = [];
    for (const [first, second] of [['next', 'rust'], ['rust', 'next']] as const) {
      const g = await guest(limitInv, `flip-link-${first}`);
      const answers: string[] = [];
      for (let i = 0; i < 3; i++) answers.push(await guestAction(g, `Pertama ${i}`, first));
      for (let i = 0; i <= LIMIT_LINK - 3; i++) answers.push(await guestAction(g, `Kedua ${i}`, second));
      const last = notice(answers[LIMIT_LINK]);
      const ok = answers.slice(0, LIMIT_LINK).every((url) => notice(url).wish === 'saved') && last.wish === 'busy' && retryFits(last.wishr) &&
        same(await written(g.id), { wishes: LIMIT_LINK, events: LIMIT_LINK }) && (await hitsOf(`wish:link:${g.id}`)) === LIMIT_LINK + 1;
      linkFlips.push(`${first} then ${second}: ${ok ? 'ok' : 'FAIL'} (hits ${await hitsOf(`wish:link:${g.id}`)}, last ${last.wish})`);
    }
    check(`W1.1 shared per-link bucket: after 3 wishes through one writer the other allows exactly the remaining ${LIMIT_LINK - 3} and refuses the next, both ways`,
      linkFlips.every((f) => f.includes(': ok')), linkFlips.join('; '));

    /** `count` wishes through one writer from one address (or one /64), spread over fresh guests under the per-link limit. */
    async function fillVia(writer: 'next' | 'rust', prefix: string, address: string | ((n: number) => string), count: number): Promise<boolean> {
      let left = count;
      let n = 0;
      for (let index = 0; left > 0; index++) {
        const g = await guest(limitInv, `${prefix}-${index}`);
        for (let i = 0; i < Math.min(LIMIT_LINK, left); i++) {
          const xff = typeof address === 'string' ? address : address(n++);
          if (notice(await guestAction(g, `Dari ${prefix} ${n} ${i}`, writer, { xff })).wish !== 'saved') return false;
        }
        left -= Math.min(LIMIT_LINK, left);
      }
      return true;
    }
    const [a, b] = [Number.parseInt(tag.slice(0, 2), 16), Number.parseInt(tag.slice(2, 4), 16)];
    const nextAddress = `198.19.${a}.${b}`;
    const neighbour = `198.19.${a}.${(b + 1) % 256}`;
    const flipAddresses = [`198.19.${(a + 1) % 256}.${b}`, `198.19.${(a + 2) % 256}.${b}`];
    const v6Prefix = `2001:db8:${tag.slice(8, 12)}:${tag.slice(0, 4)}`;
    const v6Other = `2001:db8:${tag.slice(8, 12)}:${(Number.parseInt(tag.slice(0, 4), 16) ^ 1).toString(16)}`;
    for (const raw of [nextAddress, neighbour, ...flipAddresses, `${v6Prefix}::1`, `${v6Other}::1`]) addressKeys.add(addressKey(raw) as string);
    const nextFilled = await fillVia('next', 'nip4', nextAddress, LIMIT_IP);
    const nextFresh = await guest(limitInv, 'nip4-fresh');
    const nextFull = notice(await guestAction(nextFresh, 'Penuh', 'next', { xff: nextAddress }));
    const nextForged = notice(await guestAction(nextFresh, 'Menyamar', 'next', { xff: `203.0.113.250, ${nextAddress}` }));
    const nextNeighbour = notice(await guestAction(nextFresh, 'Tetangga', 'next', { xff: neighbour }));
    const nextUntrusted = notice(await withEnv({ TRUSTED_PROXY_HOPS: '0' }, () => guestAction(nextFresh, 'Tanpa proksi', 'next', { xff: nextAddress })));
    const nextKeyless = notice(await withEnv({ INTERNAL_API_SECRET: undefined }, () => guestAction(nextFresh, 'Tanpa kunci', 'next', { xff: nextAddress })));
    check(`W1.1 next per address: ${LIMIT_IP} wishes from one address pass, the next is "busy"; a client-supplied left entry does not escape it; another address writes`,
      nextFilled && nextFull.wish === 'busy' && retryFits(nextFull.wishr) && nextForged.wish === 'busy' && nextNeighbour.wish === 'saved' &&
        (await hitsOf(ipBucket(nextAddress))) === LIMIT_IP + 2,
      `filled ${nextFilled}, full ${nextFull.wish}, forged ${nextForged.wish}, other address ${nextNeighbour.wish}, hits ${await hitsOf(ipBucket(nextAddress))}`);
    check('W1.1 next: TRUSTED_PROXY_HOPS=0 or no INTERNAL_API_SECRET means no per-address limit; the per-link one still counts',
      nextUntrusted.wish === 'saved' && nextKeyless.wish === 'saved' && (await hitsOf(`wish:link:${nextFresh.id}`)) === 5, `hops 0 ${nextUntrusted.wish}, no secret ${nextKeyless.wish}`);
    const v6Filled = await fillVia('next', 'nip6', (n) => `${v6Prefix}::${(n + 1).toString(16)}`, LIMIT_IP);
    const v6Fresh = await guest(limitInv, 'nip6-fresh');
    const v6SameLine = notice(await guestAction(v6Fresh, 'Satu jalur', 'next', { xff: `[${v6Prefix}:ffff::1]:443` }));
    const v6NextLine = notice(await guestAction(v6Fresh, 'Jalur lain', 'next', { xff: `${v6Other}::1` }));
    const v6Key = addressKey(`${v6Prefix}::1`) as string;
    check('W1.1 next: IPv6 addresses share their /64\u2019s budget, the next /64 has its own',
      v6Filled && v6SameLine.wish === 'busy' && v6NextLine.wish === 'saved' && (await hitsOf(ipBucket(v6Key))) === LIMIT_IP + 1,
      `same /64 ${v6SameLine.wish}, next /64 ${v6NextLine.wish}, hits ${await hitsOf(ipBucket(v6Key))}`);

    const addressFlips: string[] = [];
    for (const [index, [first, second]] of ([['next', 'rust'], ['rust', 'next']] as const).entries()) {
      const address = flipAddresses[index];
      const firstOk = await fillVia(first, `flip-ip-${first}-a`, address, 5);
      const secondOk = await fillVia(second, `flip-ip-${first}-b`, address, LIMIT_IP - 5);
      const over = notice(await guestAction(await guest(limitInv, `flip-ip-${first}-c`), 'Lebih', second, { xff: address }));
      const ok = firstOk && secondOk && over.wish === 'busy' && (await hitsOf(ipBucket(address))) === LIMIT_IP + 1;
      addressFlips.push(`${first} then ${second}: ${ok ? 'ok' : 'FAIL'} (hits ${await hitsOf(ipBucket(address))}, last ${over.wish})`);
    }
    check(`W1.1 shared per-address bucket: after 5 wishes through one writer the other allows exactly the remaining ${LIMIT_IP - 5} and refuses the next, both ways`,
      addressFlips.every((f) => f.includes(': ok')), addressFlips.join('; '));

    // Closed invitations: a link-level closure is refused before any count by both writers; the guestbook switched off is
    // a decision, counted first by both (the Rust order), so over quota both answer "busy" where it would say "closed".
    const pastDate = new Date(Date.now() - 3_600_000);
    const closures = [
      { name: 'deleted', level: 'link', inv: await invitation(owner.id, {}) },
      { name: 'draft', level: 'link', inv: await invitation(owner.id, {}, { status: 'DRAFT' }) },
      { name: 'expired', level: 'link', inv: await invitation(owner.id, {}, { expiresAt: pastDate }) },
      { name: 'guestbook off', level: 'decision', inv: await invitation(owner.id, { guestbook: { enabled: false } }) },
    ] as const;
    const closureResults: string[] = [];
    for (const [index, closure] of closures.entries()) {
      const targets = { next: await guest(closure.inv, `w11-c${index}-next`), rust: await guest(closure.inv, `w11-c${index}-rust`) };
      // B-031's constraint: a deletion always carries its purge time.
      if (closure.name === 'deleted') await sql`update invitations set deleted_at = now(), purge_after = now() + interval '30 days' where id = ${closure.inv.id}`;
      for (const writer of ['next', 'rust'] as const) {
        const target = targets[writer];
        const notices: string[] = [];
        for (let i = 0; i <= LIMIT_LINK; i++) notices.push(notice(await guestAction(target, `Tertutup ${i}`, writer)).wish);
        const counted = await hitsOf(`wish:link:${target.id}`);
        const expected = closure.level === 'link'
          ? notices.every((n) => n === 'closed') && counted === 0
          : notices.slice(0, LIMIT_LINK).every((n) => n === 'closed') && notices[LIMIT_LINK] === 'busy' && counted === LIMIT_LINK + 1;
        const untouched = same(await written(target.id), { wishes: 0, events: 0 });
        closureResults.push(`${closure.name} ${writer}: ${expected && untouched ? 'ok' : 'FAIL'} (over quota "${notices[LIMIT_LINK]}", hits ${counted})`);
      }
    }
    check('W1.1 closed invitations: both writers refuse and write nothing; link-level closures are never counted, the guestbook off is counted alike and answers "busy" over quota',
      closureResults.every((r) => r.includes(': ok')), closureResults.join('; '));

    const offGuest = await guest(limitInv, 'w11-flag-off');
    const fullBefore = await hitsOf(ipBucket(nextAddress));
    const offAnswers = await withEnv({ FLAG_GUEST_WRITE_LIMITS: 'off' }, async () => {
      const urls: string[] = [];
      for (let i = 0; i < LIMIT_LINK + 2; i++) urls.push(await guestAction(offGuest, `Tanpa batas ${i}`, 'next', { xff: nextAddress }));
      return urls;
    });
    check('W1.1 FLAG_GUEST_WRITE_LIMITS=off: the default writer calls no limiter, exactly as before (every wish saved from a full address, no bucket touched)',
      offAnswers.every((url) => notice(url).wish === 'saved') && same(await written(offGuest.id), { wishes: LIMIT_LINK + 2, events: LIMIT_LINK + 2 }) &&
        (await hitsOf(`wish:link:${offGuest.id}`)) === 0 && (await hitsOf(ipBucket(nextAddress))) === fullBefore,
      `${offAnswers.filter((url) => notice(url).wish === 'saved').length} saved`);

    const fallbackMax = WRITE_LIMIT_DEFAULTS.wish.perLink.max;
    const fallbackGuest = await guest(limitInv, 'w11-fallback');
    const fallbackAnswers = await withEnv({ RATE_LIMIT_WISH_LINK: 'lima/600' }, async () => {
      const urls: string[] = [];
      for (let i = 0; i <= fallbackMax; i++) urls.push(await guestAction(fallbackGuest, `Cadangan ${i}`, 'next'));
      return urls;
    });
    check(`W1.1 an invalid RATE_LIMIT_WISH_LINK falls back to the default (${fallbackMax} per link), as the API's Limit::parse does`,
      fallbackAnswers.slice(0, fallbackMax).every((url) => notice(url).wish === 'saved') && notice(fallbackAnswers[fallbackMax]).wish === 'busy');
    const allBuckets = (await sql`select bucket from api_rate_limits where bucket like 'wish:%'`).map((r) => r.bucket as string);
    check('W1.1 the limiter table still holds only guest ids and keyed hashes: no address, no name',
      allBuckets.length > 0 && allBuckets.every((bucket) => /^wish:(?:link:\d+|ip:[0-9a-f]{32})$/.test(bucket)), `${allBuckets.length} buckets`);

    // ── 6c. W1.2 (D-072): the default writer honours the form's key like the Rust writer, in the same records ──
    const { writeGuestWishThroughApi } = await import('../lib/invitation/wish-writer');
    const keyInv = await invitation(owner.id, {});
    const moderatedInv = await invitation(owner.id, { guestbook: { moderation: true } });
    const twinRuns: string[] = [];
    for (const writer of ['next', 'rust'] as const) {
      const g = await guest(keyInv, `w12-twins-${writer}`);
      const key = randomUUID();
      const urls = await Promise.all(Array.from({ length: 5 }, () => guestAction(g, 'Kembar lima', writer, { key })));
      const ok = urls.every((url) => notice(url).wish === 'saved') && same(await written(g.id), { wishes: 1, events: 1 }) && same(await keysOf(g.id), [key]);
      twinRuns.push(`${writer}: ${ok ? 'ok' : 'FAIL'} (${JSON.stringify(await written(g.id))}, keys ${(await keysOf(g.id)).length}, link hits ${await hitsOf(`wish:link:${g.id}`)})`);
    }
    check('W1.2 five concurrent sends of one form: all "saved", one wish, one analytics row, one stored key, on each writer (link hits as measured)',
      twinRuns.every((r) => r.includes(': ok')), twinRuns.join('; '));

    const seqGuest = await guest(moderatedInv, 'w12-sequential');
    const seqKey = randomUUID();
    const seqFirst = notice(await guestAction(seqGuest, 'Menunggu tuan rumah', 'next', { key: seqKey })).wish;
    const seqHits = await hitsOf(`wish:link:${seqGuest.id}`);
    const seqAgain: string[] = [];
    for (let i = 0; i < 3; i++) seqAgain.push(notice(await guestAction(seqGuest, 'Menunggu tuan rumah', 'next', { key: seqKey })).wish);
    check('W1.2 next: three sequential re-sends of one moderated wish replay "pending", store nothing more and take no limiter hit',
      seqFirst === 'pending' && seqAgain.every((n) => n === 'pending') && same(await written(seqGuest.id), { wishes: 1, events: 1 }) && seqHits === 1 &&
        (await hitsOf(`wish:link:${seqGuest.id}`)) === 1,
      `${seqAgain.join(',')}, hits ${await hitsOf(`wish:link:${seqGuest.id}`)}`);

    const crossRuns: string[] = [];
    for (const [label, inv, expected] of [['open', keyInv, 'saved'], ['moderated', moderatedInv, 'pending']] as const) {
      for (const [first, second] of [['next', 'rust'], ['rust', 'next']] as const) {
        const g = await guest(inv, `w12-cross-${label}-${first}`);
        const key = randomUUID();
        const message = `Lintas penulis ${label} ${first}`;
        const a = notice(await guestAction(g, message, first, { key })).wish;
        const hitsBefore = await hitsOf(`wish:link:${g.id}`);
        const b = notice(await guestAction(g, message, second, { key })).wish;
        const ok = a === expected && b === expected && same(await written(g.id), { wishes: 1, events: 1 }) && same(await keysOf(g.id), [key]) &&
          (await hitsOf(`wish:link:${g.id}`)) === hitsBefore;
        crossRuns.push(`${label}, ${first} then ${second}: ${ok ? 'ok' : 'FAIL'} (${a}/${b}, ${JSON.stringify(await written(g.id))})`);
      }
    }
    check('W1.2 a key recorded by one writer replays through the other, both ways, open and moderated (the stored state decides "saved" or "pending"): one wish, one key, no limiter hit',
      crossRuns.every((r) => r.includes(': ok')), crossRuns.join('; '));

    const overlapRuns: string[] = [];
    for (let round = 0; round < 3; round++) {
      const g = await guest(keyInv, `w12-overlap-${round}`);
      const key = randomUUID();
      // The Rust call goes straight to the client, so it cannot race the action over `BACKEND_WISHES`.
      const [viaNext, viaRust] = await Promise.all([
        guestAction(g, 'Bersamaan', 'next', { key }),
        writeGuestWishThroughApi({ slug: g.slug, guestSlug: g.segment, message: 'Bersamaan', idempotencyKey: key }),
      ]);
      const ok = notice(viaNext).wish === 'saved' && viaRust.kind === 'saved' && same(await written(g.id), { wishes: 1, events: 1 }) && same(await keysOf(g.id), [key]);
      overlapRuns.push(`round ${round}: ${ok ? 'ok' : 'FAIL'} (next ${notice(viaNext).wish}, rust ${viaRust.kind}, ${JSON.stringify(await written(g.id))})`);
    }
    check('W1.2 one form in flight on both writers at once (3 rounds): both "saved", one wish, one key', overlapRuns.every((r) => r.includes(': ok')), overlapRuns.join('; '));

    // An injected failure after the wish is inserted: a trigger refuses this guest's analytics row.
    await sql.unsafe(`create or replace function w12_fail_analytics() returns trigger language plpgsql as $$ begin raise exception 'w12 injected failure'; end $$`);
    const faultRuns: string[] = [];
    for (const writer of ['next', 'rust'] as const) {
      const g = await guest(keyInv, `w12-fault-${writer}`);
      const key = randomUUID();
      await sql.unsafe(`create trigger w12_fail_${Number(g.id)} before insert on analytics_events for each row when (new.guest_id = ${Number(g.id)}) execute function w12_fail_analytics()`);
      let failed = '';
      try {
        failed = notice(await quietly(() => guestAction(g, 'Gagal di tengah', writer, { key }))).wish ?? '(no notice)';
      } catch {
        failed = 'error';
      } finally {
        await sql.unsafe(`drop trigger if exists w12_fail_${Number(g.id)} on analytics_events`);
      }
      const untouched = same(await written(g.id), { wishes: 0, events: 0 }) && (await keysOf(g.id)).length === 0;
      const retried = notice(await guestAction(g, 'Gagal di tengah', writer, { key })).wish;
      const once = retried === 'saved' && same(await written(g.id), { wishes: 1, events: 1 }) && same(await keysOf(g.id), [key]);
      faultRuns.push(`${writer}: ${untouched && once ? 'ok' : 'FAIL'} (failure answered ${failed}, nothing kept ${untouched}, retry ${retried})`);
    }
    await sql.unsafe('drop function if exists w12_fail_analytics()');
    check('W1.2 a failure after the wish is inserted keeps nothing (wish, analytics, key), and a retry under the same key stores it once, on each writer',
      faultRuns.every((r) => r.includes(': ok')), faultRuns.join('; '));

    const changedGuest = await guest(keyInv, 'w12-changed');
    const changedKey = randomUUID();
    const changedNotices = [
      notice(await guestAction(changedGuest, 'Pesan pertama', 'next', { key: changedKey })).wish,
      notice(await guestAction(changedGuest, 'Pesan kedua', 'next', { key: changedKey })).wish,
    ];
    const changedKeys = await keysOf(changedGuest.id);
    check('W1.2 next: a changed message under a reused key is stored once as a new wish (D-044 (5)), under a fresh key',
      changedNotices.every((n) => n === 'saved') && same(await written(changedGuest.id), { wishes: 2, events: 2 }) && changedKeys.length === 2 && changedKeys.includes(changedKey),
      changedNotices.join(','));

    const scopeA = await guest(keyInv, 'w12-scope-a');
    const scopeB = await guest(keyInv, 'w12-scope-b');
    const sharedKey = randomUUID();
    const scopeNotices = [
      notice(await guestAction(scopeA, 'Kunci bersama', 'next', { key: sharedKey })).wish,
      notice(await guestAction(scopeB, 'Kunci bersama', 'next', { key: sharedKey })).wish,
      notice(await guestAction(scopeB, 'Pesan lain', 'rust', { key: sharedKey })).wish,
    ];
    check('W1.2 keys stay guest-scoped: another guest\u2019s identical wish under the same key is stored for that guest, never replayed (E-062); a changed message under it goes through Rust as new',
      scopeNotices.every((n) => n === 'saved') && same(await written(scopeA.id), { wishes: 1, events: 1 }) && same(await written(scopeB.id), { wishes: 2, events: 2 }) &&
        same(await keysOf(scopeA.id), [sharedKey]) && (await keysOf(scopeB.id)).length === 2,
      scopeNotices.join(','));

    // ── 7. The host's moderation and replies through both writers: the same notice and the same row ──
    session.clerkUserId = owner.clerk;
    session.token = await tokenFor(owner.clerk);
    const hostInv = await invitation(owner.id, { guestbook: { moderation: true } });
    const hostGuest = await guest(hostInv, 'host');
    const foreignInv = await invitation(other.id, {});
    const foreignGuest = await guest(foreignInv, 'foreign');
    const foreignWish = await storedWish(foreignGuest, 'Milik orang lain', 'VISIBLE');
    type HostCase = { name: string; start: 'VISIBLE' | 'PENDING' | 'HIDDEN'; startReply?: string; kind: 'moderate' | 'reply'; value: string; wish?: 'foreign' | 'missing'; expect: string };
    const hostCases: HostCase[] = [
      { name: 'approve a pending wish', start: 'PENDING', kind: 'moderate', value: 'show', expect: 'done=show' },
      { name: 'hide a visible wish', start: 'VISIBLE', kind: 'moderate', value: 'hide', expect: 'done=hide' },
      { name: 'restore a hidden wish', start: 'HIDDEN', kind: 'moderate', value: 'show', expect: 'done=show' },
      { name: 'hide a pending wish (reviewed)', start: 'PENDING', kind: 'moderate', value: 'hide', expect: 'done=hide' },
      { name: 'delete', start: 'VISIBLE', kind: 'moderate', value: 'delete', expect: 'done=delete' },
      { name: 'reply (trimmed)', start: 'VISIBLE', kind: 'reply', value: '  Terima kasih, doanya kami aminkan.  ', expect: 'done=reply' },
      { name: 'clear a reply with a blank one', start: 'VISIBLE', startReply: 'Lama', kind: 'reply', value: ' \n ', expect: 'done=unreply' },
      { name: 'a reply of 1,001 units', start: 'VISIBLE', startReply: 'Tetap', kind: 'reply', value: 'r'.repeat(1001), expect: 'error=invalid' },
      { name: 'an unknown action', start: 'VISIBLE', kind: 'moderate', value: 'approve', expect: 'error=invalid' },
      { name: 'another customer\u2019s wish under this invitation', start: 'VISIBLE', kind: 'moderate', value: 'hide', wish: 'foreign', expect: 'error=notfound' },
      { name: 'a wish that does not exist', start: 'VISIBLE', kind: 'reply', value: 'Halo', wish: 'missing', expect: 'error=notfound' },
    ];
    const hostFailures: string[] = [];
    for (const c of hostCases) {
      const results: Record<string, unknown> = {};
      for (const backend of ['next', 'rust'] as const) {
        const own = await storedWish(hostGuest, `Ucapan ${c.name} ${backend}`, c.start, c.startReply ?? null);
        const target = c.wish === 'foreign' ? foreignWish : c.wish === 'missing' ? 2_000_000_000 : own;
        const url = await hostAction(c.kind, hostInv.id, target, c.value, backend);
        const row = await wishRow(target === foreignWish ? foreignWish : own);
        results[backend] = { answer: url.split('?')[1] ?? url, row: row && { ...row, message: undefined } };
      }
      const ok = same(results.next, results.rust) && (results.next as { answer: string }).answer === c.expect;
      if (!ok) hostFailures.push(`${c.name}: ${JSON.stringify(results)}`);
    }
    check(`${hostCases.length - hostFailures.length} / ${hostCases.length} dashboard operations give the same answer and the same row through both writers`, hostFailures.length === 0, hostFailures.join(' | ').slice(0, 1500));
    check('a foreign wish is untouched by every refusal', same(await wishRow(foreignWish), { name: 'Tamu (fiktif)', message: 'Milik orang lain', is_hidden: false, reviewed: false, host_reply: null, replied: false }));

    // ── 8. Owner tokens, ownership and role through the API ──
    const target = await storedWish(hostGuest, 'Untuk uji token', 'PENDING');
    const direct = async (token: string) => {
      try {
        return (await moderateWishThroughApi({ invitationId: hostInv.id, wishId: target, action: 'show', ownerToken: token })).kind;
      } catch (error) {
        return error instanceof ApiProblem ? `${error.status} ${error.code}` : `threw ${(error as Error).message}`;
      }
    };
    const refusals = {
      otherCustomer: await direct(await tokenFor(other.clerk)),
      administrator: await direct(await tokenFor(admin.clerk)),
      unknownUser: await direct(await tokenFor(`user_nobody_${tag}`)),
      expired: await direct(await tokenFor(owner.clerk, { exp: Math.floor(Date.now() / 1000) - 600 })),
      wrongIssuer: await direct(await tokenFor(owner.clerk, { iss: 'https://evil.test' })),
      wrongParty: await direct(await tokenFor(owner.clerk, { azp: 'https://evil.test' })),
      unknownKey: await direct(await tokenFor(owner.clerk, { kid: `unknown-${tag}` })),
      forgedKey: await direct(await tokenFor(owner.clerk, { key: stranger.privateKey })),
    };
    check('ownership and role come from the database: another customer is "not found", an administrator or unknown account signs in',
      refusals.otherCustomer === 'notfound' && refusals.administrator === 'signin' && refusals.unknownUser === 'signin', JSON.stringify(refusals));
    check('expired, foreign-issuer, foreign-party, unknown-key and forged tokens are refused with 401 and propagate',
      ['expired', 'wrongIssuer', 'wrongParty', 'unknownKey', 'forgedKey'].every((k) => refusals[k as keyof typeof refusals] === '401 owner.token_invalid'));
    const longReply = await replyToWishThroughApi({ invitationId: hostInv.id, wishId: target, reply: 'x'.repeat(1001), ownerToken: await tokenFor(owner.clerk) });
    check('the API refuses a reply of 1,001 units itself (`wish.reply_invalid` → invalid)', longReply.kind === 'invalid');
    check('no refused operation changed the wish', (await wishRow(target))?.is_hidden === true && (await wishRow(target))?.reviewed === false && (await wishRow(target))?.host_reply === null);

    const tokenless = await withEnv({}, async () => {
      session.token = null;
      try {
        return await hostAction('moderate', hostInv.id, target, 'show', 'rust');
      } finally {
        session.token = await tokenFor(owner.clerk);
      }
    });
    const hostDown = await withEnv({ API_BASE_URL: 'http://127.0.0.1:9' }, () => quietly(() => hostAction('moderate', hostInv.id, target, 'show', 'rust')));
    const hostDownRow = await wishRow(target);
    const hostNextDown = await withEnv({ API_BASE_URL: 'http://127.0.0.1:9' }, () => hostAction('moderate', hostInv.id, target, 'show', 'next'));
    check('a session without a token signs in; the API down is "unconfirmed" with nothing written; `next` never needs the API',
      tokenless === '/sign-in' && hostDown.endsWith('error=unconfirmed') && hostDownRow?.is_hidden === true && hostNextDown.endsWith('done=show') && (await wishRow(target))?.is_hidden === false,
      `${tokenless}; ${hostDown}; ${hostNextDown}`);
    const deleteLost = proxy(['forward-drop', 'forward']);
    const deleteLostUrl = await listen(deleteLost.handler);
    const doomed = await storedWish(hostGuest, 'Akan dihapus', 'VISIBLE');
    const deleted = await withEnv({ API_BASE_URL: deleteLostUrl }, () => hostAction('moderate', hostInv.id, doomed, 'delete', 'rust'));
    check('a delete whose answer is lost is retried under its key and replayed, not answered "not found"',
      deleted.endsWith('done=delete') && deleteLost.seen.length === 2 && deleteLost.seen[1].replayed === 'true' && (await wishRow(doomed)) === null, `${deleted} ${JSON.stringify(deleteLost.seen.map((s) => s.status))}`);

    // ── 9. What the guest page lists and renders: visible wishes and their replies only ──
    const pageInv = await invitation(owner.id, { guestbook: { moderation: true, heading: 'Ucapan & Doa' } });
    const pageGuest = await guest(pageInv, 'pembaca');
    await storedWish(pageGuest, 'Ucapan yang tampil', 'VISIBLE', 'Balasan yang tampil');
    await storedWish(pageGuest, 'Ucapan yang menunggu', 'PENDING', 'Balasan untuk yang menunggu');
    await storedWish(pageGuest, 'Ucapan yang disembunyikan', 'HIDDEN');
    const data = await loadPublicInvitation(pageInv.slug, pageGuest.segment);
    const listed = (data?.messages ?? []).map((m) => [m.message, m.hostReply]);
    check('the loader lists the visible wish with its reply, and counts only visible wishes',
      same(listed, [['Ucapan yang tampil', 'Balasan yang tampil']]) && data?.totalMessages === 1, JSON.stringify(listed));
    const render = (loaded: NonNullable<typeof data>) => {
      const props = { ...loaded, status: { wish: 'pending' }, readOnly: false, wishKey: `form-${tag}-render` };
      return renderToStaticMarkup(createElement(GuestbookBlock, { props, view: buildGuestView(props), formClassName: '', messageClassName: '' }));
    };
    const html = data ? render(data) : '';
    check('the rendered guestbook shows the visible wish and the host\u2019s reply, never a pending or hidden wish, and tells the guest about moderation',
      html.includes('Ucapan yang tampil') && html.includes('Balasan tuan rumah') && html.includes('Balasan yang tampil') &&
        !html.includes('Ucapan yang menunggu') && !html.includes('Balasan untuk yang menunggu') && !html.includes('disembunyikan') &&
        html.includes('akan tampil setelah disetujui') && html.includes(`value="form-${tag}-render"`),
      html.length ? 'rendered' : 'no data');
    const privateInv = await invitation(owner.id, { guestbook: { visibility: 'host' } });
    const privateGuest = await guest(privateInv, 'rahasia');
    await storedWish(privateGuest, 'Hanya untuk tuan rumah', 'VISIBLE', 'Balasan pribadi');
    const privateData = await loadPublicInvitation(privateInv.slug, privateGuest.segment);
    const privateHtml = privateData ? render(privateData) : '';
    check('a hosts-only guestbook lists and renders no wish, and says who reads them',
      privateData?.messages.length === 0 && privateData?.totalMessages === 0 && !privateHtml.includes('Hanya untuk tuan rumah') && !privateHtml.includes('Belum ada ucapan') &&
        privateHtml.includes('hanya dibaca oleh tuan rumah') && privateHtml.includes('tersampaikan kepada tuan rumah'));

    // ── 10. B-017: the guest page's wish queries use the additive index ──
    const [bulkOwner] = await sql`insert into users (email, clerk_user_id, role) values (${`wish-api-bulk-${tag}@example.invalid`}, ${`user_wishapi_bulk_${tag}`}, 'CUSTOMER') returning id`;
    created.users.push(bulkOwner.id);
    const bulk = await sql`insert into invitations (user_id, slug, event_type, status, config)
      select ${bulkOwner.id}, ${`wish-api-bulk-${tag}-`} || g, 'wedding', 'PUBLISHED', '{}'::jsonb from generate_series(1, 40) g returning id`;
    for (const row of bulk) created.invitations.push(row.id);
    const ids = `{${bulk.map((row) => row.id).join(',')}}`;
    await sql`insert into guest_messages (invitation_id, name, message, is_hidden, created_at)
      select (${ids}::int[])[1 + g % 40], 'Tamu (fiktif)', 'Ucapan ' || g, g % 7 = 0, now() - make_interval(secs => g)
      from generate_series(1, 6000) g`;
    await sql`analyze guest_messages`;
    const plans: string[] = [];
    for (const query of [visibleWishes(bulk[3].id), visibleWishCount(bulk[3].id)]) {
      const { sql: text, params } = query.toSQL();
      const rows = await sql.unsafe(`explain (format json) ${text}`, params as never[]);
      plans.push(JSON.stringify(rows));
    }
    check('EXPLAIN: the guest page\u2019s list and count of visible wishes both use guest_messages_invitation_visible_idx',
      plans.every((plan) => plan.includes('guest_messages_invitation_visible_idx')), plans.map((plan) => /"Node Type":"([^"]+)"/.exec(plan)?.[1]).join(', '));
  } finally {
    session.clerkUserId = null;
    session.token = null;
    const ids = (values: number[]) => `{${values.join(',')}}`;
    const keys = (values: string[]) => JSON.stringify(values);
    const scopes = created.guests.map((id) => `wish:guest:${id}`);
    const buckets = [...created.guests.map((id) => `wish:link:${id}`), ...[...addressKeys].map(ipBucket)];
    await sql`delete from analytics_events where invitation_id = any(${ids(created.invitations)}::int[])`;
    await sql`delete from guest_messages where invitation_id = any(${ids(created.invitations)}::int[])`;
    await sql`delete from guests where invitation_id = any(${ids(created.invitations)}::int[])`;
    await sql`delete from invitations where id = any(${ids(created.invitations)}::int[])`;
    await sql`delete from users where id = any(${ids(created.users)}::int[])`;
    await sql`delete from api_idempotency_keys where scope in (select jsonb_array_elements_text(${keys(scopes)}::text::jsonb))`;
    // A host operation's scope names its owner, invitation and wish (`wish:host:<owner>:<invitation>:<wish>`, likewise
    // `wish:reply:`), and every host operation here is a fixture user's.
    const hostScopes = () => sql`(scope like 'wish:host:%' or scope like 'wish:reply:%') and split_part(scope, ':', 3) = any(${ids(created.users)}::text[])`;
    await sql`delete from api_idempotency_keys where ${hostScopes()}`;
    await sql`delete from api_rate_limits where bucket in (select jsonb_array_elements_text(${keys(buckets)}::text::jsonb))`;
    await sql`analyze guest_messages`;
    const [left] = await sql`select (select count(*) from invitations where slug like ${`wish-api-%-${tag}%`})::int as invitations,
      (select count(*) from guest_messages where invitation_id = any(${ids(created.invitations)}::int[]))::int as wishes,
      (select count(*) from api_rate_limits where bucket in (select jsonb_array_elements_text(${keys(buckets)}::text::jsonb)))::int as buckets,
      (select count(*) from api_idempotency_keys where scope in (select jsonb_array_elements_text(${keys(scopes)}::text::jsonb)) or ${hostScopes()})::int as keys`;
    check('the fixture leaves no row behind', left.invitations === 0 && left.wishes === 0 && left.buckets === 0 && left.keys === 0, JSON.stringify(left));
    for (const server of servers) server.close();
    await sql.end();
  }
  console.log(failures ? `verify-wishes-api: ${failures} FAILED, ${passes} passed` : `verify-wishes-api: all ${passes} checks passed`);
  process.exit(failures ? 1 : 0);
}

/** Runs `work` with console.error captured, so expected "unconfirmed" log lines do not read as failures. */
async function quietly<T>(work: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => {};
  try {
    return await work();
  } finally {
    console.error = original;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
