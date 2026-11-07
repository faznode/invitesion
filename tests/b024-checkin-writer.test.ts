// B-024 (D-056, ADR-A3): the check-in path without a database. The facade keeps every pass inert with the flag off and
// selects exactly one roster writer; the Rust client resends an unknown outcome once under the scanner's batch key and
// maps every answer; both writers run the same statements in the same order; the route refuses cross-site requests
// before it reads a session; the scanner's outbox resends a batch unchanged until it is answered. The database flows run
// in `scripts/verify-guest-pass-api.ts` (the rust job) and `services/api/tests/guest_pass_database.rs`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import './support/render-guest-page';
import { sameOrigin } from '../lib/api/same-origin';
import { EMPTY_QUEUE, enqueue, nextBatch, parseStoredQueue, settle } from '../lib/invitation/checkin-queue';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const TOKEN = `IVP1.${'A'.repeat(48)}`;
const KEY = 'batch-3f9a2b1c-4d5e';
const API_ENV = { API_BASE_URL: 'http://api.invalid', INTERNAL_API_SECRET: 's'.repeat(40), BACKEND_ROSTER: 'rust', FLAG_GUEST_PASS: 'on' };

test('the facade: flag off answers disabled and calls no writer; Rust without a session answers sign-in; no secret, unconfigured', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('no request expected');
  });
  const { checkInWithPasses } = await import('../lib/invitation/roster');
  const caller = { userId: 1, ownerToken: async () => null };
  const input = { invitationId: 9, scans: [{ token: TOKEN }], key: KEY };
  assert.deepEqual(await checkInWithPasses(caller, input, { ...API_ENV, FLAG_GUEST_PASS: 'off' }), { kind: 'disabled' });
  assert.deepEqual(await checkInWithPasses(caller, input, API_ENV), { kind: 'signin' });
  assert.deepEqual(await checkInWithPasses(caller, input, { FLAG_GUEST_PASS: 'on', BACKEND_ROSTER: 'next' }), { kind: 'unconfigured' });
  assert.equal(fetchMock.mock.callCount(), 0);

  const facade = source('lib/invitation/roster.ts');
  assert.match(
    facade,
    /export async function checkInWithPasses\([\s\S]*?if \(!isFlagOn\('GUEST_PASS', env\)\) return \{ kind: 'disabled' \};\n  if \(rust\(env\)\) \{[\s\S]*?: \{ kind: 'signin' \};\n  \}\n  const secrets = passVerifySecrets\(env\);\n  if \(!secrets\.length\) return \{ kind: 'unconfigured' \};\n  return next\.passCheckinNext\(/,
    'the flag first, then one writer; the rust branch returns',
  );
});

type Reply = { status: number; body: unknown } | 'transport';

async function throughApi(t: TestContext, replies: Reply[]) {
  const requests: { body: string; key: string | null }[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    requests.push({ body: String(init.body), key: new Headers(init.headers).get('idempotency-key') });
    const reply = replies.shift();
    if (!reply || reply === 'transport') throw new TypeError('fetch failed');
    return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'content-type': 'application/json' } });
  });
  const { passCheckinsThroughApi } = await import('../lib/invitation/roster-api');
  let outcome: unknown;
  try {
    outcome = await passCheckinsThroughApi({ invitationId: 9, scans: [{ token: TOKEN, scannedAt: '2026-11-07T11:30:00.000Z' }], key: KEY, ownerToken: 'token' }, API_ENV);
  } catch (error) {
    outcome = { thrown: (error as Error).message };
  }
  return { outcome, requests };
}

const problem = (status: number, code: string) => ({ status, body: { type: `x/${code}`, title: 'x', status, code } });
const checked = { status: 200, body: { results: [{ outcome: 'checked-in', name: 'Budi', checkedInAt: '2026-11-07T11:30:00.000Z' }] } };

