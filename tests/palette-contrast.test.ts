import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { blend, contrastRatio, relativeLuminance, WCAG_AA, worstContrastOverImage } from '../lib/invitation/contrast';
import type { DetailConfig } from '../lib/invitation/detail-config';
import { formatEventDate } from '../lib/invitation/event-time';
import { palette, paletteHex, paletteIds, type PaletteTokens } from '../lib/invitation/palettes';
import { renderGuestPage, withFamily } from './support/render-guest-page';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

type TextToken = 'ink' | 'accent' | 'muted';
type Surface = 'bg' | 'card' | 'soft' | 'field';

/** Every text token and every surface the guest page draws it on (components/invitation/public-renderer.tsx). */
const DRAWN_ON: Record<TextToken, Surface[]> = {
  ink: ['bg', 'card', 'soft', 'field'],
  accent: ['bg', 'card', 'soft'],
  muted: ['bg', 'card', 'soft', 'field'],
};

test('contrast helper matches the WCAG reference values', () => {
  assert.equal(contrastRatio('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  assert.equal(contrastRatio('#767676', '#ffffff').toFixed(2), '4.54');
  assert.throws(() => relativeLuminance('#0000001f'), /opaque/);
});

test('B-016: every text token meets AA (4.5:1) on every surface it is drawn on, for every palette', () => {
  const failures: string[] = [];
  for (const id of paletteIds) {
    const tokens = paletteHex(id);
    for (const [text, surfaces] of Object.entries(DRAWN_ON) as [TextToken, Surface[]][]) {
      for (const surface of surfaces) {
        const ratio = contrastRatio(tokens[text], tokens[surface]);
        if (ratio < WCAG_AA.text) failures.push(`${id}: ${text} on ${surface} = ${ratio.toFixed(2)}:1`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('B-016: surfaces are opaque, schemes match luminance, muted stays distinct from ink', () => {
  for (const id of paletteIds) {
    const tokens: PaletteTokens = paletteHex(id);
    for (const surface of ['bg', 'card', 'soft', 'field'] as const) assert.match(tokens[surface], /^#[0-9a-f]{6}$/i, `${id}.${surface}`);
    const isDark = relativeLuminance(tokens.bg) < relativeLuminance(tokens.ink);
    assert.equal(tokens.scheme, isDark ? 'dark' : 'light', id);
    assert.notEqual(tokens.muted, tokens.ink, id);
    assert.ok(contrastRatio(tokens.ink, tokens.bg) > contrastRatio(tokens.muted, tokens.bg), `${id}: muted must read lighter than ink`);
  }
});

test('B-016: the page root receives every token as a CSS variable, unknown IDs fall back to ivory', () => {
  for (const id of paletteIds) {
    const style = palette(id).style as Record<string, string>;
    const tokens = paletteHex(id);
    for (const key of ['bg', 'ink', 'accent', 'muted', 'soft', 'card', 'field', 'line'] as const) {
      assert.equal(style[`--inv-${key}`], tokens[key], `${id} --inv-${key}`);
    }
    assert.equal(style.colorScheme, tokens.scheme);
  }
  assert.deepEqual(palette('unknown').style, palette('ivory').style);
});

test('B-016: fixed status and action colours in the renderer meet AA (Tailwind v4 defaults)', () => {
  const pairs: [string, string, string][] = [
    ['white on emerald-700 (RSVP confirm)', '#ffffff', '#007a55'],
    ['emerald-700 on emerald-50 (saved)', '#007a55', '#ecfdf5'],
    ['red-700 on red-50 (invalid)', '#c10007', '#fef2f2'],
    ['amber-800 on amber-50 (read-only banner)', '#973c00', '#fffbeb'],
  ];
  for (const [label, text, surface] of pairs) assert.ok(contrastRatio(text, surface) >= WCAG_AA.text, label);
});

const TAILWIND_COLOUR =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to|decoration|outline)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/g;
const LAYOUTS = [
  'components/invitation/public-renderer.tsx',
  ...readdirSync(join(process.cwd(), 'components/invitation/families')).map((file) => `components/invitation/families/${file}`),
];

test('B-016: every guest-page layout draws colour only through palette tokens', () => {
  for (const file of LAYOUTS) {
    const text = source(file);
    assert.deepEqual(text.match(TAILWIND_COLOUR) ?? [], [], `${file}: a fixed colour assumes one palette`);
    assert.match(text, /style=\{tone\.style\}/, `${file}: the page root must receive the palette variables`);
    for (const line of text.split('\n').filter((candidate) => /\bopacity-\d+/.test(candidate))) {
      assert.match(line, /<img /, `${file}: opacity may fade a cover image, never text: ${line.trim()}`);
    }
  }
  assert.doesNotMatch(source('components/invitation/countdown.tsx'), /\bopacity-\d+/);
});

test('worst-case contrast over any image: blend and bound match hand-computed values', () => {
  assert.equal(blend('#000000', '#ffffff', 0.25), '#bfbfbf');
  assert.equal(blend('#ffffff', '#000000', 0.2), '#333333');
  assert.equal(worstContrastOverImage('#000000', '#ffffff', 0.25), contrastRatio('#000000', '#bfbfbf'), 'a black image region is the worst case for dark text');
  assert.equal(worstContrastOverImage('#ffffff', '#000000', 0.2), contrastRatio('#ffffff', '#333333'), 'a white image region is the worst case for light text');
  assert.equal(worstContrastOverImage('#808080', '#ffffff', 0.9), 1, 'text luminance inside the reachable span can vanish');
});

/** Layouts that lay the cover photo behind cover text; the opacity is read from the class each one draws. */
const PHOTO_BEHIND_TEXT = { legacy: 'components/invitation/public-renderer.tsx', gapura: 'components/invitation/families/gapura.tsx' } as const;

test('B-016: cover text over a photo keeps AA whatever the photo shows: names in ink, small accent text on a page-colour chip', () => {
  for (const [label, file] of Object.entries(PHOTO_BEHIND_TEXT)) {
    const opacity = Number(/<img [^>]*\bopacity-(\d+)/.exec(source(file))?.[1]) / 100;
    assert.ok(opacity > 0 && opacity < 1, `${label}: cover image opacity`);
    for (const id of paletteIds) {
      const tokens = paletteHex(id);
      assert.ok(worstContrastOverImage(tokens.ink, tokens.bg, opacity) >= WCAG_AA.text, `${label} ${id}: names straight over the photo`);
    }
    // Why the chip exists: accent text straight over a dark photo region falls below AA (s15: 2.83:1 at worst).
    assert.ok(paletteIds.some((id) => worstContrastOverImage(paletteHex(id).accent, paletteHex(id).bg, opacity) < WCAG_AA.text), label);
  }
  const startAt = '2099-12-27T19:00:00+08:00';
  const cover = { headline: 'Pernikahan', imageUrl: 'https://example.test/cover.jpg' };
  const config: DetailConfig = { couple: { bride: { nickName: 'Sari' }, groom: { nickName: 'Budi' } }, theme: { cover }, events: [{ title: 'Resepsi', startAt }] };
  const classOf = (page: string, text: string) => new RegExp(`<p class="([^"]*)">${text}</p>`).exec(page)?.[1];
  for (const familyId of [undefined, 'gapura'] as const) {
    const label = familyId ?? 'legacy';
    const page = renderGuestPage({ config: withFamily(config, familyId) });
    for (const text of [cover.headline, formatEventDate(startAt) ?? '']) {
      assert.match(classOf(page, text) ?? '', /\bbg-\(--inv-bg\)/, `${label}: "${text}" sits on the page colour`);
      // s15 review F6: an inline-block chip let the legacy guest card flow onto the date's line.
      assert.match(classOf(page, text) ?? '', /(?:^|\s)block(?:\s|$)/, `${label}: "${text}" chip keeps its own line`);
      assert.doesNotMatch(classOf(page, text) ?? '', /\binline-block\b/, `${label}: "${text}" chip is not inline`);
    }
    const plain = renderGuestPage({ config: withFamily({ ...config, theme: { cover: { headline: cover.headline } } }, familyId) });
    assert.doesNotMatch(classOf(plain, cover.headline) ?? 'missing', /bg-\(--inv-bg\)|missing/, `${label}: without a photo the markup is unchanged`);
  }
});

test('B-016: fixed colours live only in the shared blocks, as self-contained status and action pairs', () => {
  const blocks = source('components/invitation/guest-blocks.tsx');
  assert.doesNotMatch(blocks, /bg-white\/\d+|(?:bg|border|text)-black|bg-emerald-600/, 'white on emerald-600 is 3.65:1');
  assert.deepEqual([...new Set(blocks.match(TAILWIND_COLOUR))].sort(), [
    'bg-amber', 'bg-emerald', 'bg-red', 'border-amber', 'border-emerald', 'border-red', 'text-amber', 'text-emerald', 'text-red', 'text-white',
  ]);
});
