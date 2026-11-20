// W2.1 (AM-010): error boundaries and loading states for the customer dashboard. The dashboard boundary renders inside
// the shell (which owns the one `main`), in Indonesian or English from the document language, with an h1 and a retry
// that re-fetches the segment (Next.js 16.3+ `retry`; `reset` only clears the error state). The root boundary renders
// its own small document. The invitation pages get a loading state only below a layout that decides access first:
// once a Suspense fallback streams, Next.js commits to 200, so the sign-in redirect and another account's private 404
// must be decided above it, and no loading state may exist above that layout.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const DASHBOARD_ERROR = 'app/(customer)/dashboard/error.tsx';
const GLOBAL_ERROR = 'app/global-error.tsx';
const GATE = 'app/(customer)/dashboard/invitations/[id]/layout.tsx';
const LOADING = 'app/(customer)/dashboard/invitations/[id]/loading.tsx';
const ABOVE_GATE = ['app/loading.tsx', 'app/(customer)/loading.tsx', 'app/(customer)/dashboard/loading.tsx', 'app/(customer)/dashboard/invitations/loading.tsx'];
const GLOBAL_ERROR_MAX_BYTES = 1600;

const read = (path: string) => readFileSync(path, 'utf8');

function dashboardErrorProblems(text: string): string[] {
  const found: string[] = [];
  if (!text.startsWith("'use client';")) found.push('not a client component');
  if (!text.includes("title: 'Halaman ini gagal dimuat'")) found.push('no Indonesian copy');
  if (!text.includes("title: 'This page failed to load'")) found.push('no English copy');
  if (!text.includes('useSyncExternalStore(subscribe, documentLanguage, serverLanguage)') || !text.includes("const serverLanguage = (): Language => 'id';")) {
    found.push('the language does not follow the document');
  }
  if (!text.includes('onClick={() => retry()}')) found.push('retry is not wired');
  if (!/<h1[\s>]/.test(text)) found.push('no h1');
  if (/<main[\s>]/.test(text)) found.push('a second main');
  return found;
}

function globalErrorProblems(text: string): string[] {
  const found: string[] = [];
  if (!text.startsWith("'use client';")) found.push('not a client component');
  if (!text.includes('<html lang="id"') || !/<body[\s>]/.test(text)) found.push('no own document');
  if (!text.includes('>Terjadi kendala</h1>')) found.push('no Indonesian copy');
  if (!text.includes('<p lang="en"')) found.push('no English copy');
  if (!text.includes('onClick={() => retry()}')) found.push('retry is not wired');
  if (/^import /m.test(text)) found.push('imports add bytes to every page');
  if (Buffer.byteLength(text) > GLOBAL_ERROR_MAX_BYTES) found.push('over the byte cap');
  return found;
}

function loadingProblems(text: string): string[] {
  const found: string[] = [];
  if (/<main[\s>]/.test(text)) found.push('a second main');
  if (!text.includes('role="status"')) found.push('no status role');
  if (/['"]use client['"]/.test(text)) found.push('client code in a loading state');
  return found;
}

function gateProblems(text: string): string[] {
  const code = text.replace(/\/\*\*[\s\S]*?\*\//, '');
  const found: string[] = [];
  if (!code.includes("if (!user) redirect('/sign-in');")) found.push('no sign-in redirect before the stream');
  if (!code.includes("if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');")) found.push('administrators are not refused before the stream');
  if (!code.includes('!(await invitationAccess(user.id, id))) notFound();')) found.push('another account is not refused before the stream');
  if (!/return children;\n\}/.test(code)) found.push('the pages are not rendered');
  if (/Suspense|loading/i.test(code)) found.push('a boundary above the decision');
  return found;
}

const streamsAboveGate = (exists: (path: string) => boolean) => ABOVE_GATE.filter(exists);

test('the dashboard boundary: client, bilingual from the document language, an h1, retry, inside the shell', () => {
  assert.ok(existsSync(DASHBOARD_ERROR), DASHBOARD_ERROR);
  assert.deepEqual(dashboardErrorProblems(read(DASHBOARD_ERROR)), []);
});

test('the root boundary renders its own small document with both languages and retry', () => {
  assert.ok(existsSync(GLOBAL_ERROR), GLOBAL_ERROR);
  assert.deepEqual(globalErrorProblems(read(GLOBAL_ERROR)), []);
});

test('the invitation pages load below a layout that decides access first; nothing streams above it', () => {
  assert.deepEqual(gateProblems(read(GATE)), []);
  assert.deepEqual(loadingProblems(read(LOADING)), []);
  assert.deepEqual(streamsAboveGate(existsSync), []);
});

test('mutation controls: each pin fails on exactly its own defect', () => {
  const boundary = read(DASHBOARD_ERROR);
  assert.deepEqual(dashboardErrorProblems(boundary.replace("'use client';", '')), ['not a client component']);
  assert.deepEqual(dashboardErrorProblems(boundary.replace("title: 'This page failed to load'", "title: 'Halaman ini gagal dimuat'")), ['no English copy']);
  assert.deepEqual(dashboardErrorProblems(boundary.replace("title: 'Halaman ini gagal dimuat'", "title: 'This page failed to load'")), ['no Indonesian copy']);
  assert.deepEqual(dashboardErrorProblems(boundary.replace("(): Language => 'id';", "(): Language => 'en';")), ['the language does not follow the document']);
  assert.deepEqual(dashboardErrorProblems(boundary.replace('onClick={() => retry()}', 'onClick={() => undefined}')), ['retry is not wired']);
  assert.deepEqual(dashboardErrorProblems(boundary.replace('<h1 ', '<h2 ').replace('</h1>', '</h2>')), ['no h1']);
  assert.deepEqual(dashboardErrorProblems(boundary.replace('<section ', '<main><section ')), ['a second main']);

  const root = read(GLOBAL_ERROR);
  assert.deepEqual(globalErrorProblems(root.replace('<html lang="id"', '<div lang="id"')), ['no own document']);
  assert.deepEqual(globalErrorProblems(root.replace('<p lang="en"', '<p')), ['no English copy']);
  assert.deepEqual(globalErrorProblems(root.replace('onClick={() => retry()}', 'onClick={() => undefined}')), ['retry is not wired']);
  assert.deepEqual(globalErrorProblems(root.replace("'use client';\n", "'use client';\nimport x from 'x';\n")), ['imports add bytes to every page']);
  assert.deepEqual(globalErrorProblems(root + ' '.repeat(GLOBAL_ERROR_MAX_BYTES)), ['over the byte cap']);

  const loading = read(LOADING);
  assert.deepEqual(loadingProblems(loading.replace('<div role="status"', '<main role="status"')), ['a second main']);
  assert.deepEqual(loadingProblems(loading.replace('role="status"', 'role="region"')), ['no status role']);

  const gate = read(GATE);
  assert.deepEqual(gateProblems(gate.replace("if (!user) redirect('/sign-in');", 'if (!user) return children;')), ['no sign-in redirect before the stream']);
  assert.deepEqual(gateProblems(gate.replace("if (user.role === 'ADMIN') redirect(getPrivateAdminPath() ?? '/sign-in');", '')), ['administrators are not refused before the stream']);
  assert.deepEqual(gateProblems(gate.replace('id))) notFound();', 'id))) return null;')), ['another account is not refused before the stream']);
  assert.deepEqual(gateProblems(`${gate}\nimport { Suspense } from 'react';\n`), ['a boundary above the decision']);
  assert.deepEqual(streamsAboveGate((path) => path.endsWith('invitations/loading.tsx')), ['app/(customer)/dashboard/invitations/loading.tsx']);
});
