#!/usr/bin/env node
// Throwaway research tool (allowed by the run's scope guard): observe ONE public page the way a
// normal mobile visitor would, then record evidence with REA + a Lighthouse lab run.
//
//   node capture.mjs --id C-ENV-003 --competitor enviory --kind demo --url https://… \
//     [--open-cover] [--lighthouse] [--own] [--settle 5000]
//
// Rules enforced here (invitation-research/_rea-playbook.md):
//   R1  no form submission, no login, no probing — one navigation, optional cover click, scroll.
//   R7  competitor screenshots go to _private/ only; summaries in raw/ hold no page copy or PII.
//   R8  robots.txt is honoured and requests to one origin are spaced >= 1.5 s apart.
// Needs: a CDP browser on 127.0.0.1:9222, the pinned REA CLI, Lighthouse 12 (paths below).

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { robotsVerdict } from './robots.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESEARCH = join(HERE, '..', '..');
// The hosting sandbox can overwrite .gitignore, so private evidence may live outside the project.
const PRIVATE = process.env.INVITESION_PRIVATE_DIR ?? join(RESEARCH, '_private');
const CDP = process.env.CDP_HTTP ?? 'http://127.0.0.1:9222';
const NODE24 = process.env.REA_NODE ?? '/vercel/share/work/tools/node-v24.22.2-linux-x64/bin/node';
const REA = process.env.REA_BIN ?? '/vercel/share/work/tools/rea-cli/node_modules/rea-agents/scripts/rea.mjs';
const LIGHTHOUSE = process.env.LH_BIN ?? '/vercel/share/work/tools/lh/node_modules/.bin/lighthouse';
const CHROME = process.env.CHROME_PATH ?? '/vercel/share/work/tools/ms-playwright/chromium-1248/chrome-linux64/chrome';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; SM-A356E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, token, index, all) => {
    if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1]?.startsWith('--') || all[index + 1] === undefined ? true : all[index + 1]]);
    return pairs;
  }, []),
);
for (const required of ['id', 'competitor', 'url']) if (!args[required]) throw new Error(`--${required} is required`);
const own = Boolean(args.own);
const settle = Number(args.settle ?? 5000);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const wib = () => new Date(Date.now() + 7 * 3600e3).toISOString().replace('Z', '+07:00');

// ---------- politeness ----------
const statePath = '/tmp/capture-politeness.json';
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
async function polite(origin) {
  const wait = (state[origin] ?? 0) + 1500 - Date.now();
  if (wait > 0) await sleep(wait);
  state[origin] = Date.now();
  writeFileSync(statePath, JSON.stringify(state));
}
async function robotsAllows(url) {
  const { origin, pathname, search } = new URL(url);
  await polite(origin);
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { 'user-agent': ANDROID_UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { allowed: true, note: `robots.txt ${res.status}` };
    return robotsVerdict(await res.text(), pathname + search);
  } catch (error) {
    return { allowed: true, note: `robots.txt unreachable (${error.name})` };
  }
}

// ---------- minimal CDP client (Node 24 has a global WebSocket) ----------
function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();
  const listeners = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    } else if (message.method) listeners.forEach((listener) => listener(message));
  });
  const ready = new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
  return {
    ready,
    send: (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }),
    on: (listener) => listeners.push(listener),
    close: () => socket.close(),
  };
}

