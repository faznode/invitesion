// E-099 (s53): three pre-existing dashboard accessibility defects, reproduced on four served runs of F2's build.
// 1. The signed-in shells' phone drawer is `aria-modal`, yet opening it left focus on "Buka menu" and Tab reached
//    "Profil & akun" behind it. Opening must move focus inside, the page behind it must be inert, and a user's close
//    must hand focus back to the menu button.
// 2. `text-brand-600` is 4.41:1 on the dashboard's slate-50 page, below 4.5:1 for small text (axe `color-contrast`);
//    small brand text uses `text-brand-700` (6.1:1), as R-X9 did on the guest-photo review page.
// 3. The editor's two screens had no `h1` (axe `page-has-heading-one`); each screen's title is the page's `h1`.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const SHELLS = ['app/(customer)/dashboard/customer-shell.tsx', 'app/(admin)/admin/[entry]/(console)/admin-shell.tsx'];

test('the drawer hook moves focus in on open, hands it back after a user close and closes at the desktop breakpoint', () => {
  const hook = read('components/dashboard/use-modal-drawer.ts');
  assert.match(hook, /initialFocusRef\.current\?\.focus\(\)/, 'focus moves into the open drawer');
  assert.match(hook, /triggerRef\.current\?\.focus\(\)/, 'focus returns to the menu button');
  assert.match(hook, /event\.key !== 'Escape'\) return;\s*returnFocus\.current = true;\s*setOpen\(false\);/, 'Escape is a user close');
  assert.match(hook, /const close = \(\) => \{\s*returnFocus\.current = true;\s*setOpen\(false\);/, 'the close controls are user closes');
  assert.match(hook, /const DESKTOP_QUERY = '\(min-width: 1024px\)'/);
  assert.match(hook, /matchMedia\(DESKTOP_QUERY\)/, 'widening to the desktop layout closes the drawer');
});

for (const shell of SHELLS) {
  test(`${shell} runs its phone drawer through useModalDrawer`, () => {
    const source = read(shell);
    assert.match(source, /const drawer = useModalDrawer\(open, setOpen\)/);
    assert.match(source, /ref=\{drawer\.triggerRef\}\s+type="button"\s+onClick=\{\(\) => setOpen\(true\)\}/, 'the menu button');
    assert.match(source, /ref=\{drawer\.initialFocusRef\}/, 'the close button inside the dialog');
    for (const element of ['header', 'aside', 'main']) {
      assert.match(source, new RegExp(`<${element} inert=\\{open\\}`), `the ${element} is inert while the drawer is open`);
    }
    assert.doesNotMatch(source, /onClick=\{\(\) => setOpen\(false\)\}/, 'no close control bypasses the hook');
    assert.equal((source.match(/onClick=\{drawer\.close\}/g) ?? []).length, 2, 'the close button and the backdrop');
    assert.doesNotMatch(source, /addEventListener\('keydown'/, 'the hook owns Escape');
  });
}

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsxFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

test('small brand text in the customer dashboard uses brand-700, never brand-600', () => {
  const offenders = tsxFiles(join(process.cwd(), 'app/(customer)/dashboard')).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/className=(["`])([\s\S]*?)\1/g)]
      .map((match) => match[2].split(/\s+/))
      .filter((tokens) => tokens.includes('text-xs') && tokens.includes('text-brand-600'))
      .map((tokens) => `${file}: ${tokens.join(' ')}`),
  );
  assert.deepEqual(offenders, []);
});

test("each editor screen's title is its one h1", () => {
  const editor = read('app/(customer)/dashboard/invitations/[id]/edit/editor.tsx');
  assert.equal((editor.match(/<h1\b/g) ?? []).length, 2, 'the first screen and the section screen, never both at once');
  assert.match(editor, /<h1 className="text-2xl font-bold text-slate-900">Mulai edit undangan<\/h1>/);
  assert.match(editor, /<h1 className="text-2xl font-bold leading-tight text-slate-900">\{title\}<\/h1>/);
});
