/**
 * B-035 end to end: the editor's save (`app/api/invitations/[id]/detail`, GET and PATCH, the routes the editor calls)
 * through both content writers, against a running Rust API and a scratch database, through the typed client and the
 * service signature. Only Next.js's request primitives and Clerk's session are stubbed; invitations are made by the
 * product's `createInvitation`, so every save starts from creation's version 1.
 *
 *   POSTGRES_URL=… API_BASE_URL=http://127.0.0.1:8090 INTERNAL_API_SECRET=… OWNER_TOKEN_JWKS_PORT=8091 \
 *     OWNER_TOKEN_ISSUER=https://clerk.invitesion.test OWNER_TOKEN_AUTHORIZED_PARTIES=http://127.0.0.1:3100 \
 *     npx tsx scripts/verify-content-api.ts
 *
 * It proves, through each writer: a save stores the config and the next version, and the editor's reload reads both back;
 * two saves from one version store one and refuse the other with the stored version; a stale edit writes nothing; a
 * protected image of another invitation and a Premium palette on a Standard invitation are refused; B-036: a switch to a
 * Standard catalog theme is stored with the content kept and `invitations.template_id` untouched, a Premium one is
 * refused; another customer, an administrator and a signed-out request are refused; a page loaded before B-035 (no
 * version sent) still saves. G-041: a family's section order and font pairing are stored, and returning to the defaults
 * (sent as their own ids since session 44) is stored and read back; choices outside the contract are refused with nothing
 * written; an unchanged retired order does not block another change; a family switch keeps the choices; a Standard
 * invitation's Premium palette is refused whole and a paid Premium one stores it; a config-only restore keeps every event
 * id and the guests' RSVP rows. Across
 * writers: the same answers and the same stored rows. For the Rust writer: a lost answer is retried under its key and
 * replayed, written once and never reported as a conflict; two lost answers report "unconfirmed" and the next save from
 * the old version meets the conflict. Exactly one writer per call: with the API down under `rust` nothing is written,
 * and `next` never calls it; flipping the flag back and forth keeps one version sequence. Fixture rows are fictional,
 * tagged per run and removed.
 */
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import Module from 'node:module';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { JWK } from 'jose';

const session = { clerkUserId: null as string | null, token: null as string | null };
const stubs: Record<string, unknown> = {
  'server-only': {},
  'next/navigation': { redirect: (url: string) => { throw new Error(`redirect ${url}`); }, notFound: () => { throw new Error('notFound'); } },
  'next/cache': { revalidatePath: () => {}, revalidateTag: () => {} },
  'next/headers': { headers: async () => new Headers(), cookies: async () => ({ get: () => undefined, getAll: () => [] }) },
  '@clerk/nextjs/server': { auth: async () => ({ userId: session.clerkUserId, getToken: async () => session.token }), currentUser: async () => null },
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
const HEX = '0123456789abcdef01234567';

let failures = 0;
let passes = 0;
function check(label: string, ok: boolean, detail = '') {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
}
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, sorted(v)]));
  return value;
}
const same = (a: unknown, b: unknown) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

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
const FORWARDED = ['content-type', 'accept', 'x-invitesion-signature', 'idempotency-key', 'authorization', 'x-request-id'];
type Seen = { key?: string; status: number; replayed: string | null };
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
    seen.push({ key: headers['idempotency-key'], status: upstream.status, replayed: upstream.headers.get('idempotent-replayed') });
    if (step === 'forward-drop') {
      req.socket.destroy();
      return;
    }
    res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
    res.end(text);
  };
  return { seen, handler };
}

type Backend = 'next' | 'rust';

