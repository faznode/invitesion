// W1.1 (AM-001, B-013, D-071): the default RSVP and wish writers count against the Rust writer's limits. Here: the
// defaults and overrides against the shared vectors, the flag, and source-order pins that put the limiter where the Rust
// writer has it (after the link resolves, before the decision and the first write), with mutation controls showing each
// pin fails on its own mutation and only there. The database behaviour (boundaries, shared buckets across a flip,
// closed invitations, flag off) runs through both writers in scripts/verify-rsvp-api.ts and scripts/verify-wishes-api.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { isFlagOn } from '../lib/flags';
import { guestWriteLimits, WRITE_LIMIT_DEFAULTS } from '../lib/rate-limit-keys';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const ACTIONS = 'app/i/[slug]/actions.ts';
const KEYS = 'lib/rate-limit-keys.ts';

type Defaults = Record<string, { perLink: string; perIp: string }>;
const vectorDefaults = (JSON.parse(source('contracts/vectors/roster-rules.json')) as { rateLimit: { defaults: Defaults } }).rateLimit.defaults;

/** An exported server action's text, up to the next top-level declaration or doc comment. */
function actionBody(text: string, name: string): string {
  const start = text.indexOf(`export async function ${name}(`);
  if (start < 0) return '';
  const next = text.slice(start + 1).search(/\n(?:export |async function |function |\/\*\*)/);
  return next < 0 ? text.slice(start) : text.slice(start, start + 1 + next);
}

/** The default writer's branch: everything after the Rust branch closes. */
function defaultBranch(action: string): string {
  const rust = action.indexOf("=== 'rust') {");
  const end = rust < 0 ? -1 : action.indexOf('\n  }\n', rust);
  return end < 0 ? '' : action.slice(end);
}

/** What is wrong with the limiter's place in one default branch; empty when it sits where the Rust writer counts. */
function orderProblems(branch: string, scope: 'rsvp' | 'wish', decision: string, firstWrite: string): string[] {
  const open = branch.indexOf('await openInvitationFor(');
  const limit = branch.indexOf(`await guestWriteRefusal('${scope}', context.guest.id)`);
  const decide = branch.indexOf(decision);
  const write = branch.indexOf(firstWrite);
  const missing = [
    open < 0 && 'no link resolution',
    limit < 0 && 'no limiter call',
    decide < 0 && 'no decision',
    write < 0 && 'no write',
  ].filter((problem): problem is string => Boolean(problem));
  if (missing.length) return missing;
  return [
    !(open < limit) && 'the limiter counts before the link resolves',
    !(limit < decide) && 'the limiter counts after the decision',
    !(limit < write) && 'the limiter counts after the first write',
  ].filter((problem): problem is string => Boolean(problem));
}

/** The limiter step itself: the flag first, then per link, then per address only when the secret keys it. */
function stepProblems(text: string): string[] {
  const start = text.indexOf('async function guestWriteRefusal(');
  if (start < 0) return ['no limiter step'];
  const step = text.slice(start, text.indexOf('\n}\n', start));
  const flag = step.indexOf("if (!isFlagOn('GUEST_WRITE_LIMITS')) return null;");
  const perLink = step.indexOf('await hit(`${scope}:link:${guestId}`, limits.perLink)');
  const perIp = step.indexOf('await hit(ipBucket(secret, scope, key), limits.perIp)');
  const keyed = step.indexOf('if (secret && key) {');
  const missing = [
    flag < 0 && 'no flag check',
    perLink < 0 && 'no per-link hit',
    perIp < 0 && 'no per-address hit',
    keyed < 0 && 'the per-address hit is not conditional on the secret and the address',
  ].filter((problem): problem is string => Boolean(problem));
  if (missing.length) return missing;
  return [
    !(flag < perLink) && 'a hit before the flag check',
    !(perLink < keyed && keyed < perIp) && 'per address before per link',
  ].filter((problem): problem is string => Boolean(problem));
}

/** `WRITE_LIMIT_DEFAULTS` as written in the source, against the shared vectors. */
function defaultsProblems(text: string): string[] {
  return Object.entries(vectorDefaults).flatMap(([path, pair]) => {
    const written = new RegExp(
      `${path}: \\{ perLink: \\{ max: (\\d+), windowSeconds: (\\d+) \\}, perIp: \\{ max: (\\d+), windowSeconds: (\\d+) \\} \\}`,
    ).exec(text);
    if (!written) return [`${path}: not found`];
    const got = `${written[1]}/${written[2]} ${written[3]}/${written[4]}`;
    return got === `${pair.perLink} ${pair.perIp}` ? [] : [`${path}: ${got}`];
  });
}

function pins(actions: string, keys: string) {
  return {
    // W1.2 moved the writes into one transaction (`tx.`), still after the decision.
    rsvp: orderProblems(defaultBranch(actionBody(actions, 'submitRsvp')), 'rsvp', 'decideGuestRsvp(', 'tx.update(guests)'),
    wish: orderProblems(defaultBranch(actionBody(actions, 'submitGuestMessage')), 'wish', 'decideGuestWish(', '.insert(guestMessages)'),
    step: stepProblems(actions),
    defaults: defaultsProblems(keys),
  };
}

const failing = (result: Record<string, string[]>) => Object.keys(result).filter((name) => result[name].length > 0);

