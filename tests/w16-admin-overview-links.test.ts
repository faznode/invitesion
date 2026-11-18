// W1.6 (AM-054): the administrator overview's "Lihat semua" links carry the private entry segment. A dot-relative href
// resolves against `/admin/<entry>` without its trailing slash, so `./customers` led to `/admin/customers`, the private
// 404. Mutation controls: reverting one link or dropping the page's params fails the pin.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const OVERVIEW = 'app/(admin)/admin/[entry]/(console)/page.tsx';
const DOT_RELATIVE_HREF = /href\s*[=:]\s*\{?\s*["'`]\.\.?\//;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : sourceFiles(path);
    return /\.(tsx?|jsx?|mdx)$/.test(name) ? [path] : [];
  });
}

const dotRelativeHrefs = (files: Record<string, string>) =>
  Object.entries(files).flatMap(([path, text]) => text.split('\n').flatMap((line, index) => (DOT_RELATIVE_HREF.test(line) ? [`${path}:${index + 1}`] : [])));

function overviewProblems(text: string): string[] {
  const found: string[] = [];
  const body = text.slice(Math.max(0, text.indexOf('export default')));
  if (!/export default async function DasborPage\(\{ params \}: \{ params: Promise<\{ entry: string \}> \}\)/.test(text)) found.push('the page takes no entry param');
  const order = ['assertAuthorizedAdmin(await getUser());', 'const { entry } = await params;', 'assertPrivateAdminEntry(entry);', 'const base = `/admin/${entry}`;'].map((needle) => body.indexOf(needle));
  if (!order.every((at, index) => at >= 0 && (index === 0 || at > order[index - 1]))) found.push(`the check, the param and the entry check out of order (${order.join(', ')})`);
  for (const target of ['invitations', 'customers']) {
    if (!body.includes(`<Link href={\`\${base}/${target}\`}`)) found.push(`the ${target} link does not carry the entry`);
  }
  return found;
}

test('no dot-relative href remains in app/, components/ or lib/', () => {
  const files = Object.fromEntries(['app', 'components', 'lib'].flatMap(sourceFiles).map((path) => [path, readFileSync(path, 'utf8')]));
  assert.ok(Object.keys(files).length > 100, 'the scan reads the source tree');
  assert.deepEqual(dotRelativeHrefs(files), []);
});

test('the overview checks the administrator first, then builds both links from its checked entry', () => {
  assert.deepEqual(overviewProblems(readFileSync(OVERVIEW, 'utf8')), []);
});

test('mutation controls: a reverted link or a dropped param fails', () => {
  const text = readFileSync(OVERVIEW, 'utf8');
  const reverted = text.replace('<Link href={`${base}/customers`}', '<Link href="./customers"');
  assert.notEqual(reverted, text, 'the mutation target exists');
  assert.deepEqual(overviewProblems(reverted), ['the customers link does not carry the entry']);
  assert.deepEqual(dotRelativeHrefs({ [OVERVIEW]: reverted }).length, 1);
  const noParams = text.replace('DasborPage({ params }: { params: Promise<{ entry: string }> })', 'DasborPage()');
  assert.notEqual(noParams, text, 'the mutation target exists');
  assert.deepEqual(overviewProblems(noParams), ['the page takes no entry param']);
});