async function main() {
  const { client: sql } = await import('../lib/db/drizzle');
  const route = await import('../app/api/invitations/[id]/detail/route');
  const { createInvitation } = await import('../lib/invitation/create');
  const jose = await import('jose');

  const tag = randomUUID().replaceAll('-', '').slice(0, 12);
  const created = { users: [] as number[], invitations: [] as number[], orders: [] as number[] };

  async function user(name: string, role: 'CUSTOMER' | 'ADMIN') {
    const clerk = `user_contentapi_${name}_${tag}`;
    const [row] = await sql`insert into users (email, clerk_user_id, role) values (${`content-api-${name}-${tag}@example.invalid`}, ${clerk}, ${role}) returning id`;
    created.users.push(row.id);
    return { id: row.id as number, clerk };
  }
  async function invitation(owner: number, name: string, eventType: 'wedding' | 'birthday' | 'tasyakuran' = 'wedding') {
    const made = await createInvitation({ userId: owner, eventType, title: `content api ${name} ${tag}` });
    created.invitations.push(made.id);
    return made.id;
  }
  /** What both writers must store alike: the config, and every version's number, live flag and config. */
  async function state(id: number) {
    const [row] = await sql`select config from invitations where id = ${id}`;
    const versions = await sql`select version_no, is_live, config from invitation_versions where invitation_id = ${id} order by version_no, id`;
    return {
      config: row.config as unknown,
      versions: versions.map((v) => [v.version_no as number, v.is_live as boolean]),
      live: versions.filter((v) => v.is_live).map((v) => v.config as unknown),
    };
  }
  type State = Awaited<ReturnType<typeof state>>;
  const coherent = (s: State) => s.live.length === 1 && same(s.live[0], s.config);

  // Owner tokens: RS256 keys served as the API's JWKS, from the key file the other acceptance scripts share for this API
  // instance (named by a hash of its secret): the API refetches its JWKS for an unknown `kid` at most once per 30 s.
  const keyFile = join(tmpdir(), `invitesion-rsvp-acceptance-${createHash('sha256').update(SECRET).digest('hex').slice(0, 16)}.json`);
  const stored = existsSync(keyFile) ? (JSON.parse(readFileSync(keyFile, 'utf8')) as { kid: string; privateJwk: JsonWebKey; publicJwk: JsonWebKey }) : null;
  const kid = stored?.kid ?? `content-api-${tag}`;
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
  await listen((req, res) => {
    if (req.url === '/.well-known/jwks.json') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(jwks);
    } else {
      res.writeHead(404);
      res.end();
    }
  }, JWKS_PORT);
  const tokenFor = (sub: string) =>
    new jose.SignJWT({ azp: AZP, sid: `sess_${tag}` })
      .setProtectedHeader({ alg: 'RS256', kid })
      .setIssuer(ISSUER)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 120)
      .sign(privateKey);
  async function signIn(who: { clerk: string } | null) {
    session.clerkUserId = who?.clerk ?? null;
    session.token = who ? await tokenFor(who.clerk) : null;
  }

  type Answer = { status: number; body: any };
  async function call(backend: Backend, method: 'GET' | 'PATCH', id: number, body?: unknown, apiBase = API): Promise<Answer> {
    env.BACKEND_CONTENT = backend;
    env.API_BASE_URL = apiBase;
    try {
      const request = new Request(`http://app.test/api/invitations/${id}/detail`, method === 'PATCH'
        ? { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
        : { method });
      const response = await (method === 'GET' ? route.GET : route.PATCH)(request, { params: Promise.resolve({ id: String(id) }) });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    } finally {
      delete env.BACKEND_CONTENT;
      env.API_BASE_URL = API;
    }
  }
  /** An answer without what differs by construction between two fixtures: ids inside messages. */
  const answerOf = (a: Answer) => JSON.stringify(sorted({ status: a.status, body: a.body })).replace(/\/media\/protected\/\d+\//g, '/media/protected/<id>/');

  const owner = await user('owner', 'CUSTOMER');
  const other = await user('other', 'CUSTOMER');
  const admin = await user('admin', 'ADMIN');

  try {
    const results: Record<Backend, { answers: string[]; states: State[] }> = { next: { answers: [], states: [] }, rust: { answers: [], states: [] } };
    for (const backend of ['next', 'rust'] as const) {
      const record = (a: Answer) => (results[backend].answers.push(answerOf(a)), a);
      await signIn(owner);
      const id = await invitation(owner.id, `flow-${backend}`);

      const loaded = record(await call(backend, 'GET', id));
      check(`${backend}: the editor loads creation's config with version 1`, loaded.status === 200 && loaded.body.version === 1);
      const quote = { enabled: true, text: 'Dua hati, satu langkah.', author: 'Budi & Sari' };
      const saved = record(await call(backend, 'PATCH', id, { quote, expectedVersion: 1 }));
      const reload = record(await call(backend, 'GET', id));
      const afterSave = await state(id);
      results[backend].states.push(afterSave);
      check(`${backend}: a save stores the next version and the reload reads it back`,
        saved.status === 200 && saved.body.version === 2 && reload.body.version === 2 && same(reload.body.data.quote, quote) && same(afterSave.versions, [[1, false], [2, true]]) && coherent(afterSave),
        `${saved.status} v${saved.body?.version}`);

      const tabA = { quote: { ...quote, text: 'Tab A' }, expectedVersion: 2 };
      const tabB = { quote: { ...quote, text: 'Tab B' }, expectedVersion: 2 };
      const [a, b] = await Promise.all([call(backend, 'PATCH', id, tabA), call(backend, 'PATCH', id, tabB)]);
      const afterRace = await state(id);
      const winner = a.status === 200 ? tabA : tabB;
      const loser = a.status === 200 ? b : a;
      check(`${backend}: two saves from one version store exactly one, whole, and refuse the other with the stored version`,
        [a.status, b.status].sort().join() === '200,409' && loser.body?.error?.code === 'VERSION_CONFLICT' && loser.body.error.details.currentVersion === 3
          && same((afterRace.config as any).quote, winner.quote) && same(afterRace.versions, [[1, false], [2, false], [3, true]]) && coherent(afterRace),
        `${a.status}/${b.status}`);
      record({ status: loser.status, body: loser.body });
      results[backend].states.push({ ...afterRace, config: { ...(afterRace.config as object), quote: 'winner' }, live: [] });

      const stale = record(await call(backend, 'PATCH', id, { quote: { ...quote, text: 'Basi' }, expectedVersion: 2 }));
      check(`${backend}: a stale edit is refused and writes nothing`, stale.status === 409 && stale.body.error.details.currentVersion === 3 && same(await state(id), afterRace));

      const legacy = record(await call(backend, 'PATCH', id, { quote: { ...quote, text: 'Tanpa versi' } }));
      check(`${backend}: a page loaded before B-035 still saves`, legacy.status === 200 && legacy.body.version === 4);

      const invalid = record(await call(backend, 'PATCH', id, { quote: { enabled: 'ya' }, expectedVersion: 4 }));
      check(`${backend}: an invalid section is refused before any writer`, invalid.status === 422 && (await state(id)).versions.length === 4);

      const premium = record(await call(backend, 'PATCH', id, { theme: { paletteId: 'midnight' }, expectedVersion: 4 }));
      check(`${backend}: a Premium palette on a Standard invitation is refused (B-041)`,
        premium.status === 403 && premium.body.error.code === 'THEME_NOT_ENTITLED' && same(premium.body.error.details, [{ path: 'theme.paletteId', reason: 'premium-palette' }]) && (await state(id)).versions.length === 4);

      // B-036 (D-054): catalog ids (103 Sage Garden is free; 102 Rose Gold Romance is premium on a Standard palette).
      const switched = record(await call(backend, 'PATCH', id, { theme: { templateId: 103, paletteId: 'sage' }, expectedVersion: 4 }));
      const afterSwitch = await state(id);
      const [purchased] = await sql`select template_id from invitations where id = ${id}`;
      const switchedConfig = afterSwitch.config as { theme?: { templateId?: number; paletteId?: string }; quote?: { text?: string } };
      check(`${backend}: a switch to a Standard catalog theme is stored, the content kept and the purchased theme untouched (B-036)`,
        switched.status === 200 && switched.body.version === 5 && switchedConfig.theme?.templateId === 103 && switchedConfig.theme?.paletteId === 'sage'
          && switchedConfig.quote?.text === 'Tanpa versi' && purchased.template_id === null && coherent(afterSwitch),
        `${switched.status} v${switched.body?.version}`);
      const upgrade = record(await call(backend, 'PATCH', id, { theme: { templateId: 102, paletteId: 'rose-gold' }, expectedVersion: 5 }));
      check(`${backend}: a Premium catalog theme on a Standard invitation needs an upgrade and writes nothing (B-036)`,
        upgrade.status === 403 && upgrade.body.error.code === 'THEME_NOT_ENTITLED' && same(upgrade.body.error.details, [{ path: 'theme.templateId', reason: 'premium-template' }]) && (await state(id)).versions.length === 5);

      const birthday = await invitation(owner.id, `birthday-${backend}`, 'birthday');
      const foreign = record(await call(backend, 'PATCH', birthday, { birthdayPerson: { photoUrl: `/media/protected/${id}/${HEX}.png` }, expectedVersion: 1 }));
      const own = record(await call(backend, 'PATCH', birthday, { birthdayPerson: { photoUrl: `/media/protected/${birthday}/${HEX}.png` }, expectedVersion: 1 }));
      check(`${backend}: another invitation's protected photo is refused, this invitation's is stored (D-040)`,
        foreign.status === 400 && foreign.body.error.code === 'INVALID_MEDIA' && own.status === 200 && own.body.version === 2);

      // G-041: layout choices through the editor's real save. `call` serialises the body as `sendDetailSave` does, so an
      // `undefined` key is dropped exactly as in the browser. A separate invitation keeps the version arithmetic above.
      const g = await invitation(owner.id, `g041-${backend}`);
      let gv = 1;
      const themeOf = async () => ({ ...((await state(g)).config as { theme?: Record<string, unknown> }).theme });
      const saveTheme = async (theme: Record<string, unknown>, recorded = true) => {
        const answer = await call(backend, 'PATCH', g, { theme, expectedVersion: gv });
        if (recorded) record(answer);
        if (answer.status === 200) gv = answer.body.version;
        return answer;
      };
      const chosen = await saveTheme({ ...(await themeOf()), familyId: 'gapura', sectionOrder: 'story-first', fontPairing: 'sans' });
      const afterChoice = await themeOf();
      check(`${backend}: G-041 a family with its section order and font pairing is stored`,
        chosen.status === 200 && afterChoice.familyId === 'gapura' && afterChoice.sectionOrder === 'story-first' && afterChoice.fontPairing === 'sans', `${chosen.status}`);

      const reset = await saveTheme({ ...afterChoice, sectionOrder: 'standard', fontPairing: 'serif-display' });
      const resetReload = record(await call(backend, 'GET', g));
      const afterReset = await state(g);
      check(`${backend}: G-041 returning to the defaults is stored, read back by the editor's reload, one live version`,
        reset.status === 200 && (afterReset.config as any).theme.sectionOrder === 'standard' && (afterReset.config as any).theme.fontPairing === 'serif-display'
          && resetReload.body.data.theme.sectionOrder === 'standard' && resetReload.body.data.theme.fontPairing === 'serif-display' && coherent(afterReset),
        `${reset.status} ${JSON.stringify(resetReload.body?.data?.theme)}`);

      await saveTheme({ ...(await themeOf()), sectionOrder: 'photos-last' });
      const omitted = await saveTheme({ ...(await themeOf()), sectionOrder: undefined });
      check(`${backend}: G-041 a theme save that leaves a choice out keeps it (how the pre-fix editor sent a default, so it never reached storage)`,
        omitted.status === 200 && (await themeOf()).sectionOrder === 'photos-last');

      const beforeUnknown = await state(g);
      const unknown = await saveTheme({ ...(await themeOf()), sectionOrder: 'acak', fontPairing: 'Comic Sans' });
      check(`${backend}: G-041 an order and a pairing outside the contract are refused and nothing is written`,
        unknown.status === 403 && unknown.body.error.code === 'THEME_NOT_ENTITLED'
          && same(unknown.body.error.details, [{ path: 'theme.sectionOrder', reason: 'unknown-section-order' }, { path: 'theme.fontPairing', reason: 'unknown-font-pairing' }])
          && same(await state(g), beforeUnknown),
        `${unknown.status}`);

      // A value an older release stored (written past the writers, in the config and its live version alike).
      await sql`update invitations set config = jsonb_set(config, '{theme,sectionOrder}', '"lama"'::jsonb) where id = ${g}`;
      await sql`update invitation_versions set config = jsonb_set(config, '{theme,sectionOrder}', '"lama"'::jsonb) where invitation_id = ${g} and is_live`;
      const keptRetired = await saveTheme({ ...(await themeOf()), paletteId: 'sand' });
      const afterRetired = await themeOf();
      const replaced = await saveTheme({ ...afterRetired, sectionOrder: 'story-first' });
      check(`${backend}: G-041 an unchanged retired order does not block another theme change, and a valid order replaces it`,
        keptRetired.status === 200 && afterRetired.sectionOrder === 'lama' && afterRetired.paletteId === 'sand' && replaced.status === 200 && (await themeOf()).sectionOrder === 'story-first',
        `${keptRetired.status}/${replaced.status}`);

      const switchedFamily = await saveTheme({ ...(await themeOf()), familyId: 'kartu' });
      const afterFamily = await themeOf();
      check(`${backend}: G-041 a family switch keeps the choices, which every family declares`,
        switchedFamily.status === 200 && afterFamily.familyId === 'kartu' && afterFamily.sectionOrder === 'story-first' && afterFamily.fontPairing === 'serif-display');

      const beforePremium = await state(g);
      const premiumChoice = await saveTheme({ ...afterFamily, sectionOrder: 'photos-last', paletteId: 'midnight' });
      check(`${backend}: G-041 a Standard invitation's save with a Premium palette is refused whole, its valid order included`,
        premiumChoice.status === 403 && same(premiumChoice.body.error.details, [{ path: 'theme.paletteId', reason: 'premium-palette' }]) && same(await state(g), beforePremium));

      const [paid] = await sql`insert into orders (user_id, invitation_id, tier, amount, currency, rail, reference, status, paid_at)
        values (${owner.id}, ${g}, 'premium', 249000, 'IDR', 'qris', ${`vne_g041_${backend}_${tag}`}, 'PAID', now() at time zone 'utc') returning id`;
      created.orders.push(paid.id);
      const paidChoice = await saveTheme({ ...afterFamily, sectionOrder: 'photos-last', fontPairing: 'sans', paletteId: 'midnight' });
      const afterPaid = await themeOf();
      check(`${backend}: G-041 a paid Premium invitation stores a valid change with a Premium palette`,
        paidChoice.status === 200 && afterPaid.sectionOrder === 'photos-last' && afterPaid.fontPairing === 'sans' && afterPaid.paletteId === 'midnight', `${paidChoice.status}`);

      // A config-only restore (what G-046 will send): an earlier version's theme and events saved back. Event ids are random
      // per run, so these answers stay out of the cross-writer comparison; the check compares within the writer.
      const withEvents = await call(backend, 'PATCH', g, {
        events: [{ title: 'Akad (fiktif)', startAt: '2027-03-14T09:00:00+07:00' }, { title: 'Resepsi (fiktif)', startAt: '2027-03-14T11:00:00+07:00' }],
        expectedVersion: gv,
      });
      gv = withEvents.body?.version ?? gv;
      const [liveVersion] = await sql`select config from invitation_versions where invitation_id = ${g} and is_live`;
      const savedConfig = liveVersion.config as { theme: Record<string, unknown>; events: Array<{ id: string }> };
      const eventIds = savedConfig.events.map((event) => event.id);
      const answers = Object.fromEntries(eventIds.map((eventId, i) => [eventId, { status: i === 0 ? 'CONFIRMED' : 'DECLINED', attending: i === 0 ? 2 : null }]));
      const [guest] = await sql`insert into guests (invitation_id, name, slug, rsvp_status, rsvp_event_answers)
        values (${g}, 'Budi Tamu (fiktif)', ${`budi-tamu-${backend}-${tag}`}, 'CONFIRMED', ${JSON.stringify(answers)}::text::jsonb) returning id`;
      const guestRow = async () => (await sql`select rsvp_status, rsvp_event_answers, rsvp_answers, guest_count from guests where id = ${guest.id}`)[0];
      const guestBefore = await guestRow();
      await saveTheme({ ...savedConfig.theme, sectionOrder: 'standard', fontPairing: 'serif-display' }, false);
      const restored = await call(backend, 'PATCH', g, { theme: savedConfig.theme, events: savedConfig.events, expectedVersion: gv });
      gv = restored.body?.version ?? gv;
      const afterRestore = await state(g);
      const restoredConfig = afterRestore.config as typeof savedConfig;
      check(`${backend}: G-041 restoring a saved version's theme and events keeps every event id and leaves the guest's RSVP untouched`,
        withEvents.status === 200 && eventIds.length === 2 && restored.status === 200 && same(restoredConfig.theme, savedConfig.theme)
          && same(restoredConfig.events.map((event) => event.id), eventIds) && same(await guestRow(), guestBefore) && coherent(afterRestore),
        `${withEvents.status}/${restored.status}`);
      results[backend].states.push({ config: { theme: restoredConfig.theme }, versions: afterRestore.versions, live: [] });

      // B-032 (G-060) and I-11 through the editor's real save, on their own invitation so the version arithmetic above is
      // unchanged: a memorial's occasion and countdown switch, and a corpus reference. The id `fiktif-entri-uji` is
      // fictional and test-only; the shipped corpus is empty, so no reference resolves on a page (the renders are pinned in
      // `tests/b032-memorial.test.ts`). The editor always sends the countdown as a boolean and clears a reference with ''.
      const m = await invitation(owner.id, `b032-${backend}`, 'tasyakuran');
      let mv = 1;
      const memorialConfig = async () => (await state(m)).config as { settings?: Record<string, unknown>; quote?: Record<string, unknown> };
      const saveMemorial = async (body: Record<string, unknown>, recorded = true) => {
        const answer = await call(backend, 'PATCH', m, { ...body, expectedVersion: mv });
        if (recorded) record(answer);
        if (answer.status === 200) mv = answer.body.version;
        return answer;
      };
      // A draft without a template is created with no settings at all, so the title and language are saved first: the
      // memorial save must keep them beside its own keys (the facade's deep merge).
      const titled = await saveMemorial({ settings: { title: 'Tahlilan Bapak Sutrisno (fiktif)', language: 'id' } });
      const marked = await saveMemorial({ settings: { occasion: 'memorial', countdown: false } });
      const markedReload = record(await call(backend, 'GET', m));
      const afterMarked = await state(m);
      const markedSettings = (afterMarked.config as { settings: Record<string, unknown> }).settings;
      check(`${backend}: B-032 a memorial's occasion and an explicit countdown off are stored, kept beside the other settings and read back by the reload`,
        titled.status === 200 && marked.status === 200 && markedSettings.occasion === 'memorial' && markedSettings.countdown === false
          && markedSettings.title === 'Tahlilan Bapak Sutrisno (fiktif)' && markedSettings.language === 'id'
          && markedReload.body.data.settings.occasion === 'memorial' && markedReload.body.data.settings.countdown === false
          && markedReload.body.data.settings.title === 'Tahlilan Bapak Sutrisno (fiktif)' && coherent(afterMarked),
        `${titled.status}/${marked.status} ${JSON.stringify(markedReload.body?.data?.settings)}`);

      const shown = await saveMemorial({ settings: { ...markedSettings, countdown: true } });
      const shownSettings = (await memorialConfig()).settings ?? {};
      check(`${backend}: B-032 switching the countdown back on stores an explicit true and keeps the occasion`,
        shown.status === 200 && shownSettings.countdown === true && shownSettings.occasion === 'memorial', `${shown.status}`);

      const beforeBad = await state(m);
      const badOccasion = await saveMemorial({ settings: { occasion: 'pesta' } });
      const badCountdown = await saveMemorial({ settings: { countdown: 'off' } });
      const badCorpus = await saveMemorial({ quote: { enabled: true, corpusId: 'Bukan Id!' } });
      check(`${backend}: B-032 / I-11 an unknown occasion, a countdown that is not a boolean and a malformed corpus id are refused before any writer, nothing written`,
        badOccasion.status === 422 && badCountdown.status === 422 && badCorpus.status === 422 && same(await state(m), beforeBad),
        `${badOccasion.status}/${badCountdown.status}/${badCorpus.status}`);

      const referenced = await saveMemorial({ quote: { enabled: true, corpusId: 'fiktif-entri-uji' } });
      const referencedReload = record(await call(backend, 'GET', m));
      const cleared = await saveMemorial({ quote: { enabled: true, corpusId: '' } });
      check(`${backend}: I-11 a corpus reference is stored as its id, read back by the reload and cleared by an empty id`,
        referenced.status === 200 && referencedReload.body.data.quote.corpusId === 'fiktif-entri-uji' && cleared.status === 200 && (await memorialConfig()).quote?.corpusId === '',
        `${referenced.status}/${cleared.status}`);

      const beforeStale = await state(m);
      const staleMemorial = record(await call(backend, 'PATCH', m, { settings: { countdown: false }, expectedVersion: mv - 1 }));
      check(`${backend}: B-032 a stale countdown save is refused with the stored version and writes nothing`,
        staleMemorial.status === 409 && staleMemorial.body.error.code === 'VERSION_CONFLICT' && staleMemorial.body.error.details.currentVersion === mv && same(await state(m), beforeStale),
        `${staleMemorial.status}`);

      // A config-only restore of a memorial (what G-046 will send). Event ids are random per run, so these answers stay out
      // of the cross-writer comparison, as G-041's do.
      const memorialEvents = await saveMemorial({
        settings: { countdown: false },
        events: [{ title: 'Tahlilan & Doa Bersama (fiktif)', startAt: '2027-04-02T19:30:00+07:00' }, { title: 'Doa 40 hari (fiktif)', startAt: '2027-05-05T19:30:00+07:00' }],
      }, false);
      const [memorialLive] = await sql`select config from invitation_versions where invitation_id = ${m} and is_live`;
      const savedMemorial = memorialLive.config as { settings: Record<string, unknown>; events: Array<{ id: string }> };
      const memorialEventIds = savedMemorial.events.map((event) => event.id);
      const memorialAnswers = Object.fromEntries(memorialEventIds.map((eventId, i) => [eventId, { status: i === 0 ? 'CONFIRMED' : 'DECLINED', attending: i === 0 ? 3 : null }]));
      const [mourner] = await sql`insert into guests (invitation_id, name, slug, rsvp_status, rsvp_event_answers)
        values (${m}, 'Sari Tamu (fiktif)', ${`sari-tamu-${backend}-${tag}`}, 'CONFIRMED', ${JSON.stringify(memorialAnswers)}::text::jsonb) returning id`;
      const mournerRow = async () => (await sql`select rsvp_status, rsvp_event_answers, rsvp_answers, guest_count from guests where id = ${mourner.id}`)[0];
      const mournerBefore = await mournerRow();
      await saveMemorial({ settings: { countdown: true } }, false);
      const memorialRestored = await saveMemorial({ settings: savedMemorial.settings, events: savedMemorial.events }, false);
      const afterMemorialRestore = await state(m);
      const memorialRestoredConfig = afterMemorialRestore.config as typeof savedMemorial & { quote?: unknown };
      check(`${backend}: B-032 restoring a saved version brings back its countdown off and the occasion, keeps every event id and leaves the guest's RSVP untouched`,
        memorialEvents.status === 200 && memorialRestored.status === 200 && memorialRestoredConfig.settings.countdown === false && memorialRestoredConfig.settings.occasion === 'memorial'
          && same(memorialRestoredConfig.events.map((event) => event.id), memorialEventIds) && same(await mournerRow(), mournerBefore) && coherent(afterMemorialRestore),
        `${memorialEvents.status}/${memorialRestored.status}`);
      results[backend].states.push({
        config: { settings: { occasion: memorialRestoredConfig.settings.occasion, countdown: memorialRestoredConfig.settings.countdown }, quote: memorialRestoredConfig.quote },
        versions: afterMemorialRestore.versions,
        live: [],
      });

      await signIn(other);
      const intruder = record(await call(backend, 'PATCH', id, { quote: { ...quote, text: 'Bukan milikmu' }, expectedVersion: 4 }));
      const peek = record(await call(backend, 'GET', id));
      await signIn(admin);
      const administrator = record(await call(backend, 'PATCH', id, { quote: { ...quote, text: 'Admin' }, expectedVersion: 4 }));
      await signIn(null);
      const anonymous = record(await call(backend, 'PATCH', id, { quote: { ...quote, text: 'Anonim' }, expectedVersion: 4 }));
      const afterRefusals = await state(id);
      check(`${backend}: another customer gets "not found", an administrator and a signed-out request are refused, nothing is written`,
        intruder.status === 404 && peek.status === 404 && administrator.status === 403 && anonymous.status === 401 && afterRefusals.versions.length === 5 && (afterRefusals.config as any).quote.text === 'Tanpa versi');
      results[backend].states.push(afterRefusals);
    }

    check('both writers give the same answers, step by step', same(results.next.answers, results.rust.answers),
      results.next.answers.map((answer, i) => (answer === results.rust.answers[i] ? '' : `#${i}: ${answer} ≠ ${results.rust.answers[i]}`)).filter(Boolean).join('; ').slice(0, 400));
    check('both writers store the same rows', same(results.next.states, results.rust.states));

    // The Rust writer's lost answers.
    await signIn(owner);
    const lost = await invitation(owner.id, 'lost');
    const once = proxy(['forward-drop']);
    const onceUrl = await listen(once.handler);
    const replayed = await call('rust', 'PATCH', lost, { quote: { enabled: true, text: 'Sekali' }, expectedVersion: 1 }, onceUrl);
    const afterOnce = await state(lost);
    check('rust: a lost answer is retried under its key and replayed, written once, never a conflict',
      replayed.status === 200 && replayed.body.version === 2 && once.seen.length === 2 && once.seen[0].key === once.seen[1].key && once.seen[1].replayed === 'true' && same(afterOnce.versions, [[1, false], [2, true]]),
      JSON.stringify(once.seen.map((s) => [s.status, s.replayed])));
    const twice = proxy(['forward-drop', 'forward-drop']);
    const twiceUrl = await listen(twice.handler);
    const unconfirmed = await call('rust', 'PATCH', lost, { quote: { enabled: true, text: 'Dua kali hilang' }, expectedVersion: 2 }, twiceUrl);
    const next = await call('rust', 'PATCH', lost, { quote: { enabled: true, text: 'Dari versi lama' }, expectedVersion: 2 });
    const afterTwice = await state(lost);
    check('rust: two lost answers report "unconfirmed"; the write committed once and the next save from the old version meets the conflict',
      unconfirmed.status === 503 && unconfirmed.body.error.code === 'SAVE_UNCONFIRMED' && afterTwice.versions.length === 3 && next.status === 409 && next.body.error.details.currentVersion === 3,
      `${unconfirmed.status} ${next.status}`);

    // Exactly one writer per call.
    const down = await call('rust', 'PATCH', lost, { quote: { enabled: true, text: 'API mati' }, expectedVersion: 3 }, 'http://127.0.0.1:9');
    check('rust with the API down writes nothing and never falls back to the TypeScript writer', down.status === 503 && (await state(lost)).versions.length === 3);
    const counter = proxy([]);
    const counterUrl = await listen(counter.handler);
    const viaNext = await call('next', 'PATCH', lost, { quote: { enabled: true, text: 'Lewat next' }, expectedVersion: 3 }, counterUrl);
    check('next never calls the API', viaNext.status === 200 && viaNext.body.version === 4 && counter.seen.length === 0);
    const flips: Answer[] = [];
    for (const [i, backend] of (['rust', 'next', 'rust'] as const).entries()) {
      flips.push(await call(backend, 'PATCH', lost, { quote: { enabled: true, text: `Balik ${i}` }, expectedVersion: 4 + i }));
    }
    const afterFlips = await state(lost);
    check('flipping BACKEND_CONTENT back and forth keeps one version sequence and one live row',
      flips.map((f) => f.body?.version).join() === '5,6,7' && afterFlips.versions.map(([n]) => n).join() === '1,2,3,4,5,6,7' && coherent(afterFlips) && (afterFlips.config as any).quote.text === 'Balik 2');
  } finally {
    const ids = created.invitations;
    await sql`delete from guests where invitation_id = any(${ids}::int[])`;
    await sql`delete from orders where id = any(${created.orders}::int[])`;
    await sql`delete from invitation_versions where invitation_id = any(${ids}::int[])`;
    await sql`delete from invitations where id = any(${ids}::int[])`;
    await sql`delete from users where id = any(${created.users}::int[])`;
    await sql`delete from api_idempotency_keys where scope like 'content:%' and (string_to_array(scope, ':'))[3] = any(${ids.map(String)}::text[])`;
    const [left] = await sql`select (select count(*) from invitations where id = any(${ids}::int[]))::int as invitations,
      (select count(*) from users where clerk_user_id like ${`user_contentapi_%_${tag}`})::int as users,
      (select count(*) from api_idempotency_keys where scope like 'content:%' and (string_to_array(scope, ':'))[3] = any(${ids.map(String)}::text[]))::int as keys,
      (select count(*) from orders where id = any(${created.orders}::int[]))::int as orders,
      (select count(*) from guests where invitation_id = any(${ids}::int[]))::int as guests`;
    check('the fixture leaves no row behind', left.invitations === 0 && left.users === 0 && left.keys === 0 && left.orders === 0 && left.guests === 0, JSON.stringify(left));
    for (const server of servers) server.close();
    await sql.end();
  }
  console.log(failures ? `verify-content-api: ${failures} FAILED, ${passes} passed` : `verify-content-api: all ${passes} checks passed`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
