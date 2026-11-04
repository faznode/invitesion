/**
 * rendered-contrast.ts — Lighthouse `color-contrast` on rendered guest pages: the rendered half of B-016's acceptance
 * ("passes on a rendered sample of every palette"), complementing the token arithmetic in tests/palette-contrast.test.ts.
 *
 *   source /vercel/share/work/tools/env.sh
 *   npx tsx tools/template-harness/rendered-contrast.ts --out /tmp/contrast \
 *     --url legacy-ivory=http://127.0.0.1:3100/i/review-legacy-p-ivory/budi-hartono [--url label=URL ...]
 *
 * One sequential Lighthouse run per URL (only the `color-contrast` audit, mobile emulation, provided throttling and
 * reduced motion, so entrance animations cannot leave text mid-fade). Writes contrast.json (score, failing nodes with
 * their measured ratio) to --out, which should be outside the repository. Exit 1 when any page has a failing node.
 * Limits: axe (inside Lighthouse) cannot measure text over a background image and leaves it out of the audit, which is
 * why text over cover photos is bounded separately (worstContrastOverImage); hover and focus states are not audited.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Failure = { snippet: string; explanation: string };
type Result = { label: string; url: string; score: number | null; failures: Failure[]; error?: string };

function audit(lighthouse: string, chromePath: string, url: string, reportFile: string): Pick<Result, 'score' | 'failures'> {
  execFileSync(
    lighthouse,
    [
      url,
      '--only-audits=color-contrast',
      '--output=json',
      `--output-path=${reportFile}`,
      '--quiet',
      '--throttling-method=provided',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu --force-prefers-reduced-motion',
    ],
    { env: { ...process.env, CHROME_PATH: chromePath }, stdio: ['ignore', 'ignore', 'pipe'], timeout: 120_000 },
  );
  const report = JSON.parse(readFileSync(reportFile, 'utf8'));
  const contrast = report.audits?.['color-contrast'];
  const items: { node?: { snippet?: string; explanation?: string } }[] = contrast?.details?.items ?? [];
  return {
    score: typeof contrast?.score === 'number' ? contrast.score : null,
    failures: items.map((item) => ({ snippet: item.node?.snippet ?? '', explanation: (item.node?.explanation ?? '').split('\n')[0] })),
  };
}

function main() {
  const args = process.argv.slice(2);
  const valueAfter = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const out = valueAfter('--out') ?? join(process.env.TMPDIR ?? '/tmp', 'invitesion-rendered-contrast');
  const lighthouse = process.env.LH_BIN;
  const chromePath = process.env.CHROME_PATH;
  if (!lighthouse || !chromePath) throw new Error('LH_BIN and CHROME_PATH are required (source /vercel/share/work/tools/env.sh)');
  const targets = args
    .flatMap((arg, index) => (arg === '--url' ? [args[index + 1] ?? ''] : []))
    .map((pair) => ({ label: pair.slice(0, pair.indexOf('=')), url: pair.slice(pair.indexOf('=') + 1) }))
    .filter((target) => target.label && /^https?:\/\//.test(target.url));
  if (!targets.length) throw new Error('Pass at least one --url label=http://…');
  mkdirSync(out, { recursive: true });

  const results: Result[] = [];
  for (const { label, url } of targets) {
    try {
      const { score, failures } = audit(lighthouse, chromePath, url, join(out, `${label}.report.json`));
      results.push({ label, url, score, failures });
      console.log(`${failures.length ? 'FAIL' : score === null ? 'n/a ' : 'ok  '} ${label} score=${score} failing=${failures.length}`);
    } catch (error) {
      results.push({ label, url, score: null, failures: [], error: error instanceof Error ? error.message.split('\n')[0] : String(error) });
      console.log(`ERR  ${label} ${results.at(-1)?.error}`);
    }
  }
  writeFileSync(join(out, 'contrast.json'), `${JSON.stringify(results, null, 2)}\n`);
  process.exitCode = results.some((result) => result.failures.length || result.error) ? 1 : 0;
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
}
