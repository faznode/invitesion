// E-023 (s17): the cover photo goes through `safeImageSrc` like the organiser's logo. A stored cover keeps parsing as
// before (stored-value compatibility); the guest page requests only an upload path or an http(s) URL, and draws the
// photo chip only when it draws a photo.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeStoredConfig } from '../lib/invitation/content-read';
import { detailConfigSchema, type DetailConfig } from '../lib/invitation/detail-config';
import { fixtureGuest, LAYOUTS, renderGuestPage, withFamily } from './support/render-guest-page';

const UPLOAD = '/media/12/0123456789abcdef01234567.jpg';
const REMOTE = 'https://cdn.contoh.test/sampul.jpg';
const HOSTILE = ['javascript:alert(1)', 'data:image/svg+xml,<svg onload=alert(1)>', 'blob:https://x.test/1', 'file:///etc/passwd', 'ftp://x.test/sampul.jpg'];

// A past event: no countdown, so two renders of the same config are byte-identical, and Lontar (which frames the photo
// beside the date band, s17 finding S17-L1) has a band to frame it beside.
const cover = (imageUrl?: string): DetailConfig => ({
  couple: { bride: { nickName: 'Laras' }, groom: { nickName: 'Dimas' } },
  theme: { paletteId: 'ivory', cover: { headline: 'Pernikahan', ...(imageUrl ? { imageUrl } : {}) } },
  events: [{ title: 'Resepsi', startAt: '2020-03-10T19:00:00+08:00', venueName: 'Gedung Contoh' }],
});
const imgSources = (html: string) => [...html.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/g)].map((match) => match[1]);

test('E-023: every layout draws an uploaded or http(s) cover from the value the host saved', () => {
  for (const { label, familyId } of LAYOUTS) {
    for (const value of [UPLOAD, REMOTE]) {
      const page = renderGuestPage({ config: withFamily(cover(value), familyId), guest: fixtureGuest() });
      assert.deepEqual(imgSources(page), [value], `${label}: ${value}`);
    }
  }
});

test('E-023: any other stored scheme renders exactly the page without a cover, in every layout', () => {
  for (const { label, familyId } of LAYOUTS) {
    const withoutCover = renderGuestPage({ config: withFamily(cover(), familyId), guest: fixtureGuest() });
    for (const value of HOSTILE) {
      const page = renderGuestPage({ config: withFamily(cover(value), familyId), guest: fixtureGuest() });
      assert.equal(page, withoutCover, `${label}: ${value.split(':')[0]}`);
      assert.ok(!page.includes(value), `${label}: the stored value never reaches the markup`);
    }
  }
});

test('E-023: the photo chip follows the drawn photo, not the stored value (legacy lays text over it)', () => {
  const chip = /class="[^"]*\bw-fit rounded-2xl\b[^"]*"[^>]*>Pernikahan</;
  assert.ok(chip.test(renderGuestPage({ config: cover(UPLOAD), guest: fixtureGuest() })), 'legacy: chip over a photo');
  assert.ok(!chip.test(renderGuestPage({ config: cover('javascript:alert(1)'), guest: fixtureGuest() })), 'legacy: no photo, no chip');
  // Gapura frames the photo above its text since the s17 revision (S16-X1): the frame follows the drawn photo, and no
  // cover text meets the photo, so none needs a chip.
  const framed = renderGuestPage({ config: withFamily(cover(UPLOAD), 'gapura'), guest: fixtureGuest() });
  assert.ok(/<img src="[^"]*"[^>]*\baspect-square\b/.test(framed) && framed.includes(`<img src="${UPLOAD}"`), 'gapura: the photo in its frame');
  assert.ok(!chip.test(framed), 'gapura: no chip');
});

test('E-023: stored covers keep parsing, so the lenient read never drops the theme for an old value', () => {
  for (const value of [UPLOAD, REMOTE, ...HOSTILE]) {
    assert.ok(detailConfigSchema.safeParse(cover(value)).success, value);
    const { config, dropped } = normalizeStoredConfig(withFamily(cover(value), 'kartu'));
    assert.deepEqual(dropped, [], value);
    assert.equal(config.theme?.familyId, 'kartu', `${value}: family kept`);
    assert.equal(config.theme?.cover?.imageUrl, value, `${value}: stored value unchanged`);
  }
});