test('the Rust client resends an unknown outcome once under the batch key and maps every answer', async (t) => {
  const cases: { name: string; replies: Reply[]; expect: unknown; calls: number }[] = [
    { name: 'checked in', replies: [checked], expect: { kind: 'checked', results: [{ outcome: 'checked-in', name: 'Budi', checkedInAt: '2026-11-07T11:30:00.000Z' }] }, calls: 1 },
    { name: 'a 503, then the replayed answer', replies: [problem(503, 'internal'), checked], expect: { kind: 'checked', results: [{ outcome: 'checked-in', name: 'Budi', checkedInAt: '2026-11-07T11:30:00.000Z' }] }, calls: 2 },
    { name: 'unknown twice', replies: [problem(503, 'internal'), 'transport'], expect: { kind: 'unconfirmed' }, calls: 2 },
    { name: 'refusals carry no name', replies: [{ status: 200, body: { results: [{ outcome: 'expired' }, { outcome: 'unknown' }, { outcome: 'invalid', name: 'x' }] } }], expect: { kind: 'checked', results: [{ outcome: 'expired' }, { outcome: 'unknown' }, { outcome: 'invalid' }] }, calls: 1 },
    { name: 'not opted in', replies: [problem(409, 'guest_pass.not_enabled')], expect: { kind: 'disabled' }, calls: 1 },
    { name: 'no secret on the API', replies: [problem(503, 'guest_pass.not_configured')], expect: { kind: 'unconfigured' }, calls: 1 },
    { name: 'not this owner', replies: [problem(404, 'roster.not_found')], expect: { kind: 'notfound' }, calls: 1 },
    { name: 'no live customer behind the token', replies: [problem(403, 'owner.role_not_allowed')], expect: { kind: 'signin' }, calls: 1 },
  ];
  for (const { name, replies, expect, calls } of cases) {
    const { outcome, requests } = await throughApi(t, replies);
    assert.deepEqual(outcome, expect, name);
    assert.equal(requests.length, calls, `${name}: requests`);
    assert.ok(requests.every(({ body, key }) => body === requests[0].body && key === KEY), `${name}: a resend is the same batch under the scanner's key`);
    assert.deepEqual(JSON.parse(requests[0].body), { scans: [{ token: TOKEN, scannedAt: '2026-11-07T11:30:00.000Z' }] });
    t.mock.restoreAll();
  }
});

test('both writers run the same statements in the same order', () => {
  const ts = source('lib/invitation/roster-next.ts');
  const writer = ts.slice(ts.indexOf('export async function passCheckinNext'), ts.indexOf('/** D-037: one guest'));
  const order = [/ownedInvitation\(tx,/, /passCheckInEnabled\(invitation\.config\)/, /lockRoster\(tx,/, /readGuestPass\(scan\.token, input\.secrets, nowSeconds\)/, /eq\(guests\.passId, read\.passId\)\)\)\n\s*\.for\('update'\)/, /checkInTime\(scan\.scannedAt, now\)/, /\.update\(guests\)\.set\(\{ checkedInAt: at \}\)/, /eventType: 'CHECKIN', meta: \{ source: 'pass' \}/];
  let at = 0;
  for (const step of order) {
    const found = writer.slice(at).search(step);
    assert.ok(found >= 0, `TypeScript writer: ${step}`);
    at += found;
  }
  const rs = source('services/api/src/roster/http.rs');
  const handler = rs.slice(rs.indexOf('pub async fn pass_checkins'));
  const rustOrder = [/owned_invitation\(&mut tx, &owner, invitation_id\)/, /pass::check_in_enabled\(&config\)/, /lock_roster\(&mut tx, invitation_id\)/, /pass::read\(&scan\.token, &state\.guest_pass_secrets, now_seconds\)/, /select id, name, checked_in_at from guests where invitation_id = \$1 and pass_id = \$2 for update/, /pass::check_in_time\(scan\.scanned_at\.as_deref\(\), now\)/, /update guests set checked_in_at = \$1 where id = \$2/, /'CHECKIN', \$3\)",[\s\S]*?json!\(\{ "source": "pass" \}\)/];
  at = 0;
  for (const step of rustOrder) {
    const found = handler.slice(at).search(step);
    assert.ok(found >= 0, `Rust writer: ${step}`);
    at += found;
  }
});

