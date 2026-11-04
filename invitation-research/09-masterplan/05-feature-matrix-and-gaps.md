<!-- SUMMARY (first 7 lines — greppable) -->
# 05-feature-matrix-and-gaps.md — comparison, gap analysis and upgrade map (summary + links)
> WHAT: The masterplan view of `../05-feature-matrix/` and `../06-gap-analysis/`: what we compare, the headline gaps and leads, and how they become backlog items.
> STATUS: Verified s10 (2026-11-04; v1 s08); s13 rebuild under D-031. Counts re-checked with `build-matrix.py --check`, which since s13 also fails on stale outputs (187 rows, **633 / 2,805** competitor cells known in the unconditional population; 643 with the provisional Enviory captures) and the upgrade map (68 gaps: 12 P0, 30 P1, 26 P2). The comparison describes our **pre-P0 baseline**; what P0 changed is in §4.
> OWNER: Research agent
> DEPS: ../05-feature-matrix/{feature-matrix.csv,feature-matrix-long.csv,coverage-summary.md,niche-coverage.md}, ../06-gap-analysis/{upgrade-map.csv,gap-analysis.md,where-we-lead.md,pricing-packaging.md,template-catalog-roadmap.md,must-have-p0.md}, ../01-codebase-audit/revalidation-s10.md
> GREP: feature matrix, gaps, upgrade map, leads, niches, p0 delta
> UPDATED: 2026-11-04

## 1. Supporting files
| Question | File |
|---|---|
| What exactly is compared, and how is each cell justified? | `../05-feature-matrix/features.csv` (criteria), `assessments/*.csv` (evidence), `build-matrix.py` (rules, `--check`) |
| The matrix | `../05-feature-matrix/feature-matrix.csv` (187 rows × Invitesion + 15 Tier-A columns) |
| How much is known per vendor | `../05-feature-matrix/coverage-summary.md` (633 / 2,805 competitor cells known, unconditional; Enviory's 10 measured cells only in its § Sensitivity; Sitemu 0: dossier v1 exists since s12, no curated cells yet) |
| Niches | `../05-feature-matrix/niche-coverage.md` |
| Gaps → modules → priorities | `../06-gap-analysis/upgrade-map.csv` (G-001…G-068) |
| Narrative, leads, pricing, catalog, P0 | `../06-gap-analysis/*.md` |

## 2. Headline comparison
- **Table stakes we lacked at the baseline** (None / Partial while ≥ 6 of 9 Indonesian vendors with evidence are Full): music (9 / 9), cover gate (8), countdown (8), add to calendar (8), gallery depth (7), QR check-in scanner (7), video (6), QR pass (6), OG image (6), correct party size (6), custom music (6). Shipped in s09: countdown, add to calendar, OG image (Latin-script names) and correct party size; music and cover gate are B-009.
- **Defects that undermined trust at the baseline:** preset loss (QA-001), wrong times (QA-002), guessable guest links (QA-003), overwritten allowance (QA-005), preview 404 (QA-011), CSV injection (QA-012), "Rp0" marketing (ADR-O02), unverified scripture (QA-015). All fixed in s09 except QA-003, which is mitigated (real 404; opaque links default off by owner decision).
- **Leads (measured, lab, our pre-P0 build; unconditional population):** Perf 94 vs 28–55; TBT 184 ms vs 416–4,192 (BRN 0); 311 KiB vs 3,084–7,192; a11y 96 vs 77–86; 0 third-party entities vs 2–9. With the provisional Enviory themes (D-031): 2,404–7,192 KiB, a11y up to 100, third parties 1–9; no lead changes direction.
- **Leads (design):** unlimited editing, 12 months, free drafting, SEO + catalog breadth, fictional previews, noindex guest pages, IDR + USD.
- **Business gaps:** reseller and affiliate programmes, local payment breadth, entry price above the mass band, no assisted-setup option.
- **Niches:** breadth exists (27 categories), depth does not (one renderer, captured fields not rendered); INVI.ID's Islamic family-event themes are the closest proof that niche depth sells; memorial is mapped to a celebration form (defect).

## 3. From gaps to backlog
`upgrade-map.csv` priorities feed `06-backlog.md`: 12 P0 (B-001…B-012, `must-have-p0.md` criteria), 30 P1 (B-013…B-041 including B-017a; B-017a and B-041 were added in s09), P2 list. Leads become guardrails: harness budgets (B-012), contrast tokens (B-016), privacy checks, and no revision caps.

## 4. P0 delta since the comparison (`../01-codebase-audit/revalidation-s10.md` §3–§4)
The matrix's "Invitesion today" column stays the baseline (`22ed99e`) so every gap keeps the evidence it was prioritised on. At `7a00a6d`: F-005 countdown and F-012 add-to-calendar went missing → full, F-032 link-preview image partial → full for Latin-script names, F-029 keeps the quote block without religious text; QA-001, QA-002, QA-005, QA-009, QA-011, QA-012, QA-015 and the price copy are fixed, QA-003 is mitigated. The cover gate and music (F-003, F-004, F-072) are unchanged (B-009). The next matrix revision should switch the column to the current build once the guest page is re-measured (RQ-OWN-02).
