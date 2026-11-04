import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { RENDER_CAPABILITIES } from '../lib/invitation/content-contract';
import { normalizeStoredConfig } from '../lib/invitation/content-read';
import { detailConfigSchema } from '../lib/invitation/detail-config';
import { eventDateParts } from '../lib/invitation/event-time';
import { FAMILIES, FAMILY_IDS, familyOf } from '../lib/invitation/families';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const familyFiles = readdirSync(join(process.cwd(), 'components/invitation/families')).sort();

test('B-030: three registered families, one designed for non-wedding events, each with its own layout file', () => {
  assert.deepEqual([...FAMILY_IDS], ['gapura', 'kartu', 'riang']);
  assert.ok(Object.values(FAMILIES).some((family) => family.intendedFor === 'celebration'));
  assert.deepEqual(familyFiles, FAMILY_IDS.map((id) => `${id}.tsx`).sort());
  const renderer = source('components/invitation/public-renderer.tsx');
  for (const id of FAMILY_IDS) assert.match(renderer, new RegExp(`\\b${id}: [A-Z][a-z]+Layout\\b`), id);
});

test('B-030: a missing or unknown family keeps the legacy layout', () => {
  assert.equal(familyOf(undefined), null);
  assert.equal(familyOf(''), null);
  assert.equal(familyOf('retired-family'), null);
  assert.equal(familyOf('gapura')?.name, 'Gapura');
  assert.match(source('components/invitation/public-renderer.tsx'), /family \? FAMILY_LAYOUTS\[family\.id\] : LegacyLayout/);
});

test('B-030: only known families are stored, and a retired id never drops the rest of the theme', () => {
  assert.equal(detailConfigSchema.parse({ theme: { paletteId: 'sage', familyId: 'kartu' } }).theme?.familyId, 'kartu');
  assert.equal(detailConfigSchema.parse({ theme: { paletteId: 'sage', familyId: 'not-a-family' } }).theme?.familyId, undefined);
  const stored = normalizeStoredConfig({ theme: { paletteId: 'midnight', familyId: 'retired', cover: { headline: 'Walimah' } } });
  assert.deepEqual(stored.dropped, []);
  assert.equal(stored.config.theme?.paletteId, 'midnight');
  assert.equal(stored.config.theme?.cover?.headline, 'Walimah');
  assert.equal(stored.config.theme?.familyId, undefined);
  assert.ok((RENDER_CAPABILITIES.theme.rendered as readonly string[]).includes('familyId'));
});

test('B-030: every family composes every guest-facing section of the legacy page', () => {
  const sections: [string, RegExp][] = [
    ['names (couple, honouree or event)', /\bnames\b/],
    ['settings.title fallback', /settings\?\.title/],
    ['settings.openingCopy', /settings\?\.openingCopy/],
    ['theme.cover.imageUrl', /cover\?\.imageUrl/],
    ['theme.cover.headline', /cover\?\.headline/],
    ['greetings.prayer', /greetings\?\.prayer/],
    ['quote.text', /quote\.text/],
    ['quote.author', /quote\.author/],
    ['events', /<EventFacts\b/],
    ['events.note', /event\.note/],
    ['events.mapUrl', /<MapLink\b/],
    ['countdown', /<Countdown\b/],
    ['calendar links', /<CalendarLinks\b/],
    ['story items', /story\.items/],
    ['gallery', /gallery\.map/],
    ['streaming.url', /streaming\.url/],
    ['gift accounts', /account\.number/],
    ['rsvp', /<RsvpBlock\b/],
    ['guestbook', /<GuestbookBlock\b/],
    ['guestbook.heading', /guestbook\?\.heading/],
    ['guestbook.prompt', /guestbook\?\.prompt/],
    ['read-only notice', /<ReadOnlyNotice\b/],
    ['guest name', /guest\.name/],
  ];
  for (const file of familyFiles) {
    const text = source(`components/invitation/families/${file}`);
    assert.deepEqual(sections.filter(([, pattern]) => !pattern.test(text)).map(([label]) => label), [], file);
  }
});

test('B-030: names typed by hosts are isolated for bidirectional text and wrap instead of overflowing', () => {
  for (const file of familyFiles) {
    const text = source(`components/invitation/families/${file}`);
    assert.match(text, /dir="auto"|<bdi/, `${file}: names need dir="auto" or <bdi>`);
    assert.match(text, /\[overflow-wrap:anywhere\]/, `${file}: long names must wrap`);
  }
});

test('B-030: declared motion level matches the markup, and reduced motion switches the entrance off', () => {
  assert.match(source('app/globals.css'), /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.inv-rise\s*\{\s*animation: none;/);
  for (const id of FAMILY_IDS) {
    assert.equal(source(`components/invitation/families/${id}.tsx`).includes('inv-rise'), FAMILIES[id].motionLevel > 0, id);
  }
});

test('B-030: date tiles use the event zone, not the server zone', () => {
  assert.deepEqual(eventDateParts('2026-12-27T19:00:00+08:00'), { weekday: 'Minggu', day: '27', month: 'Desember', monthShort: 'Des', year: '2026' });
  assert.equal(eventDateParts('2026-12-31T23:30:00+07:00')?.day, '31', '23:30 WIB on the 31st stays the 31st');
  assert.equal(eventDateParts('not a date'), null);
});