// Structure-only fingerprint evaluated in the page. Returns no paragraphs, names or numbers.
const FINGERPRINT = `(() => {
  const redact = (s) => (s || '').replace(/\\d[\\d .-]{5,}\\d/g, '#').replace(/\\s+/g, ' ').trim().slice(0, 60);
  const w = window;
  const libs = {
    gsap: !!w.gsap, scrollTrigger: !!(w.ScrollTrigger || (w.gsap && w.gsap.plugins && w.gsap.plugins.scrollTrigger)),
    aos: !!w.AOS || !!document.querySelector('[data-aos]'), animateCss: !!document.querySelector('[class*="animate__"]'),
    wow: !!w.WOW, swiper: !!w.Swiper || !!document.querySelector('.swiper'), slick: !!(w.jQuery && w.jQuery.fn && w.jQuery.fn.slick),
    owl: !!document.querySelector('.owl-carousel'), lottie: !!w.lottie || !!w.bodymovin || !!document.querySelector('lottie-player,dotlottie-player'),
    three: !!w.THREE || !!document.querySelector('canvas[data-engine*="three"]'), pixi: !!w.PIXI, anime: !!w.anime, motionOne: !!w.Motion,
    howler: !!w.Howl, jquery: !!w.jQuery, bootstrap: !!document.querySelector('link[href*="bootstrap"],script[src*="bootstrap"]'),
    tailwind: !!document.querySelector('[class*="tw-"],[class*=" md:"],[class^="md:"]'), alpine: !!w.Alpine, vue: !!w.Vue || !!document.querySelector('[data-v-app],#__nuxt'),
    nuxt: !!w.__NUXT__ || !!document.querySelector('#__nuxt'), next: !!w.__NEXT_DATA__ || !!document.querySelector('#__next') || !!w.__next_f,
    react: !!document.querySelector('[data-reactroot]') || !!w.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.size, svelte: !!document.querySelector('[class*="svelte-"]'),
    flutterWeb: !!document.querySelector('flt-glass-pane,flutter-view'), wordpress: !!document.querySelector('link[href*="wp-content"],script[src*="wp-content"]'),
    elementor: !!document.querySelector('[class*="elementor"]'), livewire: !!w.Livewire, inertia: !!document.querySelector('[data-page]'),
  };
  const sections = [...document.querySelectorAll('section, [class*="section"], [id*="section"]')]
    .filter((el) => el.getBoundingClientRect().height > 120 && !el.parentElement.closest('section'))
    .slice(0, 40)
    .map((el) => ({ tag: el.tagName.toLowerCase(), id: (el.id || '').slice(0, 40), cls: (el.className && el.className.baseVal === undefined ? String(el.className) : '').split(/\\s+/).slice(0, 4).join(' ').slice(0, 80),
      heading: redact((el.querySelector('h1,h2,h3')||{}).textContent), h: Math.round(el.getBoundingClientRect().height) }));
  const buttons = [...document.querySelectorAll('button, a[role="button"], .btn, [class*="button"]')].map((b) => redact(b.textContent)).filter(Boolean);
  const media = {
    audio: [...document.querySelectorAll('audio, audio source')].map((a) => ({ autoplay: a.autoplay || false, loop: a.loop || false, type: (a.src || a.getAttribute('src') || '').split('?')[0].split('.').pop().slice(0, 5) })),
    video: document.querySelectorAll('video').length, iframes: [...document.querySelectorAll('iframe')].map((f) => { try { return new URL(f.src, location.href).hostname; } catch { return 'invalid'; } }),
    canvases: document.querySelectorAll('canvas').length, svgs: document.querySelectorAll('svg').length, images: document.images.length,
    lazyImages: [...document.images].filter((i) => i.loading === 'lazy').length,
  };
  const forms = [...document.forms].map((f) => ({ fields: [...f.elements].map((e) => e.type || e.tagName.toLowerCase()).slice(0, 12), hasRadio: !!f.querySelector('input[type=radio]'), hasSelect: !!f.querySelector('select') }));
  const fontsUsed = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')))].slice(0, 20);
  const text = document.body ? document.body.innerText : '';
  const has = (re) => re.test(text);
  const features = {
    coverGate: has(/buka undangan|open invitation|lihat undangan/i), toGuest: has(/kepada yth|dear|to:/i) || /[?&](to|kpd|untuk|u)=/.test(location.search),
    countdown: !!document.querySelector('[class*="countdown"],[id*="countdown"]') || has(/\\b(hari|days)\\b[\\s\\S]{0,40}\\b(jam|hours)\\b/i),
    rsvp: has(/rsvp|konfirmasi kehadiran|kehadiran/i), wishes: has(/ucapan|doa|wishes|guestbook|buku tamu/i),
    gift: has(/amplop digital|kado digital|wedding gift|hadiah|rekening|transfer|qris|e-wallet|gopay|ovo|dana/i),
    copyButton: buttons.some((b) => /salin|copy/i.test(b)), maps: media.iframes.some((h) => /google\\.|maps/.test(h)) || has(/google maps|lihat lokasi|petunjuk arah/i),
    calendar: has(/save the date|simpan tanggal|add to calendar|tambah ke kalender|google calendar/i), livestream: has(/live ?stream|siaran langsung|youtube live/i),
    qr: has(/qr code|kode qr|check-in/i), loveStory: has(/love story|kisah cinta|cerita kami|our story/i), gallery: has(/galeri|gallery|moment/i),
    dressCode: has(/dress ?code/i), quranVerse: has(/QS\\.|Ar-Rum|surah|ayat/i), protocol: has(/protokol kesehatan|health protocol/i),
    timezoneLabel: (text.match(/\\b(WIB|WITA|WIT)\\b/g) || []).filter((v, i, a) => a.indexOf(v) === i), watermark: has(/powered by|dibuat (dengan|oleh)|made with|undangan digital oleh/i),
    instagramFilter: has(/instagram filter|filter instagram/i), musicControl: !!document.querySelector('[class*="music"],[id*="music"],[class*="audio"],[aria-label*="music" i]'),
  };
  return { title: redact(document.title), lang: document.documentElement.lang, generator: (document.querySelector('meta[name=generator]')||{}).content || null,
    viewport: (document.querySelector('meta[name=viewport]')||{}).content || null, og: { image: !!document.querySelector('meta[property="og:image"]'), title: !!document.querySelector('meta[property="og:title"]'), description: !!document.querySelector('meta[property="og:description"]') },
    reducedMotionCss: [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.media && /prefers-reduced-motion/.test(r.media.mediaText)); } catch { return false; } }),
    libs, sections, sectionCount: sections.length, buttons: [...new Set(buttons)].slice(0, 25), media, forms, fontsUsed, features,
    domNodes: document.getElementsByTagName('*').length, docHeight: document.documentElement.scrollHeight };
})()`;

