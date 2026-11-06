// s21: the product-family byte census splits a guest page into the shared shell and family-attributable bytes, and the
// budgets separate the current build from the pre-B-015 build it replaced (tools/template-harness/product-bytes.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attributeBytes, checkProductBudgets, formatRelative, inlinePayloadBytes, productVerdict, relativeToLeanest, type PageCensus, type Resource } from '../tools/template-harness/product-bytes';
import { PRODUCT_PAGE_BUDGETS } from '../tools/template-harness/policy';

const resource = (url: string, type: string, decodedBytes: number, transferBytes = decodedBytes): Resource => ({ url, type, status: 200, decodedBytes, transferBytes });
const page = (label: string, counted: Resource[], payloadBytes = 0): PageCensus => ({ label, url: `http://lab/i/${label}`, status: 200, payloadBytes, counted, excluded: [] });

test('product-bytes: resources every page loads are the shell; the document and anything else belong to the family', () => {
  const chunk = resource('/_next/static/chunks/app.js', 'Script', 400_000, 120_000);
  const css = resource('/_next/static/chunks/app.css', 'Stylesheet', 90_000, 18_000);
  const ornament = resource('/families/riang/bunting.svg', 'Image', 6_000);
  const pages = [
    page('legacy', [resource('/i/a', 'Document', 50_000, 16_000), chunk, css], 30_000),
    page('gapura', [resource('/i/b', 'Document', 54_000, 17_000), css, chunk], 33_000),
    page('riang', [resource('/i/c', 'Document', 60_000, 18_000), chunk, css, ornament], 37_000),
  ];
  const { shell, families } = attributeBytes(pages);
  assert.deepEqual(shell.resources.map((r) => r.url).sort(), [chunk.url, css.url].sort());
  assert.equal(shell.bytes, 490_000);
  assert.equal(shell.transferBytes, 138_000);
  assert.deepEqual(shell.bytesByType, { Script: 400_000, Stylesheet: 90_000 });
  const riang = families.find((family) => family.label === 'riang')!;
  assert.deepEqual(riang.own.map((r) => r.url), [ornament.url]);
  assert.equal(riang.familyBytes, 66_000);
  assert.equal(riang.markupBytes, 23_000);
  assert.equal(riang.totalBytes, 556_000);
  assert.equal(riang.totalTransferBytes, 138_000 + 18_000 + 6_000);
  for (const family of families) assert.equal(family.totalBytes, shell.bytes + family.familyBytes);
});

test('product-bytes: a resource only some families load is each of those families’ own cost, never the shell', () => {
  const font = resource('/fonts/display.woff2', 'Font', 24_000);
  const pages = [page('a', [resource('/i/a', 'Document', 10), font]), page('b', [resource('/i/b', 'Document', 10), font]), page('c', [resource('/i/c', 'Document', 10)])];
  const { shell, families } = attributeBytes(pages);
  assert.equal(shell.resources.length, 0);
  assert.deepEqual(families.map((family) => family.familyBytes), [24_010, 24_010, 10]);
});

test('product-bytes: budgets flag the shell, a family, the page total and the total as served, inclusive of the limit', () => {
  const budgets = { shellKiB: 100, familyKiB: 10, totalKiB: 108, totalTransferKiB: 50 };
  const at = (shellBytes: number, documentBytes: number, transfer: number) =>
    attributeBytes([
      page('x', [resource('/i/x', 'Document', documentBytes, transfer), resource('/s.js', 'Script', shellBytes, 0)]),
      page('y', [resource('/i/y', 'Document', 1, 1), resource('/s.js', 'Script', shellBytes, 0)]),
    ]);
  assert.deepEqual(checkProductBudgets(at(100 * 1024, 8 * 1024, 50 * 1024), budgets), []);
  const problems = checkProductBudgets(at(100 * 1024 + 1, 10 * 1024 + 1, 50 * 1024 + 1), budgets);
  assert.equal(problems.length, 4);
  assert.match(problems[0], /^shell /);
  assert.match(problems[1], /^x: family bytes/);
  assert.match(problems[2], /^x: page total /);
  assert.match(problems[3], /^x: page total as served/);
});

