<!-- SUMMARY (first 7 lines — greppable) -->
# _evidence-index.md — every evidence ID cited in this research
> WHAT: ID scheme + index of captures (C-), HTTP observations (H-), probes (P-), secondary sources (S-). Claims elsewhere cite these IDs.
> STATUS: ACTIVE (append-only)
> OWNER: Oracle (research)
> DEPS: raw/_captures.csv (machine index of C- IDs), _rea-playbook.md
> GREP: evidence, capture, observed, source, C-, H-, P-, S-
> UPDATED: 2026-10-29

## ID scheme
| Prefix | Meaning | Where the artefact lives |
|---|---|---|
| `C-<COMP>-NNN` | Browser capture by `capture.mjs` (REA inspect + bundle, CDP structure pass, optional Lighthouse) | `raw/<competitor>/<id>.json` (summary, no copy/PII); `_private/rea|lh|thumbs/` for competitors; `raw/invitesion/<id>/` for our own pages |
| `H-<COMP>-NNN` | Single HTTP observation (curl headers/status/body grep) | Described here with command and result |
| `P-<COMP>-NNN` | Code/DB probe on our own instance | Described here |
| `S-<COMP>-NNN` | Secondary source (store listing, pricing page read, article, search result) | URL + access date here or in the dossier |
Tags used with IDs: [OBSERVED] [CLAIMED] [ESTIMATE] [INFERRED] [UNKNOWN] (rules in `_rea-playbook.md` §5).

Competitor codes: WEV Wevitation · (more added in Phase 2).

## Invitesion (own instance, production build of 22ed99e, TZ=UTC, 2026-10-29 WIB)
| ID | When (WIB) | What | Result |
|---|---|---|---|
| C-INV-001 | 05:33 | Guest page `/i/budi-sari/budi-hartono` (ivory, WIB events) | LH mobile: Perf 94 / A11y 96 / BP 93 / SEO 60; LCP 2.60 s, TBT 186 ms, CLS 0; 19 req / 323 KB; 11 contrast failures |
| C-INV-002 | 05:34 | Guest page `/i/dimas-laras-makassar/nama-panjang` (gold-noir, WITA, 80-char name) | Perf 95; LCP 2.45 s; 16 contrast failures (1.64:1 on cards) |
| C-INV-003 | 05:35 | Template preview `/templates/eternal-ivory` | Perf 75; LCP 4.33 s; TBT 411 ms; 26 req / 356 KB |
| C-INV-004 | 05:37 | Marketing home `/` | Perf 88; LCP 3.61 s; TBT 130 ms; 62 req / 413 KB |
| H-INV-001 | 05:28 | `curl -D -` guest page headers | `Cache-Control: private, no-cache, no-store…`, `set-cookie: locale=id`, `x-nextjs-postponed: 1`, CSP report-only with nonce |
| H-INV-002 | 05:28 | Time strings in guest HTML | Akad 08:00+07 → "01.00 WIB"; resepsi 11:00–14:00+07 → "04.00 WIB – 07.00 WIB"; WITA 19:00+08 → "11.00 WIB" |
| H-INV-003 | 05:28 | Hostile guest name page | 0 raw `<script>alert`; name HTML-escaped (`&lt;img src=x onerror=alert(1)&gt;`) |
| H-INV-004 | 05:38 | `curl` of `cdn.jsdelivr.net/npm/@clerk/clerk-js@6/dist/clerk.browser.js` (the script our guest page requests) | 325,247 B raw; 70,709 B brotli |
| H-INV-005 | 05:30 | Browser-style request with `pk_test_` build | `307` → `…clerk.accounts.dev/v1/client/handshake`, `x-clerk-auth-reason: dev-browser-missing` |
| H-INV-006 | 05:45 | Unknown guest slug `/i/budi-sari/siti-aminah` | HTTP 200, streamed "Halaman tidak ditemukan", `robots: noindex` (soft 404) |
| P-INV-001 | 05:43 | `detailConfigSchema.safeParse(templates.default_config)` for every row | 64/64 fail, `unrecognized_keys: art` |

## Competitors
| ID | When (WIB) | Competitor | Kind | URL | Notes |
|---|---|---|---|---|---|
| C-WEV-001 | 05:21 | Wevitation | marketing | https://wevitation.com/ | Pipeline smoke test (jQuery/Bootstrap/Owl, Cloudflare Rocket Loader, GTM); 60 req / 903 KB |
