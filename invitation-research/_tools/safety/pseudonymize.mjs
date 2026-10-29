// pseudonymize.mjs — one rule set (slug-rules.json) for every tool that writes URLs into committed files.
// Identifying slugs (Katsudoto per-couple subdomains, Enviory full-preview couple slugs) become a stable token
// `rdct-<first 10 hex of sha256(lower-case slug)>`. The token → slug map lives only in the private evidence dir,
// so pages queued under a token stay capturable while the map exists (rebuilt by re-running discovery).
// Same algorithm as pseudonymize-slugs.py (bulk apply / --check, also run by commit-guard.sh).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RULES = JSON.parse(readFileSync(join(HERE, 'slug-rules.json'), 'utf8'));
const TOKEN = new RegExp(`${RULES.tokenPrefix}[0-9a-f]{${RULES.tokenHexLength}}`, 'g');
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const tokenFor = (slug) => RULES.tokenPrefix + createHash('sha256').update(slug.toLowerCase()).digest('hex').slice(0, RULES.tokenHexLength);

export const mapPath = (privateDir) => join(privateDir, 'redaction-map.json');
export const loadMap = (privateDir) => (existsSync(mapPath(privateDir)) ? JSON.parse(readFileSync(mapPath(privateDir), 'utf8')) : {});
export function saveMap(privateDir, map) {
  mkdirSync(privateDir, { recursive: true });
  writeFileSync(mapPath(privateDir), JSON.stringify(map, null, 1));
}

// Rule pass first (records every slug in `map`), then an exact pass for already-known labels that appear outside
// their URL shape (e.g. URL-encoded inside another URL).
export function pseudonymizeText(text, map = {}) {
  let out = text;
  for (const rule of RULES.rules) {
    out = out.replace(new RegExp(rule.pattern, 'gi'), (slug) => {
      const token = tokenFor(slug);
      map[token] ??= { label: slug.toLowerCase(), rule: rule.id };
      return token;
    });
  }
  for (const [token, { label }] of Object.entries(map)) {
    if (label.length < RULES.exactLabelMinLength) continue;
    out = out.replace(new RegExp(`(?<![A-Za-z0-9-])${escapeRegExp(label)}(?![A-Za-z0-9-])`, 'gi'), token);
  }
  return out;
}

export function resolveTokens(text, map) {
  return text.replace(TOKEN, (token) => {
    if (!map[token]) throw new Error(`unknown redaction token ${token}: rebuild the private map by re-running discovery (_tools/discovery/discover-demos.mjs)`);
    return map[token].label;
  });
}
