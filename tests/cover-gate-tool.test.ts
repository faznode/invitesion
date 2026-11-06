// B-009: the pure parts of the cover-gate acceptance tool and the fixture's music variants. The browser run itself is a
// product gate (`scripts/ci/product-gates.sh`).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gateVerdict, OPEN_LIMIT_MS, toneWav } from '../tools/template-harness/cover-gate';

// The seeder builds its Drizzle client at import time; postgres.js connects lazily and this test never queries, so an
// unreachable placeholder stands in (as in tests/support/render-guest-page.ts) and the module is required afterwards.
process.env.POSTGRES_URL ??= 'postgres://render-test:unused@127.0.0.1:1/unused';
const { familyReviewInvitations } = require('../invitation-research/_tools/setup/seed-family-review') as typeof import('../invitation-research/_tools/setup/seed-family-review');

test('the fixture tone is a valid 16-bit mono PCM WAV that starts and ends silent', () => {
  const wav = toneWav(1, 8000);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt16LE(20), 1, 'PCM');
  assert.equal(wav.readUInt16LE(22), 1, 'mono');
  assert.equal(wav.readUInt32LE(24), 8000);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.readUInt32LE(40), 8000 * 2);
  assert.equal(wav.length, 44 + 8000 * 2);
  assert.equal(wav.readInt16LE(44), 0, 'fades in from silence');
  assert.equal(wav.readInt16LE(wav.length - 2), 0, 'fades out to silence');
  const peak = Math.max(...Array.from({ length: 8000 }, (_, i) => Math.abs(wav.readInt16LE(44 + i * 2))));
  assert.ok(peak > 5000 && peak <= Math.round(0.2 * 32767), `soft but audible (${peak})`);
});

test('a page passes only when every check passed, and I-15 limits the opening to 1.5 s', () => {
  assert.equal(OPEN_LIMIT_MS, 1500);
  assert.equal(gateVerdict([]), 'FAIL', 'a page with no checks proves nothing');
  assert.equal(gateVerdict([{ name: 'a', pass: true }, { name: 'b', pass: true }]), 'PASS');
  assert.equal(gateVerdict([{ name: 'a', pass: true }, { name: 'b', pass: false }]), 'FAIL');
});

test('`--music-url` adds a play-on-open and a manual music page to every layout, and nothing without it', () => {
  const without = familyReviewInvitations();
  assert.equal(without.filter((row) => row.slug.includes('-music')).length, 0);
  const url = 'http://127.0.0.1:3100/review/tone.wav';
  const rows = familyReviewInvitations({ musicUrl: url }).filter((row) => row.slug.includes('-music'));
  assert.deepEqual(
    rows.map((row) => row.slug).sort(),
    ['legacy', 'gapura', 'kartu', 'riang', 'lontar'].flatMap((layout) => [`review-${layout}-music`, `review-${layout}-music-manual`]).sort(),
  );
  for (const row of rows) {
    assert.equal(row.config.music?.enabled, true);
    assert.equal(row.config.music?.assetUrl, url);
    assert.equal(row.config.music?.autoplay, row.slug.endsWith('-manual') ? false : undefined, row.slug);
  }
});