test('product-bytes: the verdict is INCOMPLETE without two loaded 200 pages, FAIL on a budget problem, else PASS', () => {
  const ok = page('a', [resource('/i/a', 'Document', 1)]);
  assert.equal(productVerdict([ok], []).verdict, 'INCOMPLETE');
  assert.equal(productVerdict([ok, { ...ok, label: 'b', status: 404 }], []).verdict, 'INCOMPLETE');
  assert.equal(productVerdict([ok, { ...ok, label: 'b', error: 'no load event within 20 s' }], []).verdict, 'INCOMPLETE');
  assert.equal(productVerdict([ok, { ...ok, label: 'b', counted: [] }], []).verdict, 'INCOMPLETE');
  assert.equal(productVerdict([ok, { ...ok, label: 'b' }], ['shell 700 KiB > 640 KiB']).verdict, 'FAIL');
  assert.equal(productVerdict([ok, { ...ok, label: 'b' }], []).verdict, 'PASS');
});

test('product-bytes: the inline RSC payload counts only Next.js flight scripts, in UTF-8 bytes', () => {
  const html = '<script src="/a.js"></script><script>self.__next_f.push([1,"é"])</script><p>x</p><script>self.__next_f.push([2])</script><script>other()</script>';
  assert.equal(inlinePayloadBytes(html), Buffer.byteLength('self.__next_f.push([1,"é"])') + Buffer.byteLength('self.__next_f.push([2])'));
});

// The s21 census of the five `review-<layout>-full` pages (decoded / served bytes; shell split by type), on the build
// the budgets are anchored on and on the pre-B-015 build of the same data.
const MEASURED = {
  current: { shell: { Font: [55_160, 56_810], Stylesheet: [93_277, 17_780], Script: [475_142, 147_604] }, documents: { legacy: [50_207, 16_781], gapura: [55_180, 17_675], kartu: [57_760, 17_825], riang: [62_114, 18_463], lontar: [56_087, 18_042] } },
  preB015: { shell: { Font: [55_160, 56_810], Stylesheet: [93_277, 17_780], Script: [656_558, 201_170] }, documents: { legacy: [125_440, 31_718], gapura: [130_413, 32_601], kartu: [132_993, 32_745], riang: [137_347, 33_390], lontar: [131_320, 32_967] } },
};
const measuredPages = (build: (typeof MEASURED)['current']) =>
  Object.entries(build.documents).map(([label, [decoded, transfer]]) =>
    page(label, [resource(`/i/${label}`, 'Document', decoded, transfer), ...Object.entries(build.shell).map(([type, [d, t]]) => resource(`/shell.${type}`, type, d, t))]),
  );

test('product-bytes: the anchored budgets pass the s21 build and fail the pre-B-015 build on shell, family and total', () => {
  assert.deepEqual(checkProductBudgets(attributeBytes(measuredPages(MEASURED.current)), PRODUCT_PAGE_BUDGETS), []);
  const problems = checkProductBudgets(attributeBytes(measuredPages(MEASURED.preB015)), PRODUCT_PAGE_BUDGETS);
  assert.ok(problems.some((problem) => problem.startsWith('shell ')), problems.join('; '));
  for (const label of Object.keys(MEASURED.preB015.documents)) {
    assert.ok(problems.some((problem) => problem.startsWith(`${label}: family bytes`)), `${label} family`);
    assert.ok(problems.some((problem) => problem.startsWith(`${label}: page total `)), `${label} total`);
  }
});

test('product-bytes (s23r): the relative figure compares each family with the leanest layout and never decides the verdict', () => {
  const chunk = resource('/_next/static/chunks/app.js', 'Script', 400_000, 120_000);
  const pages = [
    page('legacy', [resource('/i/a', 'Document', 40_000, 12_000), chunk]),
    page('riang', [resource('/i/c', 'Document', 50_000, 15_000), chunk]),
    page('kartu', [resource('/i/b', 'Document', 44_000, 13_000), chunk]),
  ];
  const attribution = attributeBytes(pages);
  const relative = relativeToLeanest(attribution);
  assert.equal(relative.leanest, 'legacy');
  assert.deepEqual(
    relative.rows.map((row) => [row.label, row.aboveLeanestBytes, row.aboveLeanestPercent]),
    [['legacy', 0, 0], ['riang', 10_000, 25], ['kartu', 4_000, 10]],
  );
  assert.match(formatRelative(relative), /not a budget\): leanest legacy; riang \+9\.8 KiB \(\+25 %\), kartu \+3\.9 KiB \(\+10 %\)$/);
  assert.deepEqual(relativeToLeanest({ shell: attribution.shell, families: [] }), { rows: [] });
  // A family far above the leanest still passes when it is inside the absolute budgets: only budgets decide.
  assert.equal(productVerdict(pages, checkProductBudgets(attribution)).verdict, 'PASS');
});
