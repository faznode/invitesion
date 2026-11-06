// R-01 / R-02: the TypeScript side of the Rust API boundary. The signature vectors are shared with
// services/api/tests/contract_vectors.rs; the client must send exactly the bytes it signed; BACKEND_VIEWS selects
// exactly one writer and never falls back to the other.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { backendFor } from '../lib/backend';
import { SIGNATURE_HEADER, canonicalMessage, signServiceRequest } from '../lib/api/signature';

const serverOnly = require.resolve('server-only');
require.cache[serverOnly] ??= { id: serverOnly, filename: serverOnly, loaded: true, exports: {} } as unknown as NodeJS.Module;
const client = () => require('../lib/api/client') as typeof import('../lib/api/client');

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
type SignCase = { name: string; timestamp: number; method: string; pathAndQuery: string; body: string; header: string };
const vectors = JSON.parse(source('contracts/vectors/service-signature.json')) as {
  secret: string;
  maxSkewSeconds: number;
  signs: SignCase[];
};
const SECRET = 'api-contract-test-secret-0123456789abcdef';

test('R-01: the signer reproduces every shared vector byte for byte', () => {
  assert.ok(vectors.signs.length >= 5);
  for (const c of vectors.signs) {
    assert.equal(signServiceRequest(vectors.secret, c.timestamp, c.method, c.pathAndQuery, c.body), c.header, c.name);
  }
  assert.equal(SIGNATURE_HEADER, 'x-invitesion-signature');
  assert.match(canonicalMessage(1, 'GET', '/v1/health/ready', ''), /^1\.GET\.\/v1\/health\/ready\.e3b0c44298fc1c149afbf4c8996fb924/);
});

test('R-02: BACKEND_VIEWS selects one writer; anything unknown keeps the default', () => {
  assert.equal(backendFor('VIEWS', {}), 'next', 'Next.js until the slice passes its gates');
  assert.equal(backendFor('VIEWS', { BACKEND_VIEWS: 'rust' }), 'rust');
  assert.equal(backendFor('VIEWS', { BACKEND_VIEWS: ' RUST ' }), 'rust');
  assert.equal(backendFor('VIEWS', { BACKEND_VIEWS: 'next' }), 'next');
  for (const odd of ['', 'both', 'rsut', 'true', '1']) assert.equal(backendFor('VIEWS', { BACKEND_VIEWS: odd }), 'next', odd);
});

test('R-01: the client configuration fails closed', () => {
  const { apiConfigFromEnv, ApiConfigError } = client();
  assert.throws(() => apiConfigFromEnv({}), ApiConfigError);
  assert.throws(() => apiConfigFromEnv({ API_BASE_URL: 'http://127.0.0.1:8080' }), ApiConfigError, 'no secret');
  assert.throws(() => apiConfigFromEnv({ API_BASE_URL: 'http://127.0.0.1:8080', INTERNAL_API_SECRET: 'short' }), ApiConfigError);
  assert.throws(() => apiConfigFromEnv({ API_BASE_URL: 'ftp://x', INTERNAL_API_SECRET: SECRET }), ApiConfigError);
  assert.deepEqual(apiConfigFromEnv({ API_BASE_URL: 'https://api.example.invalid//', INTERNAL_API_SECRET: SECRET }), {
    baseUrl: 'https://api.example.invalid',
    secret: SECRET,
  });
});

type Captured = { url: string; method: string; headers: Record<string, string>; body: string };
function fakeFetch(status: number, responseBody: string, captured: Captured[]): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    captured.push({ url: String(url), method: init?.method ?? 'GET', headers: init?.headers as Record<string, string>, body: String(init?.body ?? '') });
    return new Response(responseBody, { status, headers: { 'content-type': status < 400 ? 'application/json' : 'application/problem+json' } });
  }) as typeof fetch;
}