test('defaults: the RSVP, wish and registration limits are the shared vectors and the API\'s Limits::default', () => {
  assert.deepEqual(defaultsProblems(source(KEYS)), []);
  assert.deepEqual(guestWriteLimits({}), { rsvp: WRITE_LIMIT_DEFAULTS.rsvp, wish: WRITE_LIMIT_DEFAULTS.wish });
  assert.deepEqual(WRITE_LIMIT_DEFAULTS.rsvp, { perLink: { max: 10, windowSeconds: 600 }, perIp: { max: 60, windowSeconds: 600 } });
  assert.deepEqual(WRITE_LIMIT_DEFAULTS.wish, { perLink: { max: 5, windowSeconds: 600 }, perIp: { max: 60, windowSeconds: 600 } });
  assert.match(source('lib/invitation/roster-next.ts'), /RATE_LIMIT_REGISTRATION_LINK, WRITE_LIMIT_DEFAULTS\.registration\.perLink\)/);
  assert.match(source('lib/invitation/roster-next.ts'), /RATE_LIMIT_REGISTRATION_IP, WRITE_LIMIT_DEFAULTS\.registration\.perIp\)/);
});

test('overrides: the API\'s RATE_LIMIT_* values govern the default writer too; an invalid value falls back to the default', () => {
  const got = guestWriteLimits({ RATE_LIMIT_RSVP_LINK: '3/600', RATE_LIMIT_RSVP_IP: ' 7 / 60 ', RATE_LIMIT_WISH_LINK: '0/600', RATE_LIMIT_WISH_IP: 'many' });
  assert.deepEqual(got.rsvp, { perLink: { max: 3, windowSeconds: 600 }, perIp: { max: 7, windowSeconds: 60 } });
  assert.deepEqual(got.wish, WRITE_LIMIT_DEFAULTS.wish, 'zero and words fall back, as Limit::parse refuses them');
  assert.deepEqual(guestWriteLimits({ RATE_LIMIT_WISH_LINK: '+2/+30' }).wish.perLink, { max: 2, windowSeconds: 30 });
  assert.deepEqual(
    guestWriteLimits({ RATE_LIMIT_REGISTRATION_LINK: '1/1', RATE_LIMIT_REGISTRATION_IP: '1/1' }),
    { rsvp: WRITE_LIMIT_DEFAULTS.rsvp, wish: WRITE_LIMIT_DEFAULTS.wish },
    'the registration variables never reach a guest write',
  );
});

test('the flag: GUEST_WRITE_LIMITS is on by default and FLAG_GUEST_WRITE_LIMITS=off turns it off', () => {
  assert.equal(isFlagOn('GUEST_WRITE_LIMITS', {}), true);
  assert.equal(isFlagOn('GUEST_WRITE_LIMITS', { FLAG_GUEST_WRITE_LIMITS: 'off' }), false);
  assert.equal(isFlagOn('GUEST_WRITE_LIMITS', { FLAG_GUEST_WRITE_LIMITS: '0' }), false);
  const flags = source('lib/flags.ts');
  assert.equal(flags.match(/^ {2}[A-Z_]+: (?:true|false),$/gm)?.length, 30, 'the flag inventory: 30 flags');
  assert.equal(flags.match(/^ {2}[A-Z_]+: true,$/gm)?.length, 17, '17 of them on by default');
});

test('order: both default writers count after the link resolves and before the decision and the first write', () => {
  const result = pins(source(ACTIONS), source(KEYS));
  assert.deepEqual(result, { rsvp: [], wish: [], step: [], defaults: [] });
});

test('order: a refusal redirects with the existing busy notice and the retry seconds before anything is written', () => {
  const actions = source(ACTIONS);
  assert.match(actions, /if \(rsvpRetryAfter !== null\) redirect\(`\$\{guestPath\(slug, guestSlug\)\}\?\$\{rsvpRefusalQuery\(\{ kind: 'busy', retryAfter: rsvpRetryAfter \}\)\}`\);/);
  assert.match(actions, /if \(wishRetryAfter !== null\) redirect\(`\$\{guestPath\(slug, guestSlug\)\}\?\$\{wishQuery\(\{ kind: 'busy', retryAfter: wishRetryAfter \}\)\}`\);/);
  assert.match(actions, /if \(refusal\.kind === 'busy'\) return refusal\.retryAfter \? `rsvp=busy&rsvpr=\$\{refusal\.retryAfter\}` : 'rsvp=busy';/);
  assert.match(actions, /if \(outcome\.kind === 'busy'\) return outcome\.retryAfter \? `wish=busy&wishr=\$\{outcome\.retryAfter\}` : 'wish=busy';/);
});

test('mutation controls: removing one hit or changing one default breaks exactly its own pin', () => {
  const actions = source(ACTIONS);
  const keys = source(KEYS);
  const mutate = (text: string, from: string, to: string) => {
    assert.ok(text.includes(from), `the mutation target exists: ${from}`);
    return text.replace(from, to);
  };
  assert.deepEqual(failing(pins(actions, keys)), []);
  assert.deepEqual(failing(pins(mutate(actions, 'await hit(ipBucket(secret, scope, key), limits.perIp)', 'null'), keys)), ['step']);
  assert.deepEqual(failing(pins(mutate(actions, 'await hit(`${scope}:link:${guestId}`, limits.perLink)', 'null'), keys)), ['step']);
  assert.deepEqual(failing(pins(mutate(actions, "await guestWriteRefusal('rsvp', context.guest.id)", 'null'), keys)), ['rsvp']);
  assert.deepEqual(failing(pins(mutate(actions, "await guestWriteRefusal('wish', context.guest.id)", 'null'), keys)), ['wish']);
  assert.deepEqual(failing(pins(actions, mutate(keys, 'wish: { perLink: { max: 5,', 'wish: { perLink: { max: 6,'))), ['defaults']);
  assert.deepEqual(failing(pins(actions, mutate(keys, 'rsvp: { perLink: { max: 10, windowSeconds: 600 }, perIp: { max: 60,', 'rsvp: { perLink: { max: 10, windowSeconds: 600 }, perIp: { max: 61,'))), ['defaults']);
});
