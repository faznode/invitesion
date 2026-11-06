<!-- SUMMARY (first 7 lines — greppable) -->
# 00-README.md — Invitesion masterplan: index, reading order, status, evidence rules
> WHAT: Entry point to the 14 masterplan chapters (00–13): what each answers, how confident it is, where its evidence lives, and whether the plan is complete.
> STATUS: **Verified s10 (2026-11-04), completion OPEN.** Every chapter was checked against code at `7a00a6d`, the evidence index and the s10 research; the required criteria listed under "Completion status" remain blocked or partial (`../_handoff/acceptance-matrix.md` §9). v1 was session 09 (baseline `64678cf`). Implementation progress: `../_handoff/IMPLEMENTATION-LOG.md`. **s23r status note (2026-11-06):** the product has moved past the code these chapters describe; "Implementation since the plan" below maps the backlog to the s23r code. The chapter bodies were not rewritten and still describe `7a00a6d` unless they say otherwise. Not FINAL: the open criteria below remain open.
> OWNER: Research agent (Architect role)
> DEPS: every file in this folder; ../_evidence-index.md; ../_handoff/acceptance-matrix.md; ../_handoff/LATEST.md
> GREP: masterplan, index, reading order, chapters, confidence, evidence classes, completion
> UPDATED: 2026-11-04