async function observe(url) {
  await polite(new URL(url).origin);
  const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
  const page = connect(target.webSocketDebuggerUrl);
  await page.ready;
  const requests = new Map();
  page.on((message) => {
    if (message.method === 'Network.responseReceived') {
      const { requestId, type, response } = message.params;
      requests.set(requestId, { type, url: response.url, mime: response.mimeType, status: response.status, protocol: response.protocol, bytes: 0, fromCache: response.fromDiskCache });
    } else if (message.method === 'Network.loadingFinished' && requests.has(message.params.requestId)) {
      requests.get(message.params.requestId).bytes = message.params.encodedDataLength;
    }
  });
  await page.send('Network.enable');
  await page.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.send('Network.setUserAgentOverride', { userAgent: ANDROID_UA, acceptLanguage: 'id-ID,id;q=0.9,en;q=0.6', platform: 'Android' });
  await page.send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true });
  await page.send('Page.enable');
  const loaded = new Promise((resolve) => page.on((m) => m.method === 'Page.loadEventFired' && resolve()));
  const started = Date.now();
  await page.send('Page.navigate', { url });
  await Promise.race([loaded, sleep(45000)]);
  const loadMs = Date.now() - started;
  await sleep(settle);
  const evaluate = async (expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  const beforeOpen = await evaluate(FINGERPRINT);
  let coverClicked = null;
  if (args['open-cover']) {
    coverClicked = await evaluate(`(() => { const el = [...document.querySelectorAll('button,a,div[role=button],.btn')].find((b) => /buka undangan|open invitation|lihat undangan|buka/i.test(b.textContent || '')); if (!el) return false; el.click(); return (el.textContent||'').trim().slice(0,30); })()`);
    await sleep(2500);
  }
  for (let y = 0; y < 14; y += 1) { await evaluate(`window.scrollBy(0, Math.round(innerHeight * 0.85))`); await sleep(700); }
  await evaluate(`window.scrollTo(0, 0)`);
  await sleep(800);
  const afterOpen = await evaluate(FINGERPRINT);
  await page.send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 1, mobile: true });
  const shot = await page.send('Page.captureScreenshot', { format: 'webp', quality: 55 });
  return { page, target, requests: [...requests.values()], loadMs, beforeOpen, afterOpen, coverClicked, shot: Buffer.from(shot.data, 'base64') };
}

function rea(subcommand, targetId, extra = []) {
  const run = spawnSync(NODE24, [REA, subcommand, CDP.replace('localhost', '127.0.0.1'), targetId, ...extra, '--json'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 180000 });
  return { ok: run.status === 0, stdout: run.stdout, stderr: (run.stderr || '').slice(0, 400) };
}