test('R-01: the client signs exactly the method, path and bytes it sends', async () => {
  const { apiPost, apiGet } = client();
  const captured: Captured[] = [];
  const config = { baseUrl: 'http://api.test', secret: SECRET, fetch: fakeFetch(200, '{"recorded":true}', captured) };
  assert.deepEqual(await apiPost(config, '/v1/views', { invitationId: 7, guestId: 42 }, { requestId: 'req-1' }), { recorded: true });
  await apiGet({ ...config, fetch: fakeFetch(200, '{"userId":1,"role":"CUSTOMER"}', captured) }, '/v1/me', { ownerToken: 'tok' });
  const [post, get] = captured;
  assert.equal(post.url, 'http://api.test/v1/views');
  assert.equal(post.body, '{"invitationId":7,"guestId":42}');
  assert.equal(post.headers['x-request-id'], 'req-1');
  const t = Number(/^t=(\d+),v1=[0-9a-f]{64}$/.exec(post.headers[SIGNATURE_HEADER])?.[1]);
  assert.ok(Math.abs(t - Date.now() / 1000) < 5, 'signed now');
  assert.equal(post.headers[SIGNATURE_HEADER], signServiceRequest(SECRET, t, 'POST', '/v1/views', post.body));
  assert.equal(get.method, 'GET');
  assert.equal(get.body, '');
  assert.equal(get.headers.authorization, 'Bearer tok');
  const tGet = Number(/^t=(\d+),/.exec(get.headers[SIGNATURE_HEADER])?.[1]);
  assert.equal(get.headers[SIGNATURE_HEADER], signServiceRequest(SECRET, tGet, 'GET', '/v1/me', ''));
});

test('R-01: problems and transport failures surface as ApiProblem with a stable code', async () => {
  const { apiPost, ApiProblem } = client();
  const problem = JSON.stringify({ type: 'https://invitesion.id/problems/invitation_or_guest.not_found', title: 'Not found', status: 404, code: 'invitation_or_guest.not_found' });
  const notFound = { baseUrl: 'http://api.test', secret: SECRET, fetch: fakeFetch(404, problem, []) };
  await assert.rejects(apiPost(notFound, '/v1/views', { invitationId: 7 }), (e: unknown) => e instanceof ApiProblem && e.status === 404 && e.code === 'invitation_or_guest.not_found');
  const html = { baseUrl: 'http://api.test', secret: SECRET, fetch: fakeFetch(502, '<html>bad gateway</html>', []) };
  await assert.rejects(apiPost(html, '/v1/views', { invitationId: 7 }), (e: unknown) => e instanceof ApiProblem && e.status === 502 && e.code === 'transport.unexpected_status');
  const down = { baseUrl: 'http://127.0.0.1:9', secret: SECRET, timeoutMs: 2000 };
  await assert.rejects(apiPost(down, '/v1/views', { invitationId: 7 }), (e: unknown) => e instanceof ApiProblem && e.status === 0 && e.code.startsWith('transport.'));
});

test('R-02: the guest page records opens through the writer selection, with no fallback writer', () => {
  const writer = source('lib/invitation/view-writer.ts');
  assert.match(writer, /if \(backendFor\('VIEWS', env\) === 'rust'\) \{[\s\S]*?apiPost\(apiConfigFromEnv\(env\), '\/v1\/views', body\);\s*return recorded;\s*\}\s*return recordInvitationView\(db, invitationId, guestId\);/);
  assert.doesNotMatch(writer, /catch/, 'errors propagate to the best-effort caller instead of reaching the other writer');
  const loader = source('lib/invitation/public.ts');
  assert.match(loader, /await writeInvitationView\(invitationId, guestId\);/);
  assert.doesNotMatch(loader, /recordInvitationView\(/, 'the TypeScript writer is reached only through the selection');
  for (const page of ['app/i/[slug]/page.tsx', 'app/i/[slug]/[guestSlug]/page.tsx']) assert.match(source(page), /after\(\(\) => trackInvitationView\(/, page);
});

test('R-01: the generated client types describe the committed OpenAPI document', () => {
  const doc = JSON.parse(source('services/api/openapi.json')) as { openapi: string; paths: Record<string, unknown> };
  assert.equal(doc.openapi, '3.1.0');
  const schema = source('lib/api/schema.d.ts');
  for (const path of Object.keys(doc.paths)) assert.ok(schema.includes(`"${path}": {`), `${path} in schema.d.ts`);
  assert.match(schema, /RecordView: \{/);
});
