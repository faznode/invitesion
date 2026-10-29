// node --test invitation-research/_tools/capture/robots.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { robotsVerdict } from './robots.mjs';

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

test('empty Disallow allows everything', () => {
  assert.equal(robotsVerdict('User-agent: *\nDisallow:\n', '/anything').allowed, true);
});
