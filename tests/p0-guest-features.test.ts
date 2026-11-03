// Regression tests for the masterplan's sprint-2 P0 guest-page items (invitation-research/09-masterplan/06-backlog.md, B-008 …).
process.env.TZ = 'UTC';

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { isFlagOn } from '../lib/flags';
import {
  buildIcs,
  calendarEventsFromConfig,
  countdownParts,
  escapeIcsText,
  foldIcsLine,
  googleCalendarUrl,
  icsDateTimeUtc,
} from '../lib/invitation/calendar';
import { GUEST_LINK_TOKEN_PATTERN, guestLinkSegment, newGuestLinkToken, pickGuestForSegment } from '../lib/invitation/guest-link';
import { invitationDisplayName, invitationHeadline } from '../lib/invitation/headline';
import { palette, paletteHex, paletteIds } from '../lib/invitation/palettes';
import { invitationShareMetadata, previewImageModel, previewImageVersion } from '../lib/invitation/preview-image';
import { invitationCalendarPath, invitationPreviewImagePath } from '../lib/invitation/public-path';
import { slugify } from '../lib/invitation/slug';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const unfold = (ics: string) => ics.replace(/\r\n /g, '');

// ── Flags ─────────────────────────────────────────────────────────────────────

test('flags: defaults hold and FLAG_<NAME> overrides them', () => {
  assert.equal(isFlagOn('GUEST_CALENDAR', {}), true);
  assert.equal(isFlagOn('OPAQUE_GUEST_LINKS', {}), false);
  assert.equal(isFlagOn('GUEST_CALENDAR', { FLAG_GUEST_CALENDAR: 'off' }), false);
  assert.equal(isFlagOn('GUEST_CALENDAR', { FLAG_GUEST_CALENDAR: ' 0 ' }), false);
  assert.equal(isFlagOn('OPAQUE_GUEST_LINKS', { FLAG_OPAQUE_GUEST_LINKS: 'ON' }), true);
  assert.equal(isFlagOn('OPAQUE_GUEST_LINKS', { FLAG_OPAQUE_GUEST_LINKS: 'maybe' }), false);
});

// ── B-008: add-to-calendar and countdown ──────────────────────────────────────

const fixtureEvents = [
  { title: 'Akad Nikah', startAt: '2026-12-20T08:00:00+07:00', endAt: '2026-12-20T09:30:00+07:00', venueName: 'Masjid Raya', address: 'Jl. Merdeka 1, Bandung' },
  { title: 'Resepsi', startAt: '2026-12-27T19:00:00+08:00', venueName: 'Gedung Makassar' },
  { title: 'Tanpa waktu' },
];

test('B-008: DTSTART is the UTC instant of the event-local time (WIB and WITA)', () => {
  assert.equal(icsDateTimeUtc(new Date('2026-12-20T08:00:00+07:00')), '20261220T010000Z');
  assert.equal(icsDateTimeUtc(new Date('2026-12-27T19:00:00+08:00')), '20261227T110000Z');
});

test('B-008: the calendar file has the RFC 5545 frame, one VEVENT per timed event, CRLF line ends', () => {
  const events = calendarEventsFromConfig({ slug: 'budi-sari', displayName: 'Sari & Budi', events: fixtureEvents, publicUrl: 'https://example.test/i/budi-sari' });
  assert.equal(events.length, 2, 'the event without a start is skipped');
  const ics = buildIcs(events, new Date('2026-11-03T12:00:00Z'));
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal(ics.replace(/\r\n/g, '').includes('\n'), false, 'no bare LF');
  const text = unfold(ics);
  assert.equal(text.match(/BEGIN:VEVENT/g)?.length, 2);
  assert.match(text, /UID:budi-sari\.0@invitesion\r\nDTSTAMP:20261103T120000Z\r\nDTSTART:20261220T010000Z\r\nDTEND:20261220T023000Z\r\n/);
  assert.match(text, /DTSTART:20261227T110000Z\r\nSUMMARY:Resepsi · Sari & Budi\r\n/, 'no DTEND without an end time');
  assert.match(text, /SUMMARY:Akad Nikah · Sari & Budi/);
  assert.match(text, /LOCATION:Masjid Raya\\, Jl. Merdeka 1\\, Bandung/);
  assert.match(text, /URL:https:\/\/example.test\/i\/budi-sari/);
});

