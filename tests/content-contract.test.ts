// Content contract (s11): the render-capability map agrees with the renderer, the editor notices are derived from it,
// stored configs are read leniently per section, and guest pages get no locale cookie (B-014 step 1).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  CONTENT_SCHEMA_VERSION,
  RENDER_CAPABILITIES,
  sectionForEditorTab,
  storedOnlyNotice,
  type ContentSection,
} from '../lib/invitation/content-contract';
import { normalizeStoredConfig } from '../lib/invitation/content-read';
import { detailConfigSchema } from '../lib/invitation/detail-config';
import { viewLockKey } from '../lib/invitation/view-tracking';
import { mirrorsLocaleCookie } from '../lib/locale-cookie';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
// Every file that renders guest-page content, design families included (B-030): a family that reads a stored-only
// field must fail here exactly like the legacy layout would.
const guestPageFiles = [
  'components/invitation/public-renderer.tsx',
  'components/invitation/guest-view.ts',
  'components/invitation/guest-blocks.tsx',
  ...readdirSync(join(process.cwd(), 'components/invitation/families')).map((file) => `components/invitation/families/${file}`),
  'lib/invitation/headline.ts',
];
const guestPageSource = guestPageFiles.map(source).join('\n');
const ITEM_ALIAS: Partial<Record<ContentSection, string>> = { events: 'event', gift: 'account', story: 'item', registrationForm: 'question' };
const chain = (section: string, path: string) => new RegExp(`${[section, ...path.split('.')].join('\\??\\.')}\\b`);
const referenced = (section: ContentSection, path: string) =>
  chain(section, path).test(guestPageSource) ||
  (ITEM_ALIAS[section] !== undefined && new RegExp(`\\b${ITEM_ALIAS[section]}\\.${path}\\b`).test(guestPageSource));

test('every config section is classified, and nothing else', () => {
  assert.deepEqual(Object.keys(RENDER_CAPABILITIES).sort(), Object.keys(detailConfigSchema.shape).sort());
});

test('every field marked rendered is read by the guest page', () => {
  const missing = Object.entries(RENDER_CAPABILITIES).flatMap(([section, cap]) =>
    cap.rendered.filter((path) => !referenced(section as ContentSection, path)).map((path) => `${section}.${path}`));
  assert.deepEqual(missing, []);
});

test('no field marked stored-only is read by the guest page (move it to rendered when a template renders it)', () => {
  const rendered = Object.entries(RENDER_CAPABILITIES).flatMap(([section, cap]) =>
    cap.storedOnly.filter((path) => referenced(section as ContentSection, path)).map((path) => `${section}.${path}`));
  assert.deepEqual(rendered, []);
});

test('editor notices come from the map: whole sections, field lists and caveats', () => {
  assert.deepEqual(storedOnlyNotice('music', 'id'), { wholeSection: true, fields: [], caveat: undefined });
  // B-029 (s17) renders the hashtag and filter link, so the section no longer carries a notice; the ceremony profile
  // keeps one for its photo only.
  assert.equal(storedOnlyNotice('instagramStory', 'en'), null);
  assert.deepEqual(storedOnlyNotice('ceremonyProfile', 'id'), { wholeSection: false, fields: ['foto'], caveat: undefined });
  const couple = storedOnlyNotice('couple', 'id');
  assert.equal(couple?.wholeSection, false);
  assert.ok(couple?.fields.includes('foto') && couple.fields.includes('nama orang tua'), JSON.stringify(couple));
  assert.equal(new Set(couple?.fields).size, couple?.fields.length, 'bride and groom fields collapse into one label each');
  assert.match(storedOnlyNotice('guestbook', 'id')?.caveat ?? '', /Moderasi belum aktif/);
  assert.equal(storedOnlyNotice('events', 'id'), null);
  assert.equal(storedOnlyNotice('quote', 'en'), null);
});

