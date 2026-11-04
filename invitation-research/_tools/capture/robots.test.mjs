// node --test invitation-research/_tools/capture/robots.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { robotsStatusVerdict, robotsUnreachable, robotsVerdict } from './robots.mjs';

test('fetch status: 2xx parses, 4xx allows, 429/5xx and network failures disallow (RFC 9309, D-022)', () => {
  assert.equal(robotsStatusVerdict(200), null);
  assert.equal(robotsStatusVerdict(404).allowed, true);
  assert.equal(robotsStatusVerdict(410).allowed, true);
  assert.equal(robotsStatusVerdict(429).allowed, false);
  assert.equal(robotsStatusVerdict(500).allowed, false);
  assert.equal(robotsStatusVerdict(503).allowed, false);
  assert.equal(robotsUnreachable('TimeoutError').allowed, false);
});

test('wildcard rules no longer swallow every path (session-03 false positive)', () => {
  const txt = 'User-agent: *\nAllow: /\nDisallow: /*?sort=\nDisallow: /account/\n';
  assert.equal(robotsVerdict(txt, '/').allowed, true);
  assert.equal(robotsVerdict(txt, '/demo/serein').allowed, true);
  assert.equal(robotsVerdict(txt, '/cards?sort=new').allowed, false);
  assert.equal(robotsVerdict(txt, '/account/settings').allowed, false);
});

test('only * groups apply; multi-agent groups are kept together', () => {
  const txt = 'User-agent: GPTBot\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin\n';
  assert.equal(robotsVerdict(txt, '/').allowed, true);
  assert.equal(robotsVerdict(txt, '/admin/x').allowed, false);
});

test('a * agent listed next to others still receives the group rules', () => {
  const txt = 'User-agent: *\nUser-agent: Bingbot\nDisallow: /private\n';
  assert.equal(robotsVerdict(txt, '/private/a').allowed, false);
});

test('$ anchor, longest match, tie goes to Allow', () => {
  const txt = 'User-agent: *\nDisallow: /*.pdf$\nDisallow: /tema\nAllow: /tema/\n';
  assert.equal(robotsVerdict(txt, '/file.pdf').allowed, false);
  assert.equal(robotsVerdict(txt, '/file.pdf?x=1').allowed, true);
  assert.equal(robotsVerdict(txt, '/tema/aurelia').allowed, true);
  assert.equal(robotsVerdict(txt, '/tema').allowed, false);
  assert.equal(robotsVerdict('User-agent: *\nDisallow: /x\nAllow: /x\n', '/x').allowed, true);
});

test('explicit opt-out of user-initiated AI agents is honoured', () => {
  const txt = 'User-agent: *\nAllow: /\n\nUser-agent: ChatGPT-User\nUser-agent: Perplexity-User\nDisallow: /\n';
  const v = robotsVerdict(txt, '/');
  assert.equal(v.allowed, false);
  assert.match(v.note, /AI-agent opt-out/);
});

test('legacy Anthropic agent tokens count as an AI-agent opt-out (D-026); training crawlers do not', () => {
  const legacy = 'User-agent: *\nAllow: /\n\nUser-agent: Claude-Web\nDisallow: /\n\nUser-agent: anthropic-ai\nDisallow: /\n';
  const v = robotsVerdict(legacy, '/product');
  assert.equal(v.allowed, false);
  assert.match(v.note, /AI-agent opt-out \(Claude-Web/);
  const trainingOnly = 'User-agent: *\nAllow: /\n\nUser-agent: ClaudeBot\nUser-agent: GPTBot\nDisallow: /\n';
  assert.equal(robotsVerdict(trainingOnly, '/').allowed, true);
});

test('empty Disallow allows everything', () => {
  assert.equal(robotsVerdict('User-agent: *\nDisallow:\n', '/anything').allowed, true);
});