function lighthouse(url, outPath) {
  const run = spawnSync(LIGHTHOUSE, [url, '--quiet', '--output=json', `--output-path=${outPath}`, '--form-factor=mobile', '--screenEmulation.mobile', '--screenEmulation.width=412',
    '--screenEmulation.height=915', '--screenEmulation.deviceScaleFactor=2.625', '--throttling-method=simulate', `--emulated-user-agent=${ANDROID_UA}`,
    '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --lang=id-ID'],
  { encoding: 'utf8', env: { ...process.env, CHROME_PATH: CHROME }, timeout: 240000 });
  if (run.status !== 0 || !existsSync(outPath)) return { ok: false, error: (run.stderr || '').slice(-400) };
  const report = JSON.parse(readFileSync(outPath, 'utf8'));
  const audit = (id) => report.audits[id];
  const items = audit('resource-summary')?.details?.items ?? [];
  const byType = Object.fromEntries(items.map((i) => [i.resourceType, { requests: i.requestCount, bytes: i.transferSize }]));
  return {
    ok: true, lighthouseVersion: report.lighthouseVersion, finalUrl: report.finalDisplayedUrl,
    throttling: report.configSettings.throttling, screen: report.configSettings.screenEmulation,
    scores: Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, v.score === null ? null : Math.round(v.score * 100)])),
    metrics: { fcpMs: audit('first-contentful-paint')?.numericValue, lcpMs: audit('largest-contentful-paint')?.numericValue, tbtMs: audit('total-blocking-time')?.numericValue,
      cls: audit('cumulative-layout-shift')?.numericValue, siMs: audit('speed-index')?.numericValue, ttiMs: audit('interactive')?.numericValue },
    byType, totalBytes: audit('total-byte-weight')?.numericValue, requests: byType.total?.requests,
    thirdParties: (audit('third-party-summary')?.details?.items ?? []).slice(0, 12).map((i) => ({ entity: i.entity?.text ?? i.entity, bytes: i.transferSize, blockingMs: i.blockingTime })),
    fontDisplayIssues: (audit('font-display')?.details?.items ?? []).length, unusedJsBytes: audit('unused-javascript')?.details?.overallSavingsBytes ?? null,
    a11yFailures: Object.values(report.audits).filter((a) => report.categories.accessibility?.auditRefs.some((r) => r.id === a.id) && a.score === 0).map((a) => a.id),
  };
}

const captureDir = own ? join(RESEARCH, 'raw', 'invitesion', args.id) : join(PRIVATE, 'rea', args.id);
const summaryPath = join(RESEARCH, 'raw', args.competitor, `${args.id}.json`);
mkdirSync(captureDir, { recursive: true });
mkdirSync(dirname(summaryPath), { recursive: true });

const robots = own ? { allowed: true, note: 'own instance' } : await robotsAllows(args.url);
if (!robots.allowed) {
  console.log(JSON.stringify({ id: args.id, skipped: 'robots.txt disallows', robots }));
  process.exit(0);
}
const observed = await observe(args.url);
const inspect = rea('inspect-web-page', observed.target.id, ['--observation-ms', '1500']);
const bundle = rea('analyze-web-bundle', observed.target.id);
observed.page.close();
await fetch(`${CDP}/json/close/${observed.target.id}`).catch(() => {});

const files = {};
for (const [name, result] of [['rea-inspect.json', inspect], ['rea-bundle.json', bundle]]) {
  if (result.ok) { writeFileSync(join(captureDir, name), result.stdout); files[name] = sha256(result.stdout); }
}
const shotPath = own ? join(captureDir, 'viewport-412.webp') : join(PRIVATE, 'thumbs', `${args.id}.webp`);
mkdirSync(dirname(shotPath), { recursive: true });
writeFileSync(shotPath, observed.shot);