test('B-008: a non-increasing end is dropped instead of producing an invalid range', () => {
  const [event] = calendarEventsFromConfig({ slug: 's', displayName: 'X', events: [{ title: 'A', startAt: '2026-12-20T08:00:00+07:00', endAt: '2026-12-20T07:00:00+07:00' }] });
  assert.equal(buildIcs([event]).includes('DTEND'), false);
  assert.match(googleCalendarUrl(event), /dates=20261220T010000Z%2F20261220T010000Z/);
});

test('B-008: TEXT escaping and 75-octet folding never split a character', () => {
  assert.equal(escapeIcsText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const long = `SUMMARY:${'Resepsi 🎉 حفل الزفاف '.repeat(8)}`;
  const folded = foldIcsLine(long);
  for (const line of folded.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, `line over 75 octets: ${line}`);
  assert.equal(folded.replace(/\r\n /g, ''), long, 'unfolding restores the original');
  assert.equal(folded.includes('\uFFFD'), false);
});

test('B-008: hostile event text stays inert in the file', () => {
  const [event] = calendarEventsFromConfig({ slug: 's', displayName: '<script>alert(1)</script>', events: [{ title: 'X\r\nBEGIN:VEVENT', startAt: '2026-12-20T08:00:00+07:00' }] });
  const ics = buildIcs([event]);
  assert.equal(ics.split('\r\n').filter((line) => line === 'BEGIN:VEVENT').length, 1, 'a newline in a title cannot open a second event');
  assert.match(unfold(ics), /SUMMARY:X\\nBEGIN:VEVENT · <script>alert\(1\)<\/script>/);
});

test('B-008: Google Calendar link carries the same instant and location', () => {
  const [event] = calendarEventsFromConfig({ slug: 'budi-sari', displayName: 'Sari & Budi', events: fixtureEvents });
  const url = new URL(googleCalendarUrl(event));
  assert.equal(url.origin, 'https://calendar.google.com');
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('dates'), '20261220T010000Z/20261220T023000Z');
  assert.equal(url.searchParams.get('location'), 'Masjid Raya, Jl. Merdeka 1, Bandung');
});

test('B-008: countdown arithmetic and disappearance after the event', () => {
  const target = Date.parse('2026-12-20T01:00:00Z');
  assert.deepEqual(countdownParts(target, target - (2 * 86_400 + 3 * 3_600 + 4 * 60 + 5) * 1000), { days: 2, hours: 3, minutes: 4, seconds: 5 });
  assert.equal(countdownParts(target, target), null);
  assert.equal(countdownParts(target, target + 1), null);
  assert.equal(countdownParts(Number.NaN, 0), null);
});

test('B-008: headline names are shared by renderer, calendar and preview image', () => {
  const config = { couple: { bride: { nickName: 'Sari' }, groom: { nickName: 'Budi' } } } as Parameters<typeof invitationHeadline>[1];
  assert.deepEqual(invitationHeadline('wedding', config), ['Sari', 'Budi']);
  assert.equal(invitationDisplayName('wedding', { ...config, couple: { ...config.couple, displayOrder: 'groom-first' } } as typeof config), 'Budi & Sari');
  assert.equal(invitationDisplayName('wedding', {}), 'Undangan');
});

test('B-008: wiring — flag-gated, drafts excluded, no guest data in the calendar route', () => {
  const renderer = source('components/invitation/public-renderer.tsx');
  assert.match(renderer, /isFlagOn\('GUEST_CALENDAR'\)/);
  assert.match(renderer, /invitation\.status === 'PUBLISHED'/);
  assert.match(renderer, /<Countdown /);
  const route = source('app/i/[slug]/calendar.ics/route.ts');
  assert.match(route, /isFlagOn\('GUEST_CALENDAR'\)/);
  assert.match(route, /loadPublishedInvitationSummary\(slug\)/);
  assert.doesNotMatch(route, /\bguests\b|guestSlug/, 'the calendar route never touches guest rows');
  const loader = source('lib/invitation/public.ts');
  assert.match(loader, /export async function loadPublishedInvitationSummary[\s\S]*?status === 'DRAFT'\) return null/);
});

