<!-- SUMMARY (first 7 lines — greppable) -->
# 05-feature-matrix-and-gaps.md — comparison, gap analysis and upgrade map (summary + links)
> WHAT: The masterplan view of `../05-feature-matrix/` and `../06-gap-analysis/`: what we compare, the headline gaps and leads, and how they become backlog items.
> STATUS: FINAL v1 (s08, 2026-11-03)
> OWNER: Research agent
> DEPS: ../05-feature-matrix/{feature-matrix.csv,feature-matrix-long.csv,coverage-summary.md,niche-coverage.md}, ../06-gap-analysis/{upgrade-map.csv,gap-analysis.md,where-we-lead.md,pricing-packaging.md,template-catalog-roadmap.md,must-have-p0.md}
> GREP: feature matrix, gaps, upgrade map, leads, niches
> UPDATED: 2026-11-03

## 1. Supporting files
| Question | File |
|---|---|
| What exactly is compared, and how is each cell justified? | `../05-feature-matrix/features.csv` (criteria), `assessments/*.csv` (evidence), `build-matrix.py` (rules, `--check`) |
| The matrix | `../05-feature-matrix/feature-matrix.csv` (187 rows × Invitesion + 15 Tier-A columns) |
| How much is known per vendor | `../05-feature-matrix/coverage-summary.md` (643 / 2,805 competitor cells known; Sitemu 0) |
| Niches | `../05-feature-matrix/niche-coverage.md` |
| Gaps → modules → priorities | `../06-gap-analysis/upgrade-map.csv` (G-001…G-068) |
| Narrative, leads, pricing, catalog, P0 | `../06-gap-analysis/*.md` |

## 2. Headline comparison
- **Table stakes we lack** (None / Partial while ≥ 6 of 9 Indonesian vendors with evidence are Full): music (9 / 9), cover gate (8), countdown (8), add to calendar (8), gallery depth (7), QR check-in scanner (7), video (6), QR pass (6), OG image (6), correct party size (6), custom music (6).
- **Defects that undermine trust:** preset loss (QA-001), wrong times (QA-002), guessable guest links (QA-003), overwritten allowance (QA-005), preview 404 (QA-011), CSV injection (QA-012), "Rp0" marketing (ADR-O02), unverified scripture (QA-015).
- **Leads (measured, lab):** Perf 94 vs 28–55; TBT 184 ms vs 594–4,192 (BRN 0); 311 KiB vs 2,404–7,192; a11y 96 vs 77–86 (ENV 100); 0 third parties vs 1–9.
- **Leads (design):** unlimited editing, 12 months, free drafting, SEO + catalog breadth, fictional previews, noindex guest pages, IDR + USD.
- **Business gaps:** reseller and affiliate programmes, local payment breadth, entry price above the mass band, no assisted-setup option.
- **Niches:** breadth exists (27 categories), depth does not (one renderer, captured fields not rendered); INVI.ID's Islamic family-event themes are the closest proof that niche depth sells; memorial is mapped to a celebration form (defect).

## 3. From gaps to backlog
`upgrade-map.csv` priorities feed `06-backlog.md`: 12 P0 (B-001…B-012, `must-have-p0.md` criteria), 28 P1 (B-013…B-040), P2 list. Leads become guardrails: harness budgets (B-012), contrast tokens (B-016), privacy checks, and no revision caps.
