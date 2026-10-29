<!-- SUMMARY (first 7 lines — greppable) -->
# privacy-hygiene.md — identifying slugs, redaction rules, residual exposure (new instructions Step 2)
> WHAT: Which URL shapes count as identifying, how they are pseudonymized, which committed files were rewritten, the Katsudoto per-couple decision, and what stays exposed in git history.
> STATUS: ACTIVE (s06, 2026-10-29). Enforced by `_tools/safety/commit-guard.sh`
> OWNER: Oracle (research)
> DEPS: _tools/safety/{slug-rules.json,pseudonymize.mjs,pseudonymize-slugs.py,redact-discovery.py,commit-guard.sh}, _tools/discovery/discover-demos.mjs, _tools/capture/capture.mjs, _open-questions.md (Q-O07)
> GREP: privacy, redaction, pseudonym, slug, katsudoto, enviory, hasil, residual exposure, git history
> UPDATED: 2026-10-29

## 1. Rules

| Shape | Example form | Treatment | Why |
|---|---|---|---|
| Vendor showcase / result pages (Indoinvite `/hasil/<id>?contoh=1` and similar) | customer invitations the vendor shows off | **dropped** at collection; only a count is kept (`customerShowcaseDropped`) | may be real customers; never captured (R1), so not stored (R3), D-007 |
| Katsudoto per-couple subdomains | `<names>.katsudoto.id/<n>` | **pseudonymized**: label → `rdct-<10 hex>` | the label may name real people, even when the page is a vendor placeholder |
| Enviory full-preview couple slug | `enviory.com/<slug>?tpl=<theme>` | **pseudonymized** | same |
| Official demo shapes: theme previews (`/preview/*`, `/theme/preview/<n>`, `/tema/<theme>/pratinjau`, `/demo/<theme>`), vendor DUMMY codes (`?code=DUMMY-P0001`), placeholder guest names (`?to=Nama+Tamu`), vendor category pages (`/contoh/undangan-jasa-desain`) | — | **kept** | vendor-labelled samples, no personal data |

Token = `rdct-` + first 10 hex of SHA-256 of the lower-case slug (`_tools/safety/slug-rules.json`). It is stable across tools and sessions, and it is a **pseudonym, not a secret**: anyone holding a candidate name can hash it and compare. The token → slug map lives only in `$INVITESION_PRIVATE_DIR/redaction-map.json`, so pages queued under a token stay capturable (`capture.mjs` resolves tokens before visiting and writes only tokens). If the private directory is lost, re-running discovery rebuilds the map.

Enforcement: `discover-demos.mjs` and `capture.mjs` pseudonymize everything they write into the repo; `select-demos.py` reads the tokenized discovery files; `commit-guard.sh` fails on any leftover showcase link (`redact-discovery.py --check`) or identifying slug (`pseudonymize-slugs.py --check`).

## 2. Katsudoto per-couple subdomains: decision

Katsudoto publishes its demo designs on per-couple subdomains. S-KAT-001/002 verified that each of the 6 queued pages is a vendor placeholder (greeting "Hai Katsudoto", partner handles `@katsudoto`, stock venue, patterned dummy account numbers). Decision (s06): keep C-KAT-101…106 as evidence; tokenize every per-couple label in committed files; queue further Katsudoto pages only when they are linked from the vendor's own design catalog (`katsudoto.id/desain`) and verified per page as placeholders (D-008). Revisit if Katsudoto publishes demos on a vendor-owned path.

## 3. Working tree rewritten on 2026-10-29 (s06)

`pseudonymize-slugs.py`: 18 files, 132 replacements, 62 tokens (61 Katsudoto labels, 1 Enviory slug):
`04-template-benchmarks/captures-summary.csv` (12; then regenerated), `04-template-benchmarks/queues/queue-tier-a-2.tsv` (6), `queue-tier-a-3.tsv` (6), `raw/_captures.csv` (12), `raw/enviory/C-ENV-111…116.json` (2 each), `raw/enviory/discovery-ENV.json` (1), `raw/katsudoto/C-KAT-101…106.json` (3–6 each), `raw/katsudoto/discovery-KAT.json` (61). `_evidence-index.md` already used placeholder forms. All 69 JSON files under `raw/` parse after the rewrite; queued tokens resolve.

Also in Step 2: the password-like `POSTGRES_URL` credential in `.env.example` became `YOUR_DB_USER:YOUR_DB_PASSWORD` (the Stripe test fixture in `tests/` stays, as allowed).

## 4. Residual exposure (git history cannot be rewritten by this agent)

Measured on `v0/faznode-3b993736` (65 commits) with `git grep` over every commit:

| Commit | What it still contains |
|---|---|
| `4794846` (2026-10-28, platform snapshot of s01–s02) | 1 file with the Enviory full-preview slug; 1 file with Indoinvite `/hasil/…?contoh` links |
| `a5e119c` (2026-10-30, owner sync "docs: sync invitation research") | Enviory slug in 10 files and Katsudoto per-couple URLs in 10 files: the 18 files listed in §3 |

Across history: 63 distinct Katsudoto subdomain labels and 22 distinct `/hasil/…` paths (some are generic `<id>` placeholders in docs). The owner can remove them only by rewriting history (for example `git filter-repo` on a fresh clone, then a force-push, which this agent must not do) or by accepting the exposure. Risk assessment: the Katsudoto and Enviory pages were verified as vendor placeholders and the Indoinvite links were never visited, so the residual risk is low. ASSUMPTION - revisit when the owner decides about history rewriting (Q-O07).