test('side routes can never shadow a guest page: their segment has a dot, guest slugs never do', () => {
  assert.equal(invitationCalendarPath('budi-sari'), '/i/budi-sari/calendar.ics');
  assert.equal(invitationPreviewImagePath('budi-sari'), '/i/budi-sari/og.png');
  for (const name of ['calendar.ics', 'og.png', 'Calendar', 'Ög . Png', '...']) assert.equal(slugify(name).includes('.'), false, name);
});

// ── B-011: opaque guest links behind a flag; legacy links keep working; real 404 ──

test('B-011: tokens are 128-bit, URL-safe, fixed-length and unique', () => {
  const tokens = Array.from({ length: 2000 }, () => newGuestLinkToken());
  for (const token of tokens.slice(0, 50)) {
    assert.match(token, GUEST_LINK_TOKEN_PATTERN);
    assert.equal(encodeURIComponent(token), token);
    assert.equal(Buffer.from(token, 'base64url').length, 16);
  }
  assert.equal(new Set(tokens).size, tokens.length);
});

test('B-011: resolution — token first, legacy slug only for guests without a token, else nothing', () => {
  const legacy = { id: 1, slug: 'budi-hartono', linkToken: null };
  const tokenized = { id: 2, slug: 'sari-wulan', linkToken: 'AbCdEfGhIjKlMnOpQrStUv' };
  const rows = [legacy, tokenized];
  assert.equal(pickGuestForSegment(rows, 'budi-hartono')?.id, 1, 'legacy link keeps working');
  assert.equal(pickGuestForSegment(rows, 'AbCdEfGhIjKlMnOpQrStUv')?.id, 2);
  assert.equal(pickGuestForSegment(rows, 'sari-wulan'), null, 'a tokenized guest is not reachable by the guessable slug');
  assert.equal(pickGuestForSegment(rows, 'abcdefghijklmnopqrstuv'), null, 'tokens are case-sensitive');
  assert.equal(pickGuestForSegment(rows, ''), null);
  const clash = [{ id: 3, slug: 'AbCdEfGhIjKlMnOpQrStUv', linkToken: null }, tokenized];
  assert.equal(pickGuestForSegment(clash, 'AbCdEfGhIjKlMnOpQrStUv')?.id, 2, 'a token match wins over a slug match');
  assert.equal(guestLinkSegment(tokenized), 'AbCdEfGhIjKlMnOpQrStUv');
  assert.equal(guestLinkSegment(legacy), 'budi-hartono');
});