test('the profile tab edits a different section per event type', () => {
  assert.equal(sectionForEditorTab('couple', 'wedding'), 'couple');
  assert.equal(sectionForEditorTab('couple', 'birthday'), 'birthdayPerson');
  assert.equal(sectionForEditorTab('couple', 'corporate'), 'corporateProfile');
  for (const ceremony of ['aqiqah', 'khitanan', 'tasyakuran']) assert.equal(sectionForEditorTab('couple', ceremony), 'ceremonyProfile');
  assert.equal(sectionForEditorTab('whatsapp', 'wedding'), 'whatsappTemplate');
  assert.equal(sectionForEditorTab('music', 'wedding'), 'music');
  assert.equal(sectionForEditorTab('settings', 'wedding'), 'settings');
  assert.equal(sectionForEditorTab('nonsense', 'wedding'), null);
});

test('lenient read: a valid config round-trips, version absent means 1', () => {
  const config = { settings: { title: 'Budi & Sari' }, quote: { enabled: true, text: 'Teks', author: 'A' } };
  const read = normalizeStoredConfig(config);
  assert.deepEqual(read.dropped, []);
  assert.equal(read.version, 1);
  assert.equal(CONTENT_SCHEMA_VERSION, 1);
  assert.equal(read.config.settings?.title, 'Budi & Sari');
  assert.equal(read.config.quote?.text, 'Teks');
});

test('lenient read: a legacy or broken section is dropped, the rest still renders', () => {
  const legacy = {
    settings: { title: 'Dimas & Laras' },
    art: { cover: 'x' }, // ADR-O01 leftover: template-owned key that once leaked into invitation configs
    events: [{ title: 'Akad', startAt: 'not-a-date' }],
    gift: { enabled: true, accounts: [{ kind: 'bank', label: 'BCA', number: '123' }] },
  };
  assert.equal(detailConfigSchema.safeParse(legacy).success, false, 'the strict schema rejects it as a whole');
  const read = normalizeStoredConfig(legacy);
  assert.deepEqual(read.dropped.sort(), ['art', 'events']);
  assert.equal(read.config.settings?.title, 'Dimas & Laras');
  assert.equal(read.config.gift?.accounts?.[0]?.label, 'BCA');
  assert.equal(read.config.events, undefined);
});

test('lenient read: non-objects become an empty config; a future version keeps the sections it can read', () => {
  for (const raw of [null, undefined, 'x', 42, ['a']]) assert.deepEqual(normalizeStoredConfig(raw).config, {});
  const future = normalizeStoredConfig({ schemaVersion: 2, settings: { title: 'T' }, newSection: { a: 1 } });
  assert.equal(future.version, 2);
  assert.equal(future.config.settings?.title, 'T');
  assert.deepEqual(future.dropped, ['newSection']);
});

test('B-014 step 1: guest pages get no locale cookie; other routes still do', () => {
  assert.equal(mirrorsLocaleCookie('/i/budi-sari/budi-hartono'), false);
  assert.equal(mirrorsLocaleCookie('/i/budi-sari'), false);
  assert.equal(mirrorsLocaleCookie('/i'), false);
  assert.equal(mirrorsLocaleCookie('/'), true);
  assert.equal(mirrorsLocaleCookie('/invitations'), true, 'a path that merely starts with "i" keeps the cookie');
  assert.equal(mirrorsLocaleCookie('/dashboard'), true);
  assert.match(source('middleware.ts'), /if \(mirrorsLocaleCookie\(pathname\)\) \{\s*res\.cookies\.set\('locale'/);
});

test('B-014 step 1: one loader call per request — the loader is wrapped in React cache()', () => {
  assert.match(source('lib/invitation/public.ts'), /export const loadPublicInvitation = cache\(async \(slug: string, guestSlug\?: string, includeDraft = false\)/);
});

test('B-017a: advisory-lock keys never collide between guests and anonymous opens', () => {
  assert.equal(viewLockKey(7, 42), 42);
  assert.equal(viewLockKey(7, null), -7);
  assert.equal(viewLockKey(7, undefined), -7);
  assert.notEqual(viewLockKey(42, null), viewLockKey(1, 42));
});
