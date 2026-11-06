// B-041 (s26, E-054; D-042): server-side theme entitlement on config writes. Pure rules here; the database-backed proof
// that a published Standard invitation cannot take a Premium theme without an order is scripts/verify-theme-entitlement.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { palette, paletteIds } from '../lib/invitation/palettes';
import { invitationTemplates } from '../lib/invitation/templates';
import {
  changedThemeFields,
  FALLBACK_PALETTE_ID,
  needsTierLookup,
  paletteTier,
  storedThemeFields,
  ThemeEntitlementError,
  themeChangeIssues,
} from '../lib/invitation/theme-entitlement';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const freeTheme = invitationTemplates.find((template) => template.tier === 'free')!;
const premiumTheme = invitationTemplates.find((template) => template.tier === 'premium')!;
const standard = { tier: 'standard' as const, templateId: freeTheme.id };
const premium = { tier: 'premium' as const, templateId: premiumTheme.id };

test('a palette is Standard when a free catalog theme uses it or it is the fallback, otherwise Premium', () => {
  const freePalettes = new Set(invitationTemplates.filter((template) => template.tier === 'free').map((template) => template.paletteId));
  for (const id of paletteIds) {
    assert.equal(paletteTier(id), freePalettes.has(id) || id === FALLBACK_PALETTE_ID ? 'standard' : 'premium', id);
  }
  // Today's catalog; a catalog change that moves a palette across tiers must update D-042 deliberately.
  assert.deepEqual(paletteIds.filter((id) => paletteTier(id) === 'premium').sort(), ['blossom', 'gold-noir', 'midnight', 'orchid']);
});

test('the fallback palette is what a page without a palette renders, so it can never be Premium-only', () => {
  assert.deepEqual(palette(undefined).style, palette(FALLBACK_PALETTE_ID).style);
  assert.deepEqual(palette('not-a-palette').style, palette(FALLBACK_PALETTE_ID).style);
  assert.equal(paletteTier(FALLBACK_PALETTE_ID), 'standard');
});

test('ids the palette registry does not know have no tier', () => {
  assert.equal(paletteTier('neon'), null);
  assert.equal(paletteTier(''), null);
});

test('a Standard invitation cannot change to a Premium palette', () => {
  const changed = changedThemeFields({ templateId: freeTheme.id, paletteId: freeTheme.paletteId }, { templateId: freeTheme.id, paletteId: 'midnight' });
  assert.deepEqual(changed, { paletteId: 'midnight' });
  assert.equal(needsTierLookup(changed), true);
  assert.deepEqual(themeChangeIssues(changed, standard), [{ path: 'theme.paletteId', reason: 'premium-palette' }]);
});

test('a Premium entitlement may take any registered palette', () => {
  for (const id of paletteIds) assert.deepEqual(themeChangeIssues({ paletteId: id }, premium), [], id);
});

test('Standard palettes pass without a tier lookup', () => {
  for (const id of paletteIds.filter((paletteId) => paletteTier(paletteId) === 'standard')) {
    assert.equal(needsTierLookup({ paletteId: id }), false, id);
    assert.deepEqual(themeChangeIssues({ paletteId: id }, standard), [], id);
  }
});

test('unchanged fields pass even when today they would not be allowed, so legacy rows keep saving', () => {
  const stored = { templateId: 999, paletteId: 'midnight' };
  assert.deepEqual(changedThemeFields(stored, { ...stored }), {});
  assert.deepEqual(themeChangeIssues(changedThemeFields(stored, { ...stored }), standard), []);
});

test('clearing the palette or the theme id needs no entitlement', () => {
  assert.deepEqual(changedThemeFields({ templateId: freeTheme.id, paletteId: 'sage' }, {}), {});
  assert.deepEqual(changedThemeFields({ templateId: freeTheme.id, paletteId: 'sage' }, undefined), {});
});

test("templateId may only name the invitation's own catalog theme", () => {
  assert.deepEqual(themeChangeIssues({ templateId: premiumTheme.id }, standard), [{ path: 'theme.templateId', reason: 'theme-switch' }]);
  assert.deepEqual(themeChangeIssues({ templateId: freeTheme.id }, standard), []);
  assert.deepEqual(themeChangeIssues({ templateId: freeTheme.id }, { tier: 'standard', templateId: null }), [
    { path: 'theme.templateId', reason: 'theme-switch' },
  ]);
  // A Premium entitlement buys palettes, not a different catalog theme (switching is B-036).
  assert.deepEqual(themeChangeIssues({ templateId: freeTheme.id }, premium), [{ path: 'theme.templateId', reason: 'theme-switch' }]);
});

test('unknown palettes are refused for every tier', () => {
  for (const entitlement of [standard, premium]) {
    assert.deepEqual(themeChangeIssues({ paletteId: 'neon' }, entitlement), [{ path: 'theme.paletteId', reason: 'unknown-palette' }]);
  }
});

test('stored theme fields are read leniently', () => {
  assert.deepEqual(storedThemeFields(null), {});
  assert.deepEqual(storedThemeFields({ theme: 'ivory' }), {});
  assert.deepEqual(storedThemeFields({ theme: { templateId: '7', paletteId: 3 } }), { templateId: undefined, paletteId: undefined });
  assert.deepEqual(storedThemeFields({ theme: { templateId: 7, paletteId: 'sage', familyId: 'gapura' } }), { templateId: 7, paletteId: 'sage' });
});

test('the error names paths and reasons, never stored values', () => {
  const error = new ThemeEntitlementError([{ path: 'theme.paletteId', reason: 'premium-palette' }]);
  assert.equal(error.name, 'ThemeEntitlementError');
  assert.match(error.message, /theme\.paletteId \(premium-palette\)/);
});

test('the config writer checks the theme before its transaction, and the PATCH answers 403', () => {
  const service = source('lib/invitation/service.ts');
  const writer = service.slice(service.indexOf('export async function updateDetailConfig'), service.indexOf('async function themeTier'));
  assert.ok(writer.indexOf('themeChangeIssues(') > 0 && writer.indexOf('themeChangeIssues(') < writer.indexOf('db.transaction('));
  const route = source('app/api/invitations/[id]/detail/route.ts');
  assert.match(route, /ThemeEntitlementError\) return apiError\(403, 'THEME_NOT_ENTITLED'/);
});