test('B-011: wiring — one lookup rule for page and actions, flag-gated minting, additive migration, real 404', () => {
  const loader = source('lib/invitation/public.ts');
  assert.match(loader, /findGuestByLinkSegment\(invitation\.id, guestSlug\)/);
  assert.match(loader, /or\(eq\(guests\.linkToken, segment\), and\(isNull\(guests\.linkToken\), eq\(guests\.slug, segment\)\)\)/);
  assert.match(source('app/i/[slug]/actions.ts'), /findGuestByLinkSegment\(invitation\.id, guestSlug\)/);
  assert.doesNotMatch(source('app/i/[slug]/actions.ts'), /eq\(guests\.slug/);
  for (const file of ['app/(customer)/dashboard/guests/actions.ts', 'app/(customer)/dashboard/invitations/[id]/guests/actions.ts']) {
    assert.match(source(file), /isFlagOn\('OPAQUE_GUEST_LINKS'\) \? newGuestLinkToken\(\) : null/, file);
  }
  assert.match(source('app/(customer)/dashboard/guests/page.tsx'), /guestPath\(invitationSlug, guestLinkSegment\(guest\)\)/);
  assert.equal(source('components/invitation/public-renderer.tsx').match(/name="guestSlug" value=\{guestLinkSegment\(guest\)\}/g)?.length, 2);
  assert.equal(
    source('lib/db/migrations/0010_guest_link_token.sql').trim(),
    'ALTER TABLE "guests" ADD COLUMN "link_token" varchar(32);--> statement-breakpoint\nCREATE UNIQUE INDEX "guests_link_token_unique" ON "guests" USING btree ("link_token");',
  );
  assert.match(source('next.config.ts'), /ppr: 'incremental'/);
  assert.match(source('app/layout.tsx'), /export const experimental_ppr = true;/);
  for (const page of ['app/i/[slug]/page.tsx', 'app/i/[slug]/[guestSlug]/page.tsx']) {
    assert.match(source(page), /export const experimental_ppr = false;/, page);
  }
});

// ── B-010: link-preview image ─────────────────────────────────────────────────

const weddingConfig = {
  couple: { bride: { nickName: 'Sari' }, groom: { nickName: 'Budi' } },
  events: [{ title: 'Resepsi', startAt: '2026-12-27T19:00:00+08:00' }],
  settings: { openingCopy: 'Kami mengundang Anda.' },
  theme: { paletteId: 'sage' },
} as Parameters<typeof previewImageModel>[1];

test('B-010: the preview image uses the page palette, names and the event-zone date', () => {
  for (const id of paletteIds) {
    const hex = paletteHex(id);
    const classes = palette(id);
    assert.ok(classes.bg.includes(hex.bg) && classes.ink.includes(hex.ink) && classes.accent.includes(hex.accent), id);
  }
  assert.deepEqual(paletteHex('unknown'), paletteHex('ivory'));
  const model = previewImageModel('wedding', weddingConfig);
  assert.equal(model.label, 'Undangan Pernikahan');
  assert.equal(model.name, 'Sari & Budi');
  assert.equal(model.date, 'Minggu, 27 Desember 2026');
  assert.equal(model.colors.bg, '#f5f8f4');
});

test('B-010: long or hostile names are clipped text, and edits change the image URL', () => {
  const hostile = { ...weddingConfig, couple: { bride: { nickName: '<img src=x onerror=alert(1)>'.repeat(4) }, groom: { nickName: 'Budi' } } } as typeof weddingConfig;
  const model = previewImageModel('wedding', hostile);
  assert.equal([...model.name].length, 48);
  assert.ok(model.name.endsWith('…'));
  assert.equal(model.imageName, model.name, 'ASCII markup is drawn as literal text');
  const rtl = previewImageModel('wedding', { ...weddingConfig, couple: { bride: { nickName: 'ليلى 🎉' }, groom: { nickName: 'Budi' } } } as typeof weddingConfig);
  assert.equal(rtl.imageName, null, 'glyphs outside the bundled font would be fetched from a third party');
  assert.equal(rtl.name, 'ليلى 🎉 & Budi', 'metadata text keeps the real name');
  assert.match(source('app/i/[slug]/og.png/route.tsx'), /\{imageName \?/);
  const v1 = previewImageVersion(previewImageModel('wedding', weddingConfig));
  assert.equal(v1, previewImageVersion(previewImageModel('wedding', weddingConfig)), 'stable for the same content');
  assert.notEqual(v1, previewImageVersion(model));
});

test('B-010: share metadata points at the 1200×630 image and the opening copy, never at a guest', () => {
  const meta = invitationShareMetadata({ slug: 'budi-sari', eventType: 'wedding' }, weddingConfig);
  const [image] = meta.openGraph.images;
  assert.match(image.url, /^\/i\/budi-sari\/og\.png\?v=[0-9a-z]+$/);
  assert.equal(image.width, 1200);
  assert.equal(image.height, 630);
  assert.equal(meta.openGraph.description, 'Kami mengundang Anda.');
  assert.equal(meta.openGraph.locale, 'id_ID');
  assert.equal(meta.twitter.card, 'summary_large_image');
  for (const page of ['app/i/[slug]/page.tsx', 'app/i/[slug]/[guestSlug]/page.tsx']) {
    assert.match(source(page), /\.\.\.invitationShareMetadata\(data\.invitation, data\.config\)/, page);
  }
  const route = source('app/i/[slug]/og.png/route.tsx');
  assert.match(route, /loadPublishedInvitationSummary\(slug\)/);
  assert.doesNotMatch(route, /\bguests\b|guestSlug/);
  assert.match(source('components/invitation/public-renderer.tsx'), /import \{ palette \} from '@\/lib\/invitation\/palettes'/);
});
