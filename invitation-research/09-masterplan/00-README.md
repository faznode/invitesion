<!-- SUMMARY (first 7 lines — greppable) -->
# 00-README.md — Invitesion masterplan: index, reading order, status, evidence rules
> WHAT: Entry point to the 14 masterplan chapters (00–13): what each answers, how confident it is, where its evidence lives.
> STATUS: FINAL v1 (session 09, 2026-11-03), baseline `64678cf` (branch `v0/faznode-3b993736`). Implementation progress after this date: `../_handoff/IMPLEMENTATION-LOG.md`.
> OWNER: Research agent (Architect role)
> DEPS: every file in this folder; ../_evidence-index.md; ../_handoff/LATEST.md
> GREP: masterplan, index, reading order, chapters, confidence, evidence classes
> UPDATED: 2026-11-03

## Reading order
1. `01-executive-summary.md` — the decision in two pages, in English and Bahasa Indonesia.
2. `06-backlog.md` — what to build first (P0 = 12 items with acceptance criteria, tests, rollback).
3. `09-backend-and-frontend-architecture.md` — keep or change the stack (measured spike verdict).
4. The rest as needed.

| # | Chapter | Answers | Confidence |
|---|---|---|---|
| 00 | this file | where things are | — |
| 01 | `01-executive-summary.md` | thesis, top decisions, 90-day plan (EN + ID) | medium (planning gate met through ADR-W1, not literally) |
| 02 | `02-evidence-coverage.md` | what the evidence covers, gates, exclusions, assumptions, gaps | high on what is missing |
| 03 | `03-market-and-competitors.md` | landscape, 15 Tier-A profiles, insights | medium; level-C competitors rest on public claims |
| 04 | `04-current-state.md` | our product today: strengths, defects, debt, posture | high (code + own lab captures) |
| 05 | `05-feature-matrix-and-gaps.md` | 187-row matrix, 68-row upgrade map | medium–high |
| 06 | `06-backlog.md` | prioritized backlog B-001… with P0 ≤ 12 | high for P0 (each re-verified) |
| 07 | `07-canonical-flows.md` | creator, guest, host, reseller, post-event journeys | medium (proposed flows) |
| 08 | `08-template-system-and-harness.md` | template manifest v1, budgets, gates, CLI, dogfood | high for the contract; budgets are internal assumptions |
| 09 | `09-backend-and-frontend-architecture.md` | architecture, measured Next.js vs Rust verdict, deployment, operations | medium (lab spike on one host) |
| 10 | `10-data-privacy-security-payments.md` | data, abuse, tenancy, payments, WhatsApp, religious text | medium; legal review pending |
| 11 | `11-pricing-growth-roadmap.md` | packaging, growth, 90-day sequence, KPIs | medium; no traffic or revenue data |
| 12 | `12-decision-log.md` | ADRs (W1, O01…O07, A1) with revisit triggers | per ADR |
| 13 | `13-appendix.md` | evidence and dossier index, skills, glossary | — |

## Evidence rules used throughout
- Claim classes: **OBSERVED** (we saw it: code, capture, page read), **CLAIMED** (a vendor or source says so), **INFERRED** (reasoned from observed facts), **ESTIMATE** (a computed range with stated inputs), **ASSUMPTION** (a working premise with a revisit trigger), **UNKNOWN**.
- IDs: `S-` sources, `C-` captures (`C-INV-0xx` = our Invitesion, `C-INV-1xx` = INVI.ID), `D-` decisions, `F-` our features, `FM-` matrix rows, `G-` gaps, `QA-` audit findings, `M-` modules, `B-` backlog items, `ADR-` decisions in chapter 12.
- Benchmarks honour `../04-template-benchmarks/benchmark-exclusions.csv`; Lighthouse cold-load and post-visit CDP numbers are never mixed; TBT is not INP; a click is not an opening and an opening is not audio playback.
- Strict Wave 1 is **not met** (Indoinvite, PALEO and Satu Momen have no eligible guest-page captures). Planning proceeds under **ADR-W1**, a reduced-confidence exception.
- No traffic, revenue, latency baseline, price decision or production access is invented (ADR-O06). Unavailable inputs are listed as owner dependencies.