## Completion status
The masterplan is **verified but not complete**. Open required criteria, each with its unblock path in the acceptance matrix:
- **RQ-COMP-02** — no longer blocked: Sitemu (Tier A rank 10) has a v1 dossier since s12 (level C), read after the robots applicability audit replaced D-026 with D-030 (verified s13). Q-O08 keeps only a residual (Canva, undocumented legacy-name mapping).
- **RQ-DEMO-01 BLOCKED** — strict Wave 1 (≥ 3 valid demos for each of the top-8 Indonesian competitors) is **4 / 8 unconditional** (5 / 8 if the provisional Enviory captures are admitted, D-031 / Q-O09): Indoinvite, PALEO and Satu Momen have no safely usable public demo. ADR-W1 let planning proceed with reduced confidence; it is not that evidence.
- **RQ-COMP-04 / RQ-COMP-05 PARTIAL** — 13 of 21 Tier-B one-pagers are substantive (s12; Sonett's rendered read is still movable). Every Tier-A dossier's §10 now names its public-review source (s14): paraphrased themes for Wevitation, Indoinvite, PALEO and Partiful (the reviews each store listing shows first, not a representative sample); for the other 11 the checked sources were unreadable or absent (no store link, a client-side shell, a 403, Trustpilot restricted under D-030); forum and blog sources are not yet searched.
- **RQ-OWN-02 VERIFIED (s23r)** — `22ed99e`, `9bbd813` (= `0b5eb1b`) and the s23r tree on one host, interleaved, 6 Lighthouse runs each: the s23r page paints ≈ 0.67–0.82 s earlier and transfers ≈ 67–69 KB less than both older builds; LCP, TBT and score not established (`../04-template-benchmarks/own-builds/own-build-comparison-s23r.md`). Own-vs-competitor tables in the chapters still describe `22ed99e`.
- **RQ-BENCH-05 PARTIAL** — only the 412×915 cold load was measured; 360×800, 390×844, reduced motion, in-app browsers, audio and INP are unresolved.
- **RQ-MP-06 / RQ-MP-15** — no longer partial: s12 wrote acceptance, verification and rollback for the remaining 26 P1 and 26 P2 items, s13 added rollout, and the s14 table scan found every cell filled.
- Independent Guardian review (RQ-VER-03) has not happened; its scope is in `../_handoff/review-request-s14.md`. Owner decision ADR-O09 authorizes self-review, labelled as such; it is not that review.

## Implementation since the plan (s23r status note)
Implementation proceeds alongside the open research (ADR-O08). Current code: the s23r working tree on `05235da` (typecheck 0, 296 / 296 tests). Per item: `../_handoff/IMPLEMENTATION-LOG.md`.
| Backlog item | State at s23r | Where |
|---|---|---|
| B-001…B-008, B-010, B-017a, content contract | Shipped | IMPLEMENTATION-LOG (s09–s11) |
| B-011 opaque guest links | Shipped behind `FLAG_OPAQUE_GUEST_LINKS`, **off** by default | `lib/flags.ts` |
| B-014 render cost | Step 1 shipped; step 2 (cached shell) evaluated and not shipped; the CPU target is not met | D-039 |
| B-015 no Clerk on guest pages | Shipped (E-042); signed-in acceptance needs real keys (EXT) | E-042 |
| B-016 palettes | Tokens and photo bound shipped; rendered sweep has 3 INCOMPLETE pages (legacy headline over a cover) | `../_handoff/contrast-sweep-20261104-s16.md` |
| B-012 × B-030 harness on product pages | Family byte budgets (E-044), programme fixture and relative figure (E-049), cover fold, design acceptance | E-044, E-049, family review §13–§14 |
| B-027 RSVP | "Maybe", custom questions, an answer per event, invite-only events (flags on) | D-034–D-037 |
| B-029 corporate and ceremonies | Programme, organiser mark, ceremony profiles; corporate covers (E-048), 7 phone cases open (S23r-P1) | E-048 |
| B-030 design families | Four families, opt-in per invitation; the classic layout stays the default | family review |
| Person and children's photos | Person photos (D-038); children's photos behind an access contract with a byte-verified migration (D-040); owner read with real keys EXT | E-039, E-047 |
| B-009 cover gate with music | Not started (music is stored, not rendered) | 06-backlog |
| RQ-OWN-02 own build vs baseline | Measured on one host (s23r): FCP 950 vs 1,624 / 1,772 ms, transfer −67 / −69 KB against `22ed99e` / `9bbd813`; LCP not established | `../04-template-benchmarks/own-builds/` |

## Reading order (verified s10)
1. `01-executive-summary.md` — the decision in two pages, in English and Bahasa Indonesia.
2. `02-evidence-coverage.md` — what the evidence can and cannot carry (read before trusting any number).
3. `04-current-state.md` — the product today, baseline vs the P0 already shipped.
4. `06-backlog.md` — what to build next (remaining P0 and the next-phase P1 with full chains).
5. `08-template-system-and-harness.md` and `09-backend-and-frontend-architecture.md` — the template contract and the measured stack verdict.
6. The rest as needed; `../_handoff/acceptance-matrix.md` for the per-requirement verification.

| # | Chapter | Answers | Status (s10) | Confidence |
|---|---|---|---|---|
| 00 | this file | where things are, completion status | verified | — |
| 01 | `01-executive-summary.md` | thesis, top decisions, 90-day plan (EN + ID) | verified | medium (planning under ADR-W1, not literal Wave 1) |
| 02 | `02-evidence-coverage.md` | what the evidence covers, gates, exclusions, assumptions, gaps | verified | high on what is missing |
| 03 | `03-market-and-competitors.md` | landscape, 15 Tier-A profiles (Sitemu v1 since s12), Tier-B summary, insights | verified (s13 reconciled) | medium; level-C competitors rest on public claims; Enviory guest-page numbers provisional (D-031) |
| 04 | `04-current-state.md` | our product today: strengths, defects, debt, posture; shipped P0 | verified | high for code; own lab numbers are pre-P0 |
| 05 | `05-feature-matrix-and-gaps.md` | 187-row matrix, 68-row upgrade map | verified | medium–high |
| 06 | `06-backlog.md` | prioritized backlog B-001… with P0 ≤ 12 | verified, **open: P1 / P2 chains** | high for P0 and next-phase items |
| 07 | `07-canonical-flows.md` | creator, guest, host, reseller, post-event journeys | verified | medium (proposed flows on mostly claimed competitor evidence beyond the guest page) |
| 08 | `08-template-system-and-harness.md` | template manifest v1, budgets, gates, CLI, dogfood | verified | high for the contract; budgets are internal |
| 09 | `09-backend-and-frontend-architecture.md` | architecture, measured Next.js vs Rust verdict, deployment, operations | verified | medium (lab spike on one host) |
| 10 | `10-data-privacy-security-payments.md` | data, abuse, tenancy, payments, WhatsApp, religious text | verified | medium; legal review pending |
| 11 | `11-pricing-growth-roadmap.md` | packaging, growth, 90-day sequence, KPIs | verified | medium; no traffic or revenue data |
| 12 | `12-decision-log.md` | ADRs (W1, O01…O07, A1) with revisit triggers | verified | per ADR |
| 13 | `13-appendix.md` | evidence and dossier index, skills, glossary | verified | — |

## Evidence rules used throughout
- Claim classes: **OBSERVED** (we saw it: code, capture, page read), **CLAIMED** (a vendor or source says so), **INFERRED** (reasoned from observed facts), **ESTIMATE** (a computed range with stated inputs), **ASSUMPTION** (a working premise with a revisit trigger), **UNKNOWN**.
- IDs: `S-` sources, `C-` captures (`C-INV-0xx` = our Invitesion, `C-INV-1xx` = INVI.ID), `D-` decisions, `F-` our features, `FM-` matrix rows, `G-` gaps, `QA-` audit findings, `M-` modules, `B-` backlog items, `E-` implementation entries, `ADR-` decisions in chapter 12, `RQ-` requirements in the acceptance matrix.
- Benchmarks honour `../04-template-benchmarks/benchmark-exclusions.csv`; Lighthouse cold-load and post-visit CDP numbers are never mixed; TBT is not INP; a click is not an opening and an opening is not audio playback. Competitor tier aggregates (`../04-template-benchmarks/benchmark-pack.md`) support no parity threshold.
- Strict Wave 1 is **not met** (Indoinvite, PALEO and Satu Momen have no eligible guest-page captures). Planning proceeds under **ADR-W1**, a reduced-confidence exception that is not itself evidence.
- Our own guest-page numbers (C-INV-001…005) describe the `22ed99e` build, before the s09 P0 changes.
- No traffic, revenue, latency baseline, price decision or production access is invented (ADR-O06). Unavailable inputs are listed as owner dependencies.
- Reference integrity: `python3 -B invitation-research/_tools/safety/check-references.py` (IDs, links and quoted paths) must exit 0 after any chapter change.