test('the route refuses cross-site requests before reading a session, keeps passes inert with the flag off, and limits the rate', () => {
  const route = source('app/api/invitations/[id]/checkins/route.ts');
  const order = [/if \(!sameOrigin\(req\.headers\)\)/, /startsWith\('application\/json'\)/, /await getUser\(\)/, /if \(!isFlagOn\('GUEST_PASS'\)\) return apiError\(404/, /bodySchema\.safeParse/, /await hit\(`checkin:\$\{user\.id\}:\$\{id\}`/, /checkInWithPasses\(/];
  let at = 0;
  for (const step of order) {
    const found = route.slice(at).search(step);
    assert.ok(found >= 0, `route: ${step}`);
    at += found;
  }
  assert.doesNotMatch(route, /@\/lib\/db\/(?:drizzle|schema)|roster-(?:next|api)/, 'the route writes only through the facade');

  const headers = (entries: Record<string, string>) => new Headers(entries);
  assert.equal(sameOrigin(headers({ 'sec-fetch-site': 'same-origin', origin: 'https://invitesion.id', host: 'invitesion.id' })), true);
  assert.equal(sameOrigin(headers({ origin: 'https://invitesion.id', host: 'invitesion.id' })), true, 'a browser without Fetch Metadata');
  assert.equal(sameOrigin(headers({ origin: 'https://app.invitesion.id', 'x-forwarded-host': 'app.invitesion.id', host: 'internal:3000' })), true, 'behind the proxy');
  assert.equal(sameOrigin(headers({ 'sec-fetch-site': 'cross-site', origin: 'https://evil.example', host: 'invitesion.id' })), false);
  assert.equal(sameOrigin(headers({ 'sec-fetch-site': 'same-site', origin: 'https://sub.invitesion.id', host: 'invitesion.id' })), false);
  assert.equal(sameOrigin(headers({ origin: 'https://evil.example', host: 'invitesion.id' })), false);
  assert.equal(sameOrigin(headers({ origin: 'null', host: 'invitesion.id' })), false);
  assert.equal(sameOrigin(headers({ host: 'invitesion.id' })), false, 'neither header');
});

test("the outbox: one arrival per token, a batch resent unchanged under its key, and a device's stored queue read leniently", () => {
  let state = EMPTY_QUEUE;
  for (let i = 0; i < 55; i += 1) state = enqueue(state, { id: `s${i}`, token: `IVP1.${String(i).padStart(48, 'A')}`, scannedAt: '2026-11-07T11:30:00.000Z' });
  state = enqueue(state, { id: 'dup', token: state.scans[0].token, scannedAt: '2026-11-07T11:31:00.000Z' });
  assert.equal(state.scans.length, 55, 'a token already waiting is one arrival');

  let keys = 0;
  const mint = () => `key-${(keys += 1)}`;
  const first = nextBatch(state, mint)!;
  assert.equal(first.scans.length, 50);
  assert.equal(first.key, 'key-1');
  const resent = nextBatch(first.state, mint)!;
  assert.equal(resent.key, 'key-1', 'unanswered: the same key');
  assert.deepEqual(resent.scans, first.scans, 'unanswered: the same scans');
  state = settle(resent.state, 'key-1');
  assert.equal(state.scans.length, 5);
  assert.equal(settle(state, 'key-1'), state, 'a stale answer changes nothing');
  const second = nextBatch(state, mint)!;
  assert.equal(second.key, 'key-2');
  assert.equal(nextBatch(settle(second.state, 'key-2'), mint), null);

  assert.deepEqual(parseStoredQueue(null), EMPTY_QUEUE);
  assert.deepEqual(parseStoredQueue('{not json'), EMPTY_QUEUE);
  assert.deepEqual(parseStoredQueue(JSON.stringify({ scans: [{ id: 'a', token: TOKEN, scannedAt: 'x' }, { id: 1 }, null], batch: { key: 'k', ids: ['gone'] } })), {
    scans: [{ id: 'a', token: TOKEN, scannedAt: 'x' }],
    batch: null,
  });
  const scanner = source('app/(customer)/dashboard/invitations/[id]/checkin/checkin-scanner.tsx');
  assert.doesNotMatch(scanner, /localStorage\.setItem\([^)]*name/, 'names never reach the device store');
  assert.match(scanner, /localStorage\.setItem\(storageKey, JSON\.stringify\(next\)\)/);
});

test('the scanner page hands out one-way keys, never pass ids, and the flag and opt-in gate every entry', () => {
  const page = source('app/(customer)/dashboard/invitations/[id]/checkin/page.tsx');
  assert.match(page, /key: passLookupKey\(row\.passId\)/);
  assert.doesNotMatch(page, /passId: row\.passId|passId=\{/, 'the pass id stays on the server');
  assert.match(page, /if \(!Number\.isInteger\(id\) \|\| !isFlagOn\('GUEST_PASS'\)\) notFound\(\);/);
  const actions = source('app/(customer)/dashboard/invitations/[id]/checkin/actions.ts');
  assert.match(actions, /if \(!passManualAllowed\(invitation\.config\)\) return \{ ok: false, reason: 'manual-off' \};/);
  assert.match(source('lib/flags.ts'), /GUEST_PASS: false,/);
});
