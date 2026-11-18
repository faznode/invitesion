// W1.5 (AM-006, OD-12 default): "+ Buat event" / "Build an event" reaches real creation (the theme catalog, where the
// existing BACKEND_CONTENT facade creates the draft, or the wizard when FLAG_CREATION_WIZARD is on). The local-only
// event-blueprint picker is retired: its route redirects to the catalog and no creation draft lives in localStorage.
// The check-in scanner's offline queue (B-024, D-056) is the one deliberate device-local store in the customer area.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const INVITATIONS = 'app/(customer)/dashboard/invitations/page.tsx';
const BLUEPRINT = 'app/(customer)/dashboard/event-blueprint';
const DEVICE_LOCAL_STORES = new Set(['app/(customer)/dashboard/invitations/[id]/checkin/checkin-scanner.tsx']);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|jsx?|mdx?|json)$/.test(name) ? [path] : [];
  });
}

const read = (dirs: string[]) => Object.fromEntries(dirs.flatMap(sourceFiles).map((path) => [path, readFileSync(path, 'utf8')]));

function ctaProblems(text: string): string[] {
  const link = /<Link\s+href="([^"]+)"[\s\S]*?<\/Link>/.exec(text.slice(text.indexOf('<header')))?.[0] ?? '';
  const found: string[] = [];
  if (!link.includes('href="/dashboard/templates"')) found.push('the CTA does not reach the theme catalog');
  if (!link.includes("en ? 'Build an event' : 'Buat event'")) found.push('the CTA lost its labels');
  return found;
}

const localStorageWriters = (files: Record<string, string>) =>
  Object.keys(files).filter((path) => /localStorage\.(setItem|removeItem|clear)\(/.test(files[path]) && !DEVICE_LOCAL_STORES.has(path)).sort();

const blueprintLinks = (files: Record<string, string>) =>
  Object.keys(files).filter((path) => !path.startsWith(BLUEPRINT) && /["'`]\/dashboard\/event-blueprint\b/.test(files[path])).sort();

test('"+ Buat event" / "Build an event" links to the theme catalog', () => {
  assert.deepEqual(ctaProblems(readFileSync(INVITATIONS, 'utf8')), []);
});

test('the event-blueprint route only redirects to the catalog; the picker and its local draft are gone', () => {
  const page = readFileSync(join(BLUEPRINT, 'page.tsx'), 'utf8');
  assert.match(page, /export default function EventBlueprintPage\(\) \{\n  redirect\('\/dashboard\/templates'\);\n\}/);
  assert.doesNotMatch(page, /['"]use client['"]|from '\.\/picker'|localStorage\.|getUser\(|<[A-Z]/);
  assert.equal(existsSync(join(BLUEPRINT, 'picker.tsx')), false);
  assert.deepEqual(readdirSync(BLUEPRINT), ['page.tsx']);
});

test('no creation draft in localStorage and no link to the retired route anywhere in the app', () => {
  const customer = read(['app/(customer)']);
  assert.ok(Object.keys(customer).length > 20, 'the scan reads the customer area');
  assert.deepEqual(localStorageWriters(customer), []);
  for (const path of DEVICE_LOCAL_STORES) assert.ok(customer[path]?.includes('localStorage.setItem('), `${path} still holds its offline queue`);
  assert.deepEqual(blueprintLinks(read(['app', 'components', 'lib', 'content'])), []);
});

test('mutation controls: the old href, a new local draft and a link back to the picker each fail', () => {
  const page = readFileSync(INVITATIONS, 'utf8');
  assert.deepEqual(ctaProblems(page.replace('href="/dashboard/templates"', 'href="/dashboard/event-blueprint"')), ['the CTA does not reach the theme catalog']);
  const draft = { 'app/(customer)/dashboard/templates/x.tsx': "localStorage.setItem('draft', '{}');" };
  assert.deepEqual(localStorageWriters(draft), ['app/(customer)/dashboard/templates/x.tsx']);
  assert.deepEqual(blueprintLinks({ [INVITATIONS]: page.replace('href="/dashboard/templates"', 'href="/dashboard/event-blueprint"') }), [INVITATIONS]);
});
