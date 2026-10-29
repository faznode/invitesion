// Shared robots.txt evaluation for the research tools (capture.mjs, discover-demos.mjs).
// We browse with a generic Android Chrome UA, so only `User-agent: *` groups apply to us. Matching
// follows RFC 9309 / Google: `*` wildcards and a trailing `$` anchor are honoured, the longest
// matching pattern wins, and a tie goes to Allow.
// Policy on top of the standard: we are an AI agent acting for a user, so a site that disallows
// `/` for user-initiated AI agents (ChatGPT-User, Claude-User, Perplexity-User) is treated as
// opted out of automated observation, even though `*` would allow it.

const AI_USER_AGENTS = /^(chatgpt-user|claude-user|perplexity-user)\b/i;

function parseGroups(text) {
  const groups = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    const colon = line.indexOf(':');
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value);
    } else if ((key === 'allow' || key === 'disallow') && current) {
      current.rules.push({ allow: key === 'allow', path: value });
    }
  }
  return groups;
}

function patternToRegex(pattern) {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

/** @returns {{ allowed: boolean, note: string }} */
export function robotsVerdict(text, pathWithQuery) {
  const groups = parseGroups(text);
  const aiOptOut = groups.find(
    (g) => g.agents.some((a) => AI_USER_AGENTS.test(a)) && g.rules.some((r) => !r.allow && r.path === '/'),
  );
  if (aiOptOut) {
    return { allowed: false, note: `AI-agent opt-out (${aiOptOut.agents.filter((a) => AI_USER_AGENTS.test(a)).join(', ')}: Disallow /)` };
  }
  const rules = groups.filter((g) => g.agents.includes('*')).flatMap((g) => g.rules).filter((r) => r.path);
  const match = rules
    .filter((r) => patternToRegex(r.path).test(pathWithQuery))
    .sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow))[0];
  return { allowed: !match || match.allow, note: match ? `${match.allow ? 'Allow' : 'Disallow'}: ${match.path}` : 'no matching rule' };
}
