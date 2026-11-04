<!-- SUMMARY (first 7 lines — greppable) -->
# 02-evidence-coverage.md — evidence quality, confidence, gaps, assumptions, exclusions, addenda
> WHAT: How much each conclusion of this masterplan can be trusted, per competitor and per conclusion type.
> STATUS: Verified s10 (2026-11-04; v2 s09, v1 s08) · evidence cutoff `../_evidence-index.md` session 10 (Tier-B reads, C-VID-107…109) + the s09 spike results · planning gate met through ADR-W1 (not literally) · open research items in §6 and `../_handoff/acceptance-matrix.md`
> OWNER: Research agent
> DEPS: ../_evidence-index.md, ../04-template-benchmarks/{captures-summary.csv,benchmark-exclusions.csv,protocol.md,benchmark-pack.md}, ../03-teardowns/*/dossier.md, ../03-teardowns/tier-b-profiles.md, 12-decision-log.md (ADR-W1)
> GREP: evidence, confidence, coverage, ADR-W1, exclusions, addenda, assumptions
> UPDATED: 2026-11-03

## 1. Gates (reported separately, never merged)
| Gate | Status | Basis |
|---|---|---|
| Strict Wave 1 (dossier + ≥ 3 valid demos for each top-8 Indonesian vendor; 5 international dossiers) | **NOT MET** | IDI, PLO, SMO have 0 valid demos (ADR-W1) |
| Revised demo obligation (≥ 6 valid demos for the top-6 Indonesian vendors where safely available) | **met where available; strict 3 / 6** | WEV 6, VID 6 (s10), ENV 6; IDI, PLO, SMO unavailable (`../04-template-benchmarks/benchmark-pack.md` §6) |
| Profile coverage (≥ 12 Indonesian, ≥ 10 international substantive profiles) | **MET** (15 / 10) | Tier-A dossiers + 11 substantive Tier-B one-pagers (`../03-teardowns/tier-b-profiles.md`) |
| Tier-A dossiers (10 Indonesian + 5 international) | **14 / 15 — Sitemu BLOCKED** | robots.txt AI-agent opt-out honoured (D-026, Q-O08) |
| Planning gate | **MET through ADR-W1** (2026-11-03T16:54Z) — reduced-confidence exception, not evidence | all seven fallback items met (12-decision-log.md) |

## 2. Evidence per competitor
| Code | Dossier level | Valid guest-page captures (cold-load / structure, unique themes) | Other evidence | Confidence for guest-page conclusions |
|---|---|---|---|---|
| WEV Wevitation | A/B (v1 s07) | 6 / 6 | S-WEV-001…005 | medium-high |
| ENV Enviory | A (v2 s07) | 13 captures, 6 themes / 6 | S-ENV-001/002, B-ENV-001/002 | high |
| INV INVI.ID | B (v1 s06) | 6 / 6 | S-INV-001…003 | medium-high (pre-D-016 click) |
| KAT Katsudoto | B (v1 s06) | 6 / 6 | S-KAT-001…004 | medium (opening unverified) |
| IVT Invitato | B (v1 s07) | 4 / 2 | S-IVT-001…005 | medium |
| VID Viding | B (v1.1 s10) | 6 / 6 (C-VID-101…103, 107…109) | S-VID-001…006 | medium-high (opening verified on 2 of 6; C-VID-104…106 excluded, D-022) |
| BRN Barunson | B (v1 s08) | 3 / 3 | S-BRN-001…005 | medium (Korean read by hand) |
| IDI Indoinvite | C (v1 s08) | 0 (catalog captures excluded, D-020) | S-IDI-001…006, D-IDI, Play | **low** |
| SMO Satu Momen | C (v1 s08) | 0 (previews carry personal data, D-008) | S-SMO-001…006 | **low** |
| PLO PALEO | C (v1 s08) | 0 (app-only) | S-PLO-001…003 | **low** |
| PPO / RSV / JOY / PTF | C (v1 s08) | 0 | one or two reads each; RSV pricing behind bot protection, never bypassed | **low** (claims) |
| STM Sitemu | **blocked** (s10) | 0 | D-STM; s10 reads withdrawn unused (D-026) | none |
| Tier-B (21 vendors) | C (s10 one-pagers) | 0 | S-UVR-001 … S-BHP-002 (homepage + ≤ 2 pricing / feature pages each) | low (claims); 11 substantive, 3 thin, 7 blocked or unreadable |

## 3. Confidence per conclusion type
| Conclusion | Confidence | Why |
|---|---|---|
| Our own product (features, defects, architecture) | high | code read at `2c94140`, identical product code at `64678cf`; runtime checks for QA-001, QA-005 (s08 + s09) and QA-003's 200 (s09); revalidated at `7a00a6d` with the shipped P0 separated (`../01-codebase-audit/revalidation-s10.md`) |
| Guest-page performance comparison | medium (lab only) | eligible captures, Lighthouse 12.8.2 mobile; TBT ≠ INP; C-INV-005 omits middleware and clerk-js and predates the s09 P0 changes (our current page is unmeasured) |
| "Typical Indonesian premium / DIY guest page" | medium | 5 of the top 8 measured (ADR-W1); tier aggregates: premium 26 themes / 5 vendors (high), signature 8 / 2 (medium), basic 3 / 1 (low) |
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

## 6. Research items: done in s10 and still open
These were "addenda that do not block planning" until s10. They are required deliverables, so the open ones keep the masterplan's completion status open (`../_handoff/acceptance-matrix.md`).

| Item | State | Where / what would close it |
|---|---|---|
| `_flows/` normalized competitor flows | **done s10** | `../03-teardowns/_flows/` (observed / claimed / proposed) |
| Tier-B one-pagers (21 vendors) | **partial s10**: 11 substantive, 3 thin, 7 blocked or unreadable | `../03-teardowns/tier-b-profiles.md` (RQ-COMP-04) |
| Sample blueprints, tier classification, per-tier aggregates | **done s10** | `../04-template-benchmarks/benchmark-pack.md` |
| Viding to six valid demos | **done s10** (C-VID-107…109) | Viding dossier §4 |
| Sitemu dossier (rank 10) | **blocked** (D-026) | owner answer to Q-O08 (RQ-COMP-02) |
| Public complaints per dossier (§10) | **open**: researched for WEV only | public review sources per vendor (RQ-COMP-05) |
| Protocol-v2 captures (360×800, 390×844, reduced motion) | **open** | `run-batch.sh` with a v2 protocol (RQ-BENCH-05) |
| In-app browsers, audio playback, INP | **open** (external) | device lab or field data |
| Our current guest page after P0 | **open** | new C-INV captures on the current build (RQ-OWN-02) |
| Placeholder demos for IDI / SMO / PLO / PPO / JOY | **external** | only if a vendor publishes one (ADR-W1 revisit trigger) |
| Viding Studio generation | **external** | once `studio.viding.co` serves robots.txt with 2xx / 4xx |