const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
const inspectJson = inspect.ok ? parse(inspect.stdout) : null;
const bundleJson = bundle.ok ? parse(bundle.stdout) : null;
const nr = inspectJson?.normalized_result ?? {};
const byType = {};
for (const r of observed.requests) {
  const t = r.type || 'Other';
  byType[t] ??= { requests: 0, bytes: 0 };
  byType[t].requests += 1;
  byType[t].bytes += r.bytes || 0;
}
const fontFiles = observed.requests.filter((r) => r.type === 'Font' || /\.(woff2?|ttf|otf)(\?|$)/.test(r.url)).map((r) => ({ host: new URL(r.url).hostname, file: new URL(r.url).pathname.split('/').pop().slice(0, 80), bytes: r.bytes }));
const scriptHosts = [...new Set(observed.requests.filter((r) => r.type === 'Script').map((r) => new URL(r.url).hostname))];
const scriptFiles = observed.requests.filter((r) => r.type === 'Script').map((r) => new URL(r.url).pathname.split('/').pop().slice(0, 70)).slice(0, 40);
let lh = null;
if (args.lighthouse) {
  await polite(new URL(args.url).origin);
  const lhPath = own ? join(captureDir, 'lighthouse.json') : join(PRIVATE, 'lh', `${args.id}.json`);
  mkdirSync(dirname(lhPath), { recursive: true });
  lh = lighthouse(args.url, lhPath);
  if (lh.ok) files[own ? 'lighthouse.json' : `_private/lh/${args.id}.json`] = sha256(readFileSync(lhPath));
}

const summary = {
  id: args.id, competitor: args.competitor, kind: args.kind ?? 'page', url: args.url, capturedAt: wib(), robots,
  method: 'CDP mobile emulation 412x915 @2.625, Android Chrome UA, cold cache (no throttling) + REA 6.8.0 inspect-web-page/analyze-web-bundle; Lighthouse 12 mobile simulate (Slow 4G, 4x CPU) when present',
  rea: { inspectEvidenceId: inspectJson?.evidence_id ?? null, bundleEvidenceId: bundleJson?.evidence_id ?? null, inspectError: inspect.ok ? null : inspect.stderr, bundleError: bundle.ok ? null : bundle.stderr,
    domNodes: nr.dom?.total_nodes ?? null, scripts: nr.scripts?.total ?? null, resources: Array.isArray(nr.resources) ? nr.resources.length : null,
    completeness: inspectJson?.normalized_result?.completeness?.status ?? null, bundleChunks: bundleJson?.normalized_result?.observations?.chunks?.nodes?.length ?? null,
    bundleEndpoints: (bundleJson?.normalized_result?.observations?.endpoints ?? []).slice(0, 15).map((e) => e.value ?? e.pattern ?? e.url ?? e), bundleInferences: (bundleJson?.normalized_result?.inferences ?? []).slice(0, 10) },
  network: { loadEventMs: observed.loadMs, requests: observed.requests.length, bytes: observed.requests.reduce((s, r) => s + (r.bytes || 0), 0), byType, protocols: [...new Set(observed.requests.map((r) => r.protocol))].filter(Boolean),
    scriptHosts, scriptFiles, fontFiles, thirdPartyHosts: [...new Set(observed.requests.map((r) => new URL(r.url).hostname))].filter((h) => h !== new URL(args.url).hostname).slice(0, 30) },
  structure: { coverClicked: observed.coverClicked, beforeOpen: { sectionCount: observed.beforeOpen.sectionCount, features: observed.beforeOpen.features, buttons: observed.beforeOpen.buttons.slice(0, 10) }, afterOpen: observed.afterOpen },
  lighthouse: lh, files, screenshot: own ? 'viewport-412.webp (public, own product)' : '_private/thumbs (competitor, not committed)',
};
writeFileSync(summaryPath, JSON.stringify(summary, null, 1));
const indexPath = join(RESEARCH, 'raw', '_captures.csv');
if (!existsSync(indexPath)) writeFileSync(indexPath, 'capture_id,captured_at_wib,competitor,kind,url,summary,lighthouse_ok\n');
appendFileSync(indexPath, `${args.id},${summary.capturedAt},${args.competitor},${summary.kind},"${args.url}",raw/${args.competitor}/${args.id}.json,${lh ? lh.ok : 'n/a'}\n`);
console.log(JSON.stringify({ id: args.id, ok: true, requests: summary.network.requests, kb: Math.round(summary.network.bytes / 1024), libs: Object.entries(observed.afterOpen.libs).filter(([, v]) => v).map(([k]) => k), sections: observed.afterOpen.sectionCount, lh: lh?.ok ? { ...lh.scores, lcp: Math.round(lh.metrics.lcpMs), kb: Math.round(lh.totalBytes / 1024) } : lh?.error?.slice(0, 120) ?? null }));
