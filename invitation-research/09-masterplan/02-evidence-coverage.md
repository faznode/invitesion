<!-- SUMMARY (first 7 lines — greppable) -->
# 02-evidence-coverage.md — evidence quality, confidence, gaps, assumptions, exclusions, addenda
> WHAT: How much each conclusion of this masterplan can be trusted, per competitor and per conclusion type.
> STATUS: FINAL v2 (s09, 2026-11-03; v1 s08) · evidence cutoff `../_evidence-index.md` session 08 + the s09 spike results · planning gate met through ADR-W1 (not literally)
> OWNER: Research agent
> DEPS: ../_evidence-index.md, ../04-template-benchmarks/{captures-summary.csv,benchmark-exclusions.csv,protocol.md}, ../03-teardowns/*/dossier.md, 12-decision-log.md (ADR-W1)
> GREP: evidence, confidence, coverage, ADR-W1, exclusions, addenda, assumptions
> UPDATED: 2026-11-03

## 1. Gates (reported separately, never merged)
| Gate | Status | Basis |
|---|---|---|
| Strict Wave 1 (dossier + ≥ 3 valid demos for each top-8 Indonesian vendor; 5 international dossiers) | **NOT MET** | IDI, PLO, SMO have 0 valid demos (ADR-W1) |
| Planning gate | **MET through ADR-W1** (2026-11-03T16:54Z) — reduced-confidence exception | all seven fallback items met (12-decision-log.md) |

## 2. Evidence per competitor
| Code | Dossier level | Valid guest-page captures (cold-load / structure, unique themes) | Other evidence | Confidence for guest-page conclusions |
|---|---|---|---|---|
| WEV Wevitation | A/B (v1 s07) | 6 / 6 | S-WEV-001…005 | medium-high |
| ENV Enviory | A (v2 s07) | 13 captures, 6 themes / 6 | S-ENV-001/002, B-ENV-001/002 | high |
| INV INVI.ID | B (v1 s06) | 6 / 6 | S-INV-001…003 | medium-high (pre-D-016 click) |
| KAT Katsudoto | B (v1 s06) | 6 / 6 | S-KAT-001…004 | medium (opening unverified) |
| IVT Invitato | B (v1 s07) | 4 / 2 | S-IVT-001…005 | medium |
| VID Viding | B (v1 s08) | 3 / 3 | S-VID-001…006 | medium (C-VID-104…106 excluded, D-022) |
| BRN Barunson | B (v1 s08) | 3 / 3 | S-BRN-001…005 | medium (Korean read by hand) |
| IDI Indoinvite | C (v1 s08) | 0 (catalog captures excluded, D-020) | S-IDI-001…006, D-IDI, Play | **low** |
| SMO Satu Momen | C (v1 s08) | 0 (previews carry personal data, D-008) | S-SMO-001…006 | **low** |
| PLO PALEO | C (v1 s08) | 0 (app-only) | S-PLO-001…003 | **low** |
| PPO / RSV / JOY / PTF | C (v1 s08) | 0 | one or two reads each; RSV pricing behind bot protection, never bypassed | **low** (claims) |
| STM Sitemu | none | 0 | D-STM only | none (addendum) |

## 3. Confidence per conclusion type
| Conclusion | Confidence | Why |
|---|---|---|
| Our own product (features, defects, architecture) | high | code read at `2c94140`, identical product code at `64678cf`; runtime checks for QA-001, QA-005 (s08 + s09) and QA-003's 200 (s09) |
| Guest-page performance comparison | medium (lab only) | eligible captures, Lighthouse 12.8.2 mobile; TBT ≠ INP; C-INV-005 omits middleware and clerk-js |
| "Typical Indonesian premium / DIY guest page" | medium | 5 of the top 8 measured (ADR-W1) |
| Mass-market DIY leaders (IDI, PLO) guest pages | low | unmeasured |
| Feature presence for level-C vendors | low-medium | vendor claims and structure-only observations |
| Prices and packaging | high | public pages read on dated visits |
| Market size, traffic, conversion | not established | no analytics access (ADR-O06); Tranco and install bands are coarse estimates |
| Backend capacity (spike) | medium for relative comparison, low for absolute capacity | s09 matched rerun of three arms in two rounds with validity rules (`../08-backend-rust-plan/spike/`); 2-vCPU sandbox, load generator and Postgres on the same host, platform dev server measured idle; fake data; no middleware; s08 Next-only files are historical and not compared; see 09 and ADR-A1 |

## 4. Exclusions honoured (`04-template-benchmarks/benchmark-exclusions.csv`, 26 rows)
Wrappers (C-ENV-101…106, C-INV-101), closed-cover structure rows (incl. C-IVT-102/103), Indoinvite catalog pages (C-IDI-101…107), Viding Studio captures (C-VID-104…106: robots.txt answered 500 → disallow, D-022). `eligibility.py` enforces them for every aggregate; the feature-matrix builder and dossier digests use it.

## 5. Assumptions (each with a revisit trigger)
- Hosting is Vercel functions in `sin1` near the database (ADR-O06) → revisit when the owner states regions.
- Prices observed on one date are current → revisit before any pricing decision (re-read the price pages).
- Keyword-detected features are present when detected; absence is Unknown → per-vendor reading for new rows.
- Vendor demos are placeholders only where verified (D-008, D-019, D-021).

## 6. Addenda (tracked, do not block planning)
Sitemu dossier (rank 10) · Tier-B one-pagers (21 vendors) · `_flows/` normalized competitor flows · protocol-v2 captures (360×800, in-app browsers, reduced-motion runs) · audio-playback evidence · Play-review complaint mining for IDI, PLO, WEV · placeholder demos for IDI / SMO / PLO / PPO / JOY if ever published (ADR-W1 revisit triggers) · Viding Studio once its robots.txt answers 2xx/4xx.
