/**
 * R-03 end to end: the two RSVP call sites, the guest's form action (`submitRsvp`) and the host's dashboard action
 * (`updateGuestOperation`), against a running Rust API and a scratch database, through the typed client and the service
 * signature. Only Next.js's request primitives (`redirect`, `revalidatePath`, `headers`) and Clerk's session are stubbed;
 * everything after them is product code, and the redirect an action ends in is the notice the guest or host sees.
 *
 *   POSTGRES_URL=… API_BASE_URL=http://127.0.0.1:8090 INTERNAL_API_SECRET=… OWNER_TOKEN_JWKS_PORT=8091 \
 *     OWNER_TOKEN_ISSUER=https://clerk.invitesion.test OWNER_TOKEN_AUTHORIZED_PARTIES=http://127.0.0.1:3100 \
 *     RSVP_LIMIT_LINK=8 RSVP_LIMIT_IP=20 npx tsx scripts/verify-rsvp-api.ts
 *
 * The API must run with the same OWNER_TOKEN_* values (its JWKS URL is http://127.0.0.1:<port>/.well-known/jwks.json,
 * served here with keys generated for this run; no Clerk credential is involved), RATE_LIMIT_RSVP_LINK=<link>/600 and
 * RATE_LIMIT_RSVP_IP=<ip>/600; scripts/ci/rust.sh starts it so. Fixture rows are fictional, tagged per run and removed.
 *
 * It proves: both writers store the same shapes and give the same notice, scenario by scenario; segments that need
 * encoding are signed as sent and never reach another route; exactly one writer per call (nothing is written when the API
 * is down under `rust`, the API is never called under `next`); a lost answer is retried under the same key and replayed,
 * never written twice; one rendered form writes once however often it is sent; limits refuse at their boundary, keyed by
 * the trusted-proxy address and per IPv6 /64; owner tokens are verified, and ownership and role come from the database.
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
const LIMIT_LINK = Number(need('RSVP_LIMIT_LINK'));
const LIMIT_IP = Number(need('RSVP_LIMIT_IP'));
if (!(LIMIT_LINK >= 3 && LIMIT_IP > LIMIT_LINK)) throw new Error('RSVP_LIMIT_IP must exceed RSVP_LIMIT_LINK, which must be at least 3');
// W1.1 (D-071): the in-process default writer counts in the API's buckets, so it must run with the API's limits.
if (env.RATE_LIMIT_RSVP_LINK?.trim() !== `${LIMIT_LINK}/600` || env.RATE_LIMIT_RSVP_IP?.trim() !== `${LIMIT_IP}/600`) {
  throw new Error('RATE_LIMIT_RSVP_LINK and RATE_LIMIT_RSVP_IP must be <RSVP_LIMIT_LINK>/600 and <RSVP_LIMIT_IP>/600, as on the API');
}

let failures = 0;
let passes = 0;
function check(label: string, ok: boolean, detail = '') {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
}
const same = (a: unknown, b: unknown) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, sorted(v)]));
  return value;
}

/** The limiter's bucket for an address key (services/api/src/limits.rs `ip_bucket`), so cleanup can find it. */
const ipBucket = (key: string) =>
  `rsvp:ip:${createHmac('sha256', SECRET).update('invitesion rate-limit address v1\0').update(key).digest('hex').slice(0, 32)}`;

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
type Seen = { path: string; key?: string; body: string; status?: number; replayed?: string | null };
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
/** Answers every request 503 without forwarding it. */
function unavailable() {
  const seen: Seen[] = [];
  const handler: http.RequestListener = async (req, res) => {
    seen.push({ path: req.url ?? '', key: req.headers['idempotency-key'] as string | undefined, body: await bodyOf(req) });
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
  const { submitRsvp } = await import('../app/i/[slug]/actions');
  const { updateGuestOperation } = await import('../app/(customer)/dashboard/invitations/[id]/guests/actions');
  const { writeGuestRsvpThroughApi, writeHostRsvpThroughApi } = await import('../lib/invitation/rsvp-writer');
  const { ApiProblem } = await import('../lib/api/client');
  const jose = await import('jose');

  const tag = randomUUID().replaceAll('-', '').slice(0, 12);
  const created = { users: [] as number[], invitations: [] as number[], guests: [] as number[] };
  const addressKeys = new Set<string>();

  const json = (value: unknown) => (value === undefined ? null : JSON.stringify(value));
  async function user(name: string, role: 'CUSTOMER' | 'ADMIN') {
    const clerk = `user_rsvpapi_${name}_${tag}`;
    const [row] = await sql`insert into users (email, clerk_user_id, role) values (${`rsvp-api-${name}-${tag}@example.invalid`}, ${clerk}, ${role}) returning id`;
    created.users.push(row.id);
    return { id: row.id as number, clerk };
  }
  type InvitationSeed = { status?: string; expiresAt?: Date };
  async function invitation(owner: number, name: string, config: unknown, seed: InvitationSeed = {}) {
    const slug = `rsvp-api-${name}-${tag}`;
    // `expires_at` is a UTC wall time without a zone; an ISO string cast to `timestamp` stores exactly that.
    const expiresAt = seed.expiresAt ? seed.expiresAt.toISOString() : null;
    const [row] = await sql`insert into invitations (user_id, slug, event_type, status, config, expires_at)
      values (${owner}, ${slug}, 'wedding', ${seed.status ?? 'PUBLISHED'}, ${json(config)}::text::jsonb, ${expiresAt}::timestamp) returning id`;
    created.invitations.push(row.id);
    return { id: row.id as number, slug };
  }
  type GuestSeed = { guestCount?: number; linkToken?: string; invitedEventIds?: unknown; rsvpEventAnswers?: unknown; rsvpAnswers?: unknown };
  async function guest(inv: { id: number; slug: string }, name: string, seed: GuestSeed = {}) {
    const slug = `${name}-${tag}`;
    const [row] = await sql`insert into guests (invitation_id, name, slug, link_token, guest_count, invited_event_ids, rsvp_event_answers, rsvp_answers)
      values (${inv.id}, ${`${name} (fiktif)`}, ${slug}, ${seed.linkToken ?? null}, ${seed.guestCount ?? 4},
        ${json(seed.invitedEventIds)}::text::jsonb, ${json(seed.rsvpEventAnswers)}::text::jsonb, ${json(seed.rsvpAnswers)}::text::jsonb) returning id`;
    created.guests.push(row.id);
    return { id: row.id as number, slug: inv.slug, segment: seed.linkToken ?? slug, invitationId: inv.id };
  }
  type Target = Awaited<ReturnType<typeof guest>>;
  /** Every column a guest row has outside its identity, so "unchanged" covers what the RSVP writers must not touch. */
  async function row(id: number) {
    const [r] = await sql`select rsvp_status, attending_count, rsvp_answers, rsvp_event_answers, guest_count, invited_event_ids,
      opened_count, opened_at, sent_at, checked_in_at, category, phone from guests where id = ${id}`;
    return r;
  }
  const metas = async (id: number) => (await sql`select meta from analytics_events where guest_id = ${id} and event_type = 'RSVP' order by id`).map((r) => r.meta);
  const keysOf = async (id: number) => (await sql`select key from api_idempotency_keys where scope = ${`rsvp:guest:${id}`}`).map((r) => r.key as string);

  type Form = Record<string, string | string[]>;
  async function guestAction(target: Pick<Target, 'slug' | 'segment'>, form: Form, backend: 'next' | 'rust', options: { xff?: string; key?: string } = {}) {
    env.BACKEND_RSVP = backend;
    session.headers = new Headers(options.xff === undefined ? {} : { 'x-forwarded-for': options.xff });
    const data = new FormData();
    data.set('slug', target.slug);
    data.set('guestSlug', target.segment);
    // One rendered form per call unless a key is given, as the page mints one per rendering.
    data.set('rsvpKey', options.key ?? randomUUID());
    for (const [name, value] of Object.entries(form)) for (const v of [value].flat()) data.append(name, v);
    return redirectOf(() => submitRsvp(data));
  }
  async function hostAction(target: Target, operation: string, backend: 'next' | 'rust') {
    env.BACKEND_RSVP = backend;
    const data = new FormData();
    data.set('invitationId', String(target.invitationId));
    data.set('guestId', String(target.id));
    data.set('operation', operation);
    return redirectOf(() => updateGuestOperation(data));
  }

  // Owner tokens: RS256 keys served as the API's JWKS. One key pair per API instance (named by a hash of its secret, so a
  // fresh binary gets fresh keys): the API refetches its JWKS for an unknown `kid` at most once per 30 s by design, so a
  // second run against the same binary must sign with the key it already holds.
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

    // ── 1. Both writers, scenario by scenario: the same notice, the same stored row, the same analytics row ──
    const EVENTS = [{ id: 'akad', title: 'Akad' }, { id: 'resepsi', title: 'Resepsi' }];
    const PER_EVENT = { rsvp: { perEvent: true }, events: EVENTS };
    const INVITE_ONLY = { rsvp: { perEvent: true }, events: [EVENTS[0], { ...EVENTS[1], inviteOnly: true }] };
    const QUESTIONS = {
      registrationForm: {
        enabled: true,
        customQuestions: [
          { id: 'diet', label: 'Pilihan menu', type: 'select', options: ['Biasa', 'Vegetarian'], required: true },
          { id: 'allergy', label: 'Alergi', type: 'text', required: true, conditional: { questionId: 'diet', equals: 'Vegetarian' } },
          { id: 'songs', label: 'Lagu', type: 'multiselect', options: ['A', 'B', 'C'] },
          { id: 'kids', label: 'Anak', type: 'number' },
        ],
      },
    };
    const past = new Date(Date.now() - 3_600_000).toISOString();
    type Scenario = { name: string; config?: unknown; invitation?: InvitationSeed; seed?: GuestSeed; form: Form; flags?: Record<string, string> };
    const scenarios: Scenario[] = [
      { name: 'confirmed above the allowance', form: { status: 'CONFIRMED', guestCount: '9' } },
      { name: 'confirmed without a count', form: { status: 'CONFIRMED' } },
      { name: 'confirmed with an unreadable count', form: { status: 'CONFIRMED', guestCount: 'dua' } },
      { name: 'confirmed with a zero count', form: { status: 'CONFIRMED', guestCount: '0' } },
      { name: 'confirmed with an allowance of one', seed: { guestCount: 1 }, form: { status: 'CONFIRMED', guestCount: '5' } },
      { name: 'declined', form: { status: 'DECLINED', guestCount: '3' } },
      { name: 'maybe', form: { status: 'MAYBE', guestCount: '2' } },
      { name: 'maybe with RSVP_MAYBE off', form: { status: 'MAYBE' }, flags: { FLAG_RSVP_MAYBE: 'off' } },
      { name: 'an unknown status', form: { status: 'confirmed' } },
      { name: 'no status', form: {} },
      { name: 'per event, both answered', config: PER_EVENT, form: { 'ev:akad': 'CONFIRMED', 'evn:akad': '2', 'ev:resepsi': 'DECLINED' } },
      { name: 'per event, one unanswered', config: PER_EVENT, form: { 'ev:akad': 'CONFIRMED', 'evn:akad': '2' } },
      { name: 'per event, maybe on one', config: PER_EVENT, form: { 'ev:akad': 'MAYBE', 'ev:resepsi': 'DECLINED' } },
      { name: 'per event keeps a deleted event\u2019s answer', config: PER_EVENT, seed: { rsvpEventAnswers: { old: { status: 'CONFIRMED', attending: 2 } } }, form: { 'ev:akad': 'CONFIRMED', 'evn:akad': '7', 'ev:resepsi': 'CONFIRMED', 'evn:resepsi': '1' } },
      { name: 'per event off: a single answer leaves stored event answers', config: PER_EVENT, seed: { rsvpEventAnswers: { akad: { status: 'DECLINED', attending: 0 } } }, form: { status: 'CONFIRMED', guestCount: '2' }, flags: { FLAG_RSVP_PER_EVENT: 'off' } },
      { name: 'a single answer replaces per-event answers', config: { events: EVENTS }, seed: { rsvpEventAnswers: { akad: { status: 'DECLINED', attending: 0 } } }, form: { status: 'CONFIRMED', guestCount: '2' } },
      { name: 'an invite-only event the guest is not invited to', config: INVITE_ONLY, form: { status: 'CONFIRMED', guestCount: '2' } },
      { name: 'an invite-only event the guest is invited to', config: INVITE_ONLY, seed: { invitedEventIds: ['resepsi'] }, form: { 'ev:akad': 'DECLINED', 'ev:resepsi': 'CONFIRMED', 'evn:resepsi': '3' } },
      { name: 'invited, answering only the open event', config: INVITE_ONLY, seed: { invitedEventIds: ['resepsi'] }, form: { 'ev:akad': 'CONFIRMED' } },
      { name: 'INVITE_ONLY_EVENTS off shows every event', config: INVITE_ONLY, form: { 'ev:akad': 'CONFIRMED', 'ev:resepsi': 'MAYBE' }, flags: { FLAG_INVITE_ONLY_EVENTS: 'off' } },
      { name: 'questions answered (trimmed, conditional, several values)', config: QUESTIONS, form: { status: 'CONFIRMED', 'q:diet': ' Vegetarian ', 'q:allergy': 'Kacang', 'q:songs': ['A', 'C'], 'q:kids': '2' } },
      { name: 'a required question unanswered', config: QUESTIONS, form: { status: 'CONFIRMED' } },
      { name: 'a conditional question the answer makes required', config: QUESTIONS, form: { status: 'CONFIRMED', 'q:diet': 'Vegetarian' } },
      { name: 'an option the host did not offer', config: QUESTIONS, form: { status: 'CONFIRMED', 'q:diet': 'Lainnya' } },
      { name: 'a decline clears stored answers', config: QUESTIONS, seed: { rsvpAnswers: { diet: 'Biasa' } }, form: { status: 'DECLINED' } },
      { name: 'RSVP_QUESTIONS off leaves stored answers', config: QUESTIONS, seed: { rsvpAnswers: { diet: 'Biasa' } }, form: { status: 'CONFIRMED' }, flags: { FLAG_RSVP_QUESTIONS: 'off' } },
      { name: 'past the deadline', config: { rsvp: { deadline: past } }, form: { status: 'CONFIRMED' } },
      { name: 'RSVP switched off', config: { rsvp: { enabled: false } }, form: { status: 'CONFIRMED' } },
      { name: 'expired by date', invitation: { expiresAt: new Date(Date.now() - 3_600_000) }, form: { status: 'CONFIRMED' } },
      { name: 'expired by status', invitation: { status: 'EXPIRED' }, form: { status: 'CONFIRMED' } },
      { name: 'a draft', invitation: { status: 'DRAFT' }, form: { status: 'CONFIRMED' } },
      { name: 'malformed stored sections', config: { rsvp: [], events: 'nope', registrationForm: { enabled: true, customQuestions: 'x' } }, seed: { rsvpEventAnswers: 'text', invitedEventIds: { a: 1 } }, form: { status: 'CONFIRMED', guestCount: '2' } },
      { name: 'malformed stored event answers with per event on', config: PER_EVENT, seed: { rsvpEventAnswers: [1, 2] }, form: { 'ev:akad': 'CONFIRMED', 'ev:resepsi': 'CONFIRMED', 'evn:resepsi': '9' } },
      { name: 'a broken stored question costs only itself', config: { registrationForm: { enabled: true, customQuestions: [QUESTIONS.registrationForm.customQuestions[0], { id: 'diet', label: 'Ganda', type: 'text' }, { id: 'bad', type: 'nope' }] } }, form: { status: 'CONFIRMED', 'q:diet': 'Biasa' } },
    ];
    let parity = 0;
    for (const [index, scenario] of scenarios.entries()) {
      const inv = await invitation(owner.id, `parity-${index}`, scenario.config ?? {}, scenario.invitation);
      const viaNext = await guest(inv, `p${index}-next`, scenario.seed);
      const viaRust = await guest(inv, `p${index}-rust`, scenario.seed);
      const before = await row(viaRust.id);
      const [nextUrl, rustUrl] = await withEnv(scenario.flags ?? {}, async () => [
        await guestAction(viaNext, scenario.form, 'next'),
        await guestAction(viaRust, scenario.form, 'rust'),
      ]);
      const [a, b] = [await row(viaNext.id), await row(viaRust.id)];
      const [ma, mb] = [await metas(viaNext.id), await metas(viaRust.id)];
      const agree = same(notice(nextUrl), notice(rustUrl)) && same(a, b) && same(ma, mb) && a.guest_count === before.guest_count;
      if (agree) parity++;
      else check(`writers agree: ${scenario.name}`, false, `next ${JSON.stringify(notice(nextUrl))} ${JSON.stringify(sorted(a))} ${JSON.stringify(ma)} | rust ${JSON.stringify(notice(rustUrl))} ${JSON.stringify(sorted(b))} ${JSON.stringify(mb)}`);
    }
    check(`both writers give the same notice, guest row and analytics row in all ${scenarios.length} guest scenarios`, parity === scenarios.length, `${parity} / ${scenarios.length}`);

    // Links: a guest with a token is reached by its token only (B-011); an unknown link is closed.
    const linkInv = await invitation(owner.id, 'links', {});
    const token = `Tk_-${tag}`.padEnd(22, 'x');
    const tokened = await guest(linkInv, 'tokened', { linkToken: token });
    const bySlug = { slug: linkInv.slug, segment: `tokened-${tag}` };
    const linkNotices = [
      notice(await guestAction(bySlug, { status: 'CONFIRMED' }, 'next')).rsvp,
      notice(await guestAction(bySlug, { status: 'CONFIRMED' }, 'rust')).rsvp,
      notice(await guestAction({ slug: linkInv.slug, segment: `nobody-${tag}` }, { status: 'CONFIRMED' }, 'rust')).rsvp,
      notice(await guestAction(tokened, { status: 'DECLINED' }, 'rust')).rsvp,
    ];
    check('a tokened guest is never reached by slug, an unknown link is closed, the token (with - and _) is accepted',
      same(linkNotices, ['closed', 'closed', 'closed', 'saved']) && (await metas(tokened.id)).length === 1, linkNotices.join(', '));

    // ── 2. Segments that need encoding: signed as sent, never another route, never a write ──
    const victimInv = await invitation(owner.id, 'victim', {});
    const victim = await guest(victimInv, 'victim');
    const odd = ['a/b', 'a?b=1', 'a#b', '100%', '%2e%2e', 'a b', 'ñandú', 'x'.repeat(300), '\\..\\x', `x/../../../invitations/${victimInv.id}/guests/${victim.id}/rsvp-override`];
    const oddNotices: string[] = [];
    for (const segment of odd) oddNotices.push(notice(await guestAction({ slug: linkInv.slug, segment }, { status: 'CONFIRMED' }, 'rust')).rsvp);
    for (const slug of [`${linkInv.slug}/x`, '%', 'ñ', '..']) oddNotices.push(notice(await guestAction({ slug, segment: `tokened-${tag}` }, { status: 'CONFIRMED' }, 'rust')).rsvp);
    const victimRow = await row(victim.id);
    check(`${oddNotices.length} slugs and links that need encoding reach no route but their own and are refused as closed`,
      oddNotices.every((n) => n === 'closed') && victimRow.rsvp_status === 'PENDING' && (await metas(victim.id)).length === 0, oddNotices.join(','));

    // ── 3. Exactly one writer per call ──
    const oneInv = await invitation(owner.id, 'one-writer', {});
    const down = await guest(oneInv, 'down');
    const formKey = randomUUID();
    const downUrl = await withEnv({ API_BASE_URL: 'http://127.0.0.1:9' }, () => guestAction(down, { status: 'CONFIRMED' }, 'rust', { key: formKey }));
    check('BACKEND_RSVP=rust with the API down: "unconfirmed" with the form\u2019s key, nothing written by anyone',
      same(notice(downUrl), { rsvp: 'retry', rsvpk: formKey }) && (await row(down.id)).rsvp_status === 'PENDING' && (await metas(down.id)).length === 0, downUrl);
    const refusing = unavailable();
    const refusingUrl = await listen(refusing.handler);
    const refusedUrl = await withEnv({ API_BASE_URL: refusingUrl }, () => guestAction(down, { status: 'CONFIRMED' }, 'rust', { key: formKey }));
    check('an API answering 503 is asked exactly twice, under one key, with the same signed path and bytes, and nothing is written',
      notice(refusedUrl).rsvp === 'retry' && refusing.seen.length === 2 && refusing.seen.every((s) => s.key === formKey && s.body === refusing.seen[0].body && s.path === refusing.seen[0].path) && (await metas(down.id)).length === 0,
      `${refusing.seen.length} requests`);
    const counted = unavailable();
    const countedUrl = await listen(counted.handler);
    const nextUrl = await withEnv({ API_BASE_URL: countedUrl }, () => guestAction(down, { status: 'CONFIRMED' }, 'next'));
    check('BACKEND_RSVP=next writes through Next.js and never calls the API',
      notice(nextUrl).rsvp === 'saved' && counted.seen.length === 0 && (await metas(down.id)).length === 1 && same(await metas(down.id), [{ status: 'CONFIRMED', guestCount: 1, source: 'public' }]));

    // ── 4. A lost answer: retried under the same key and replayed, never written twice ──
    const lostOnce = proxy(['forward-drop', 'forward']);
    const lostOnceUrl = await listen(lostOnce.handler);
    const lone = await guest(oneInv, 'lost-once');
    const loneUrl = await withEnv({ API_BASE_URL: lostOnceUrl }, () => guestAction(lone, { status: 'CONFIRMED', guestCount: '3' }, 'rust'));
    check('the API commits, the answer is lost, the same key is sent again and the commit is replayed: one write',
      notice(loneUrl).rsvp === 'saved' && (await metas(lone.id)).length === 1 && lostOnce.seen.length === 2 && lostOnce.seen[0].key === lostOnce.seen[1].key && lostOnce.seen[1].replayed === 'true',
      `${lostOnce.seen.length} requests, replayed ${lostOnce.seen[1]?.replayed}`);
    const lostTwice = proxy(['forward-drop', 'forward-drop']);
    const lostTwiceUrl = await listen(lostTwice.handler);
    const twice = await guest(oneInv, 'lost-twice');
    const twiceKey = randomUUID();
    const twiceUrl = await withEnv({ API_BASE_URL: lostTwiceUrl }, () => guestAction(twice, { status: 'CONFIRMED', guestCount: '2' }, 'rust', { key: twiceKey }));
    const resent = await guestAction(twice, { status: 'CONFIRMED', guestCount: '2' }, 'rust', { key: notice(twiceUrl).rsvpk });
    check('both answers lost: "unconfirmed"; sending the form again under the carried key replays the first write',
      same(notice(twiceUrl), { rsvp: 'retry', rsvpk: twiceKey }) && notice(resent).rsvp === 'saved' && (await metas(twice.id)).length === 1, `${(await metas(twice.id)).length} writes`);
    const changed = await guestAction(twice, { status: 'DECLINED' }, 'rust', { key: twiceKey });
    const changedRow = await row(twice.id);
    check('the carried key with a changed answer is a new submission: written once more, the new answer stored',
      notice(changed).rsvp === 'saved' && (await metas(twice.id)).length === 2 && changedRow.rsvp_status === 'DECLINED' && changedRow.attending_count === 0);

    // ── 5. One rendered form writes once however often it is sent ──
    const tapped = await guest(oneInv, 'double-tap');
    const tapKey = randomUUID();
    const taps = await Promise.all(Array.from({ length: 6 }, () => guestAction(tapped, { status: 'CONFIRMED', guestCount: '2' }, 'rust', { key: tapKey })));
    check('6 concurrent sends of one form: all "saved", one write, one stored key',
      taps.every((u) => notice(u).rsvp === 'saved') && (await metas(tapped.id)).length === 1 && same(await keysOf(tapped.id), [tapKey]), `${(await metas(tapped.id)).length} writes`);
    const keyless = await guest(oneInv, 'bad-key');
    const keylessUrl = await guestAction(keyless, { status: 'MAYBE' }, 'rust', { key: 'short' });
    const minted = await keysOf(keyless.id);
    check('a form key that is not a key is ignored and the writer mints its own',
      notice(keylessUrl).rsvp === 'saved' && minted.length === 1 && /^[0-9a-f-]{36}$/.test(minted[0]));

    // ── 6. Limits at their boundary, by the trusted-proxy address ──
    const limitInv = await invitation(owner.id, 'limits', {});
    const linkGuest = await guest(limitInv, 'link-limit');
    const linkUrls: string[] = [];
    for (let n = 1; n <= LIMIT_LINK + 1; n++) linkUrls.push(await guestAction(linkGuest, { status: 'CONFIRMED', guestCount: String(1 + (n % 3)) }, 'rust'));
    const refusal = notice(linkUrls[LIMIT_LINK]);
    const linkRow = await row(linkGuest.id);
    check(`the per-link limit: ${LIMIT_LINK} writes pass, the next is "busy" with its retry time and writes nothing`,
      linkUrls.slice(0, LIMIT_LINK).every((u) => notice(u).rsvp === 'saved') && refusal.rsvp === 'busy' && Number(refusal.rsvpr) >= 1 && Number(refusal.rsvpr) <= 600 &&
        (await metas(linkGuest.id)).length === LIMIT_LINK && linkRow.attending_count === 1 + (LIMIT_LINK % 3),
      JSON.stringify(refusal));
    await sql`update api_rate_limits set window_start = window_start - make_interval(secs => 600) where bucket = ${`rsvp:link:${linkGuest.id}`}`;
    const afterWindow = await guestAction(linkGuest, { status: 'DECLINED' }, 'rust');
    check('after the window, the link writes again', notice(afterWindow).rsvp === 'saved' && (await metas(linkGuest.id)).length === LIMIT_LINK + 1);

    async function fillAddress(prefix: string, addressOf: (n: number) => string): Promise<Target[]> {
      const used: Target[] = [];
      let left = LIMIT_IP;
      let n = 0;
      while (left > 0) {
        const g = await guest(limitInv, `${prefix}-${used.length}`);
        used.push(g);
        for (let i = 0; i < Math.min(LIMIT_LINK, left); i++) {
          const url = await guestAction(g, { status: 'CONFIRMED' }, 'rust', { xff: addressOf(n++) });
          if (notice(url).rsvp !== 'saved') throw new Error(`fill ${prefix}: ${url}`);
        }
        left -= Math.min(LIMIT_LINK, left);
      }
      return used;
    }
    addressKeys.add('198.51.100.20');
    addressKeys.add('198.51.100.21');
    // Never keyed by a correct build; listed so a run of a broken one still cleans up after itself.
    addressKeys.add('192.0.2.99');
    const v4 = await fillAddress('ip4', () => '198.51.100.20');
    const fresh = await guest(limitInv, 'ip4-fresh');
    const forged = notice(await guestAction(fresh, { status: 'CONFIRMED' }, 'rust', { xff: '192.0.2.99, 198.51.100.20' }));
    const neighbour = notice(await guestAction(fresh, { status: 'CONFIRMED' }, 'rust', { xff: '198.51.100.21' }));
    const untrusted = notice(await withEnv({ TRUSTED_PROXY_HOPS: '0' }, () => guestAction(fresh, { status: 'CONFIRMED' }, 'rust', { xff: '198.51.100.20' })));
    check(`the per-address limit: ${LIMIT_IP} writes from one address over ${v4.length} links pass; a client-supplied left entry does not escape it`,
      forged.rsvp === 'busy' && neighbour.rsvp === 'saved', `forged ${forged.rsvp}, other address ${neighbour.rsvp}`);
    check('TRUSTED_PROXY_HOPS=0 believes no header, so no per-address limit applies (the per-link one still does)', untrusted.rsvp === 'saved');

    addressKeys.add('2001:db8:64:1::/64');
    addressKeys.add('2001:db8:64:2::/64');
    await fillAddress('ip6', (n) => `2001:db8:64:1::${(n + 1).toString(16)}`);
    const v6 = await guest(limitInv, 'ip6-fresh');
    const sameLine = notice(await guestAction(v6, { status: 'CONFIRMED' }, 'rust', { xff: '[2001:db8:64:1:ffff::1]:443' }));
    const nextLine = notice(await guestAction(v6, { status: 'CONFIRMED' }, 'rust', { xff: '2001:db8:64:2::1' }));
    const [line] = await sql`select hits from api_rate_limits where bucket = ${ipBucket('2001:db8:64:1::/64')}`;
    check(`IPv6 addresses share their /64's budget (${LIMIT_IP} hits from ${LIMIT_IP} addresses), the next /64 has its own`,
      sameLine.rsvp === 'busy' && nextLine.rsvp === 'saved' && line?.hits === LIMIT_IP + 1, `same /64 ${sameLine.rsvp}, next /64 ${nextLine.rsvp}, hits ${line?.hits}`);
    const stored = (await sql`select bucket from api_rate_limits where bucket like 'rsvp:ip:%'`).map((r) => r.bucket as string);
    check('the limiter table holds keyed hashes, never an address', stored.length > 0 && stored.every((b) => !/198\.51\.100|2001:db8|192\.0\.2/.test(b)));

    // ── 6b. W1.1 (D-071): the default writer counts the same quota, in the same buckets, where the Rust writer counts ──
    const hitsOf = async (bucket: string) => Number((await sql`select hits from api_rate_limits where bucket = ${bucket}`)[0]?.hits ?? 0);
    /** Seconds from now to the end of the 600 s window, so a refusal's retry time can be checked against the clock. */
    const toWindowEnd = () => 600 - (Math.floor(Date.now() / 1000) % 600);
    const retryFits = (raw: string | undefined) => {
      const gap = Math.abs(Number(raw) - toWindowEnd());
      return Number(raw) >= 1 && Number(raw) <= 600 && (gap <= 2 || gap >= 598);
    };
    const nextLinkGuest = await guest(limitInv, 'next-link-limit');
    const nextLinkUrls: string[] = [];
    for (let n = 1; n <= LIMIT_LINK + 1; n++) nextLinkUrls.push(await guestAction(nextLinkGuest, { status: 'CONFIRMED', guestCount: String(1 + (n % 3)) }, 'next'));
    const nextRefusal = notice(nextLinkUrls[LIMIT_LINK]);
    const nextLinkRow = await row(nextLinkGuest.id);
    check(`W1.1 next per link: ${LIMIT_LINK} writes pass, the next is "busy" with the retry time to the window's end and writes nothing, as through Rust`,
      nextLinkUrls.slice(0, LIMIT_LINK).every((u) => notice(u).rsvp === 'saved') && same(Object.keys(nextRefusal), Object.keys(refusal)) && nextRefusal.rsvp === 'busy' &&
        retryFits(nextRefusal.rsvpr) && (await metas(nextLinkGuest.id)).length === LIMIT_LINK && nextLinkRow.attending_count === 1 + (LIMIT_LINK % 3) &&
        (await hitsOf(`rsvp:link:${nextLinkGuest.id}`)) === LIMIT_LINK + 1,
      JSON.stringify(nextRefusal));

    const flips: string[] = [];
    for (const [first, second] of [['next', 'rust'], ['rust', 'next']] as const) {
      const g = await guest(limitInv, `flip-link-${first}`);
      const firstUrls: string[] = [];
      for (let i = 0; i < 3; i++) firstUrls.push(await guestAction(g, { status: 'CONFIRMED' }, first));
      const secondUrls: string[] = [];
      for (let i = 0; i <= LIMIT_LINK - 3; i++) secondUrls.push(await guestAction(g, { status: 'DECLINED' }, second));
      const last = notice(secondUrls[LIMIT_LINK - 3]);
      const ok = firstUrls.every((u) => notice(u).rsvp === 'saved') && secondUrls.slice(0, LIMIT_LINK - 3).every((u) => notice(u).rsvp === 'saved') &&
        last.rsvp === 'busy' && retryFits(last.rsvpr) && (await metas(g.id)).length === LIMIT_LINK && (await hitsOf(`rsvp:link:${g.id}`)) === LIMIT_LINK + 1;
      flips.push(`${first} then ${second}: ${ok ? 'ok' : 'FAIL'} (hits ${await hitsOf(`rsvp:link:${g.id}`)}, writes ${(await metas(g.id)).length}, last ${last.rsvp})`);
    }
    check(`W1.1 shared per-link bucket: after 3 writes through one writer the other allows exactly the remaining ${LIMIT_LINK - 3} and refuses the next, both ways`,
      flips.every((f) => f.includes(': ok')), flips.join('; '));

    /** `count` writes through one writer from one address (or one /64), spread over fresh guests under the per-link limit. */
    async function fillVia(writer: 'next' | 'rust', prefix: string, address: string | ((n: number) => string), count: number): Promise<boolean> {
      let left = count;
      let n = 0;
      for (let index = 0; left > 0; index++) {
        const g = await guest(limitInv, `${prefix}-${index}`);
        for (let i = 0; i < Math.min(LIMIT_LINK, left); i++) {
          const xff = typeof address === 'string' ? address : address(n++);
          if (notice(await guestAction(g, { status: 'CONFIRMED' }, writer, { xff })).rsvp !== 'saved') return false;
        }
        left -= Math.min(LIMIT_LINK, left);
      }
      return true;
    }
    for (const key of ['198.51.100.30', '198.51.100.31', '198.51.100.40', '198.51.100.41', '2001:db8:65:1::/64', '2001:db8:65:2::/64']) addressKeys.add(key);
    const nextFilled = await fillVia('next', 'nip4', '198.51.100.30', LIMIT_IP);
    const nextFresh = await guest(limitInv, 'nip4-fresh');
    const nextFull = notice(await guestAction(nextFresh, { status: 'CONFIRMED' }, 'next', { xff: '198.51.100.30' }));
    const nextForged = notice(await guestAction(nextFresh, { status: 'CONFIRMED' }, 'next', { xff: '192.0.2.99, 198.51.100.30' }));
    const nextNeighbour = notice(await guestAction(nextFresh, { status: 'CONFIRMED' }, 'next', { xff: '198.51.100.31' }));
    const nextUntrusted = notice(await withEnv({ TRUSTED_PROXY_HOPS: '0' }, () => guestAction(nextFresh, { status: 'CONFIRMED' }, 'next', { xff: '198.51.100.30' })));
    const nextKeyless = notice(await withEnv({ INTERNAL_API_SECRET: undefined }, () => guestAction(nextFresh, { status: 'CONFIRMED' }, 'next', { xff: '198.51.100.30' })));
    check(`W1.1 next per address: ${LIMIT_IP} writes from one address pass, the next is "busy"; a client-supplied left entry does not escape it; another address writes`,
      nextFilled && nextFull.rsvp === 'busy' && retryFits(nextFull.rsvpr) && nextForged.rsvp === 'busy' && nextNeighbour.rsvp === 'saved' && (await hitsOf(ipBucket('198.51.100.30'))) === LIMIT_IP + 2,
      `filled ${nextFilled}, full ${nextFull.rsvp}, forged ${nextForged.rsvp}, other address ${nextNeighbour.rsvp}, hits ${await hitsOf(ipBucket('198.51.100.30'))}`);
    check('W1.1 next: TRUSTED_PROXY_HOPS=0 or no INTERNAL_API_SECRET means no per-address limit; the per-link one still counts',
      nextUntrusted.rsvp === 'saved' && nextKeyless.rsvp === 'saved' && (await hitsOf(`rsvp:link:${nextFresh.id}`)) === 5, `hops 0 ${nextUntrusted.rsvp}, no secret ${nextKeyless.rsvp}`);
    const v6Filled = await fillVia('next', 'nip6', (n) => `2001:db8:65:1::${(n + 1).toString(16)}`, LIMIT_IP);
    const v6Fresh = await guest(limitInv, 'nip6-fresh');
    const v6SameLine = notice(await guestAction(v6Fresh, { status: 'CONFIRMED' }, 'next', { xff: '[2001:db8:65:1:ffff::1]:443' }));
    const v6NextLine = notice(await guestAction(v6Fresh, { status: 'CONFIRMED' }, 'next', { xff: '2001:db8:65:2::1' }));
    check(`W1.1 next: IPv6 addresses share their /64's budget, the next /64 has its own`,
      v6Filled && v6SameLine.rsvp === 'busy' && v6NextLine.rsvp === 'saved' && (await hitsOf(ipBucket('2001:db8:65:1::/64'))) === LIMIT_IP + 1,
      `same /64 ${v6SameLine.rsvp}, next /64 ${v6NextLine.rsvp}, hits ${await hitsOf(ipBucket('2001:db8:65:1::/64'))}`);

    const addressFlips: string[] = [];
    for (const [first, second, address] of [['next', 'rust', '198.51.100.40'], ['rust', 'next', '198.51.100.41']] as const) {
      const firstOk = await fillVia(first, `flip-ip-${first}-a`, address, 5);
      const secondOk = await fillVia(second, `flip-ip-${first}-b`, address, LIMIT_IP - 5);
      const over = notice(await guestAction(await guest(limitInv, `flip-ip-${first}-c`), { status: 'CONFIRMED' }, second, { xff: address }));
      const ok = firstOk && secondOk && over.rsvp === 'busy' && (await hitsOf(ipBucket(address))) === LIMIT_IP + 1;
      addressFlips.push(`${first} then ${second}: ${ok ? 'ok' : 'FAIL'} (hits ${await hitsOf(ipBucket(address))}, last ${over.rsvp})`);
    }
    check(`W1.1 shared per-address bucket: after 5 writes through one writer the other allows exactly the remaining ${LIMIT_IP - 5} and refuses the next, both ways`,
      addressFlips.every((f) => f.includes(': ok')), addressFlips.join('; '));

    // Closed invitations: a link-level closure is refused before any count by both writers; a decision-level closure is
    // counted first by both (the Rust order), so over quota both answer "busy" where the decision would say "closed".
    const pastDate = new Date(Date.now() - 3_600_000);
    const closures = [
      { name: 'deleted', level: 'link', inv: await invitation(owner.id, 'w11-deleted', {}) },
      { name: 'draft', level: 'link', inv: await invitation(owner.id, 'w11-draft', {}, { status: 'DRAFT' }) },
      { name: 'expired', level: 'link', inv: await invitation(owner.id, 'w11-expired', {}, { expiresAt: pastDate }) },
      { name: 'RSVP off', level: 'decision', inv: await invitation(owner.id, 'w11-rsvp-off', { rsvp: { enabled: false } }) },
      { name: 'past the deadline', level: 'decision', inv: await invitation(owner.id, 'w11-deadline', { rsvp: { deadline: pastDate.toISOString() } }) },
    ] as const;
    const closureResults: string[] = [];
    for (const [index, closure] of closures.entries()) {
      const targets = { next: await guest(closure.inv, `w11-c${index}-next`), rust: await guest(closure.inv, `w11-c${index}-rust`) };
      // B-031's constraint: a deletion always carries its purge time.
      if (closure.name === 'deleted') await sql`update invitations set deleted_at = now(), purge_after = now() + interval '30 days' where id = ${closure.inv.id}`;
      for (const writer of ['next', 'rust'] as const) {
        const target = targets[writer];
        const before = await row(target.id);
        const notices: string[] = [];
        for (let i = 0; i <= LIMIT_LINK; i++) notices.push(notice(await guestAction(target, { status: 'CONFIRMED' }, writer)).rsvp);
        const counted = await hitsOf(`rsvp:link:${target.id}`);
        const expected = closure.level === 'link'
          ? notices.every((n) => n === 'closed') && counted === 0
          : notices.slice(0, LIMIT_LINK).every((n) => n === 'closed') && notices[LIMIT_LINK] === 'busy' && counted === LIMIT_LINK + 1;
        const untouched = same(await row(target.id), before) && (await metas(target.id)).length === 0;
        closureResults.push(`${closure.name} ${writer}: ${expected && untouched ? 'ok' : 'FAIL'} (over quota "${notices[LIMIT_LINK]}", hits ${counted})`);
      }
    }
    check('W1.1 closed invitations: both writers refuse and write nothing; link-level closures are never counted, decision-level ones are counted alike and answer "busy" over quota',
      closureResults.every((r) => r.includes(': ok')), closureResults.join('; '));

    const offGuest = await guest(limitInv, 'w11-flag-off');
    const fullBefore = await hitsOf(ipBucket('198.51.100.30'));
    const offUrls = await withEnv({ FLAG_GUEST_WRITE_LIMITS: 'off' }, async () => {
      const urls: string[] = [];
      for (let i = 0; i < LIMIT_LINK + 2; i++) urls.push(await guestAction(offGuest, { status: 'CONFIRMED' }, 'next', { xff: '198.51.100.30' }));
      return urls;
    });
    check('W1.1 FLAG_GUEST_WRITE_LIMITS=off: the default writer calls no limiter, exactly as before (every write saved from a full address, no bucket touched)',
      offUrls.every((u) => notice(u).rsvp === 'saved') && (await metas(offGuest.id)).length === LIMIT_LINK + 2 && (await hitsOf(`rsvp:link:${offGuest.id}`)) === 0 &&
        (await hitsOf(ipBucket('198.51.100.30'))) === fullBefore,
      `${offUrls.filter((u) => notice(u).rsvp === 'saved').length} saved`);

    const { WRITE_LIMIT_DEFAULTS } = await import('../lib/rate-limit-keys');
    const fallbackMax = WRITE_LIMIT_DEFAULTS.rsvp.perLink.max;
    const fallbackGuest = await guest(limitInv, 'w11-fallback');
    const fallbackUrls = await withEnv({ RATE_LIMIT_RSVP_LINK: 'sepuluh/600' }, async () => {
      const urls: string[] = [];
      for (let i = 0; i <= fallbackMax; i++) urls.push(await guestAction(fallbackGuest, { status: 'CONFIRMED' }, 'next'));
      return urls;
    });
    check(`W1.1 an invalid RATE_LIMIT_RSVP_LINK falls back to the default (${fallbackMax} per link), as the API's Limit::parse does`,
      fallbackUrls.slice(0, fallbackMax).every((u) => notice(u).rsvp === 'saved') && notice(fallbackUrls[fallbackMax]).rsvp === 'busy');
    const allBuckets = (await sql`select bucket from api_rate_limits where bucket like 'rsvp:%'`).map((r) => r.bucket as string);
    check('W1.1 the limiter table still holds only guest ids and keyed hashes: no address, no name',
      allBuckets.length > 0 && allBuckets.every((b) => /^rsvp:(?:link:\d+|ip:[0-9a-f]{32})$/.test(b)), `${allBuckets.length} buckets`);

    // ── 6c. W1.2 (D-072): the default writer honours the form's key like the Rust writer, in the same records ──
    const { rsvpSubmissionFromForm } = await import('../lib/invitation/rsvp-decision');
    const { isFlagOn } = await import('../lib/flags');
    const keyInv = await invitation(owner.id, 'w12-keys', {});
    const eventsInv = await invitation(owner.id, 'w12-events', PER_EVENT);
    const twinRuns: string[] = [];
    for (const writer of ['next', 'rust'] as const) {
      const g = await guest(keyInv, `w12-twins-${writer}`);
      const key = randomUUID();
      const urls = await Promise.all(Array.from({ length: 5 }, () => guestAction(g, { status: 'CONFIRMED', guestCount: '2' }, writer, { key })));
      const ok = urls.every((u) => notice(u).rsvp === 'saved') && (await metas(g.id)).length === 1 && same(await keysOf(g.id), [key]) && (await row(g.id)).attending_count === 2;
      twinRuns.push(`${writer}: ${ok ? 'ok' : 'FAIL'} (writes ${(await metas(g.id)).length}, keys ${(await keysOf(g.id)).length}, link hits ${await hitsOf(`rsvp:link:${g.id}`)})`);
    }
    check('W1.2 five concurrent sends of one form: all "saved", one write, one analytics row, one stored key, on each writer (link hits as measured)',
      twinRuns.every((r) => r.includes(': ok')), twinRuns.join('; '));

    const seqGuest = await guest(keyInv, 'w12-sequential');
    const seqKey = randomUUID();
    const seqFirst = notice(await guestAction(seqGuest, { status: 'CONFIRMED', guestCount: '3' }, 'next', { key: seqKey })).rsvp;
    const seqHits = await hitsOf(`rsvp:link:${seqGuest.id}`);
    const seqAgain: string[] = [];
    for (let i = 0; i < 3; i++) seqAgain.push(notice(await guestAction(seqGuest, { status: 'CONFIRMED', guestCount: '3' }, 'next', { key: seqKey })).rsvp);
    check('W1.2 next: three sequential re-sends of one form replay "saved", write nothing more and take no limiter hit',
      seqFirst === 'saved' && seqAgain.every((n) => n === 'saved') && (await metas(seqGuest.id)).length === 1 && seqHits === 1 && (await hitsOf(`rsvp:link:${seqGuest.id}`)) === 1,
      `${seqAgain.join(',')}, hits ${await hitsOf(`rsvp:link:${seqGuest.id}`)}`);

    const crossRuns: string[] = [];
    const crossForms: Array<{ label: string; inv: { id: number; slug: string }; form: Form }> = [
      { label: 'single', inv: keyInv, form: { status: 'MAYBE', guestCount: '2' } },
      { label: 'per event', inv: eventsInv, form: { 'ev:akad': 'CONFIRMED', 'evn:akad': '2', 'ev:resepsi': 'DECLINED' } },
    ];
    for (const [index, { label, inv, form }] of crossForms.entries()) {
      for (const [first, second] of [['next', 'rust'], ['rust', 'next']] as const) {
        const g = await guest(inv, `w12-cross-${index}-${first}`);
        const key = randomUUID();
        const a = notice(await guestAction(g, form, first, { key })).rsvp;
        const hitsBefore = await hitsOf(`rsvp:link:${g.id}`);
        const b = notice(await guestAction(g, form, second, { key })).rsvp;
        const ok = a === 'saved' && b === 'saved' && (await metas(g.id)).length === 1 && same(await keysOf(g.id), [key]) && (await hitsOf(`rsvp:link:${g.id}`)) === hitsBefore;
        crossRuns.push(`${label}, ${first} then ${second}: ${ok ? 'ok' : 'FAIL'} (${a}/${b}, writes ${(await metas(g.id)).length}, keys ${(await keysOf(g.id)).length})`);
      }
    }
    check('W1.2 a key recorded by one writer replays through the other, both ways, for a single and a per-event answer: one write, one key, no limiter hit',
      crossRuns.every((r) => r.includes(': ok')), crossRuns.join('; '));

    const overlapRuns: string[] = [];
    const renderedFlags = { maybe: isFlagOn('RSVP_MAYBE'), perEvent: isFlagOn('RSVP_PER_EVENT'), inviteOnlyEvents: isFlagOn('INVITE_ONLY_EVENTS'), questions: isFlagOn('RSVP_QUESTIONS') };
    for (let round = 0; round < 3; round++) {
      const g = await guest(keyInv, `w12-overlap-${round}`);
      const key = randomUUID();
      const data = new FormData();
      data.set('status', 'CONFIRMED');
      data.set('guestCount', '2');
      // The Rust call goes straight to the client, so it cannot race the action over `BACKEND_RSVP`.
      const [viaNext, viaRust] = await Promise.all([
        guestAction(g, { status: 'CONFIRMED', guestCount: '2' }, 'next', { key }),
        writeGuestRsvpThroughApi({ slug: g.slug, guestSlug: g.segment, submission: rsvpSubmissionFromForm(data), flags: renderedFlags, idempotencyKey: key }),
      ]);
      const ok = notice(viaNext).rsvp === 'saved' && viaRust.kind === 'saved' && (await metas(g.id)).length === 1 && same(await keysOf(g.id), [key]);
      overlapRuns.push(`round ${round}: ${ok ? 'ok' : 'FAIL'} (next ${notice(viaNext).rsvp}, rust ${viaRust.kind}, writes ${(await metas(g.id)).length})`);
    }
    check('W1.2 one form in flight on both writers at once (3 rounds): both "saved", one write, one key, no deadlock', overlapRuns.every((r) => r.includes(': ok')), overlapRuns.join('; '));

    // An injected failure after the guest row is written: a trigger refuses this guest's analytics row.
    await sql.unsafe(`create or replace function w12_fail_analytics() returns trigger language plpgsql as $$ begin raise exception 'w12 injected failure'; end $$`);
    const faultRuns: string[] = [];
    for (const writer of ['next', 'rust'] as const) {
      const g = await guest(keyInv, `w12-fault-${writer}`);
      const key = randomUUID();
      await sql.unsafe(`create trigger w12_fail_${Number(g.id)} before insert on analytics_events for each row when (new.guest_id = ${Number(g.id)}) execute function w12_fail_analytics()`);
      let failed = '';
      try {
        failed = notice(await guestAction(g, { status: 'CONFIRMED', guestCount: '2' }, writer, { key })).rsvp ?? '(no notice)';
      } catch {
        failed = 'error';
      } finally {
        await sql.unsafe(`drop trigger if exists w12_fail_${Number(g.id)} on analytics_events`);
      }
      const untouched = (await row(g.id)).rsvp_status === 'PENDING' && (await metas(g.id)).length === 0 && (await keysOf(g.id)).length === 0;
      const retried = notice(await guestAction(g, { status: 'CONFIRMED', guestCount: '2' }, writer, { key })).rsvp;
      const once = retried === 'saved' && (await metas(g.id)).length === 1 && same(await keysOf(g.id), [key]) && (await row(g.id)).rsvp_status === 'CONFIRMED';
      faultRuns.push(`${writer}: ${untouched && once ? 'ok' : 'FAIL'} (failure answered ${failed}, nothing kept ${untouched}, retry ${retried})`);
    }
    await sql.unsafe('drop function if exists w12_fail_analytics()');
    check('W1.2 a failure after the guest row is written keeps nothing (row, analytics, key), and a retry under the same key writes once, on each writer',
      faultRuns.every((r) => r.includes(': ok')), faultRuns.join('; '));

    const changedGuest = await guest(keyInv, 'w12-changed');
    const changedKey = randomUUID();
    const changedFirst = notice(await guestAction(changedGuest, { status: 'CONFIRMED', guestCount: '2' }, 'next', { key: changedKey })).rsvp;
    const changedSecond = notice(await guestAction(changedGuest, { status: 'DECLINED' }, 'next', { key: changedKey })).rsvp;
    const changedKeys = await keysOf(changedGuest.id);
    const changedNow = await row(changedGuest.id);
    check('W1.2 next: the form key with a changed answer is a new submission under a fresh key (written once more, the new answer stored), as through Rust',
      changedFirst === 'saved' && changedSecond === 'saved' && (await metas(changedGuest.id)).length === 2 && changedNow.rsvp_status === 'DECLINED' && changedNow.attending_count === 0 &&
        changedKeys.length === 2 && changedKeys.includes(changedKey));

    const scopeA = await guest(keyInv, 'w12-scope-a');
    const scopeB = await guest(keyInv, 'w12-scope-b');
    const sharedKey = randomUUID();
    const scopeNotices = [
      notice(await guestAction(scopeA, { status: 'CONFIRMED', guestCount: '2' }, 'next', { key: sharedKey })).rsvp,
      notice(await guestAction(scopeB, { status: 'CONFIRMED', guestCount: '2' }, 'next', { key: sharedKey })).rsvp,
      notice(await guestAction(scopeB, { status: 'MAYBE' }, 'rust', { key: sharedKey })).rsvp,
    ];
    check('W1.2 keys stay guest-scoped: another guest\u2019s identical form under the same key is written for that guest, never replayed (E-062); a changed answer under it goes through Rust as new',
      scopeNotices.every((n) => n === 'saved') && (await metas(scopeA.id)).length === 1 && (await metas(scopeB.id)).length === 2 && same(await keysOf(scopeA.id), [sharedKey]) &&
        (await keysOf(scopeB.id)).length === 2 && (await row(scopeB.id)).rsvp_status === 'MAYBE',
      scopeNotices.join(','));

    // ── 7. Host overrides: the dashboard action, owner tokens, ownership and role from the database ──
    session.clerkUserId = owner.clerk;
    session.token = await tokenFor(owner.clerk);
    const hostInv = await invitation(owner.id, 'host', PER_EVENT);
    const hostNext = await guest(hostInv, 'host-next');
    const hostRust = await guest(hostInv, 'host-rust');
    const operations = ['CONFIRMED', 'event:akad:DECLINED', 'event:resepsi:MAYBE', 'MAYBE', 'event:ghost:CONFIRMED', 'BOGUS', 'PENDING', 'event:akad:CONFIRMED'];
    let hostParity = 0;
    for (const operation of operations) {
      const [na, ra] = [await hostAction(hostNext, operation, 'next'), await hostAction(hostRust, operation, 'rust')];
      const agree = na === ra && same(await row(hostNext.id), await row(hostRust.id)) && same(await metas(hostNext.id), await metas(hostRust.id));
      if (agree) hostParity++;
      else check(`host writers agree: ${operation}`, false, `next ${na} ${JSON.stringify(sorted(await row(hostNext.id)))} | rust ${ra} ${JSON.stringify(sorted(await row(hostRust.id)))}`);
    }
    check(`the dashboard action gives the same result, row and analytics row through both writers for ${operations.length} operations`, hostParity === operations.length, `${hostParity} / ${operations.length}`);

    const racing = await guest(hostInv, 'host-race');
    await Promise.all(Array.from({ length: 6 }, (_, i) => hostAction(racing, i % 2 ? 'event:akad:CONFIRMED' : 'event:resepsi:DECLINED', 'rust')));
    const raced = await row(racing.id);
    check('concurrent overrides of two events of one guest lose neither answer (row lock)',
      raced.rsvp_event_answers?.akad?.status === 'CONFIRMED' && raced.rsvp_event_answers?.resepsi?.status === 'DECLINED', JSON.stringify(raced.rsvp_event_answers));

    const direct = async (target: Target, ownerToken: string) =>
      writeHostRsvpThroughApi({ invitationId: target.invitationId, guestId: target.id, status: 'CONFIRMED', flags: { perEvent: true, inviteOnlyEvents: true }, ownerToken }).then(
        (outcome) => outcome.kind,
        (error: unknown) => (error instanceof ApiProblem ? `${error.status} ${error.code}` : String(error)),
      );
    const untouched = await guest(hostInv, 'host-untouched');
    const otherInv = await invitation(other.id, 'host-other', {});
    const othersGuest = await guest(otherInv, 'host-others-guest');
    const refusals = {
      otherCustomer: await direct(untouched, await tokenFor(other.clerk)),
      administrator: await direct(untouched, await tokenFor(admin.clerk)),
      unknownUser: await direct(untouched, await tokenFor(`user_nobody_${tag}`)),
      foreignGuest: await direct({ ...othersGuest, invitationId: hostInv.id }, session.token),
      expired: await direct(untouched, await tokenFor(owner.clerk, { exp: Math.floor(Date.now() / 1000) - 60 })),
      wrongIssuer: await direct(untouched, await tokenFor(owner.clerk, { iss: 'https://clerk.example.invalid' })),
      wrongParty: await direct(untouched, await tokenFor(owner.clerk, { azp: 'https://elsewhere.example.invalid' })),
      unknownKey: await direct(untouched, await tokenFor(owner.clerk, { key: stranger.privateKey, kid: `stranger-${tag}` })),
      forgedKey: await direct(untouched, await tokenFor(owner.clerk, { key: stranger.privateKey })),
    };
    check('the API resolves ownership and role from the database: another customer and a foreign guest are "not found", an administrator or unknown account signs in',
      refusals.otherCustomer === 'notfound' && refusals.foreignGuest === 'notfound' && refusals.administrator === 'signin' && refusals.unknownUser === 'signin',
      JSON.stringify(refusals));
    check('expired, foreign-issuer, foreign-party, unknown-key and forged tokens are refused with 401 and propagate',
      ['expired', 'wrongIssuer', 'wrongParty', 'unknownKey', 'forgedKey'].every((k) => refusals[k as keyof typeof refusals] === '401 owner.token_invalid'));
    check('no refused override wrote anything', (await row(untouched.id)).rsvp_status === 'PENDING' && (await metas(untouched.id)).length === 0 && (await metas(othersGuest.id)).length === 0);

    const tokenless = await withEnv({}, async () => {
      session.token = null;
      try {
        return await hostAction(untouched, 'CONFIRMED', 'rust');
      } finally {
        session.token = await tokenFor(owner.clerk);
      }
    });
    const hostDown = await withEnv({ API_BASE_URL: 'http://127.0.0.1:9' }, () => hostAction(untouched, 'CONFIRMED', 'rust'));
    const hostDownRow = await row(untouched.id);
    const hostNextDown = await withEnv({ API_BASE_URL: 'http://127.0.0.1:9' }, () => hostAction(untouched, 'DECLINED', 'next'));
    check('a session without a token signs in; the API down is "unconfirmed" with nothing written; `next` never needs the API',
      tokenless === '/sign-in' && hostDown.endsWith('?error=unconfirmed') && hostDownRow.rsvp_status === 'PENDING' && hostNextDown === '(no redirect)' && (await row(untouched.id)).rsvp_status === 'DECLINED',
      `${tokenless}; ${hostDown}; ${hostNextDown}`);
  } finally {
    session.clerkUserId = null;
    session.token = null;
    // postgres.js 3.4 binds a JS array as a bare list, so ids go as an int[] literal and keys as a jsonb list.
    const ids = (values: number[]) => `{${values.join(',')}}`;
    const keys = (values: string[]) => JSON.stringify(values);
    const scopes = created.guests.map((id) => `rsvp:guest:${id}`);
    const buckets = [...created.guests.map((id) => `rsvp:link:${id}`), ...[...addressKeys].map(ipBucket)];
    await sql`delete from analytics_events where invitation_id = any(${ids(created.invitations)}::int[])`;
    await sql`delete from guests where invitation_id = any(${ids(created.invitations)}::int[])`;
    await sql`delete from invitations where id = any(${ids(created.invitations)}::int[])`;
    await sql`delete from users where id = any(${ids(created.users)}::int[])`;
    await sql`delete from api_idempotency_keys where scope in (select jsonb_array_elements_text(${keys(scopes)}::text::jsonb))`;
    // A host override's scope names its owner, invitation and guest (`rsvp:host:<owner>:<invitation>:<guest>`), and
    // every override here is a fixture user's.
    await sql`delete from api_idempotency_keys where scope like 'rsvp:host:%' and split_part(scope, ':', 3) = any(${ids(created.users)}::text[])`;
    await sql`delete from api_rate_limits where bucket in (select jsonb_array_elements_text(${keys(buckets)}::text::jsonb))`;
    const [left] = await sql`select (select count(*) from invitations where slug like ${`rsvp-api-%-${tag}`})::int as invitations,
      (select count(*) from api_rate_limits where bucket in (select jsonb_array_elements_text(${keys(buckets)}::text::jsonb)))::int as buckets,
      (select count(*) from api_idempotency_keys where scope in (select jsonb_array_elements_text(${keys(scopes)}::text::jsonb))
        or (scope like 'rsvp:host:%' and split_part(scope, ':', 3) = any(${ids(created.users)}::text[])))::int as keys`;
    check('the fixture leaves no row behind', left.invitations === 0 && left.buckets === 0 && left.keys === 0, JSON.stringify(left));
    for (const server of servers) server.close();
    await sql.end();
  }
  console.log(failures ? `verify-rsvp-api: ${failures} FAILED, ${passes} passed` : `verify-rsvp-api: all ${passes} checks passed`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
