// W1.3 (AM-003, AM-057): every content page of the administrator console authorizes at page level, as the overview does,
// so each page answers like its siblings whatever the layout does. The legacy profile route only redirects to `/general`
// and reads nothing. Mutation controls: removing one page's call fails the pin for that page and no other.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const CONSOLE = 'app/(admin)/admin/[entry]/(console)';
const ASSERT = 'assertAuthorizedAdmin(await getUser())';
const REDIRECT_ONLY = new Set(['profile/page.tsx']);

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pageFiles(path);
    return name === 'page.tsx' ? [path] : [];
  });
}

const consolePages = (): Record<string, string> =>
  Object.fromEntries(pageFiles(CONSOLE).map((path) => [relative(CONSOLE, path), readFileSync(path, 'utf8')]));

/** Each page's problems: a content page checks the administrator before it reads; the profile route stays a redirect. */
function problems(pages: Record<string, string>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(pages).map(([path, text]) => {
      const body = text.slice(Math.max(0, text.indexOf('export default')));
      if (REDIRECT_ONLY.has(path)) {
        const redirectOnly = /redirect\(`\/admin\/\$\{entry\}\/general`\);/.test(body) && !/getUser|db\.|assertAuthorizedAdmin/.test(body);
        return [path, redirectOnly ? [] : ['no longer a redirect-only route: give it the page-level check']];
      }
      const found: string[] = [];
      const check = body.indexOf(ASSERT);
      if (check < 0) found.push(`no page-level ${ASSERT}`);
      const firstRead = body.indexOf('db.');
      if (check >= 0 && firstRead >= 0 && firstRead < check) found.push('reads before the check');
      if (text.includes("redirect('/sign-in')")) found.push('a signed-out-only redirect instead of the check');
      return [path, found];
    }),
  );
}

const failing = (result: Record<string, string[]>) => Object.keys(result).filter((path) => result[path].length > 0).sort();

test('every content page under (console)/ calls assertAuthorizedAdmin on getUser() before it reads', () => {
  const pages = consolePages();
  const content = Object.keys(pages).filter((path) => !REDIRECT_ONLY.has(path));
  assert.ok(content.length >= 10, `content pages found: ${content.join(', ')}`);
  for (const path of ['page.tsx', 'activity/page.tsx', 'general/page.tsx']) assert.ok(content.includes(path), path);
  const result = problems(pages);
  assert.deepEqual(failing(result), [], JSON.stringify(result));
});

test('the helper returns the caller\u2019s user type, so a page keeps the fields it renders', () => {
  const helper = readFileSync('lib/auth/admin-access.ts', 'utf8');
  assert.match(helper, /export function assertAuthorizedAdmin<T extends AuthenticatedUser>\(user: T \| null \| undefined\): T \{/);
  assert.match(readFileSync(join(CONSOLE, 'general/page.tsx'), 'utf8'), /const user=assertAuthorizedAdmin\(await getUser\(\)\);/);
});

test('mutation controls: each removed check fails exactly its own page', () => {
  const pages = consolePages();
  const mutate = (path: string, from: string, to: string) => {
    assert.ok(pages[path].includes(from), `the mutation target exists in ${path}: ${from}`);
    return problems({ ...pages, [path]: pages[path].replace(from, to) });
  };
  assert.deepEqual(failing(mutate('activity/page.tsx', `${ASSERT};`, '')), ['activity/page.tsx']);
  assert.deepEqual(failing(mutate('general/page.tsx', `const user=${ASSERT};`, "const user=await getUser(); if(!user) redirect('/sign-in');")), ['general/page.tsx']);
  assert.deepEqual(failing(mutate('page.tsx', `${ASSERT};`, '')), ['page.tsx']);
  assert.deepEqual(failing(mutate('profile/page.tsx', 'const { entry } = await params;', 'const { entry } = await params; await getUser();')), ['profile/page.tsx']);
});
