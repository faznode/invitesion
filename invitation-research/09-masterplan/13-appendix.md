<!-- SUMMARY (first 7 lines — greppable) -->
# 13-appendix.md — evidence and dossier index, skills-lock summary, glossary
> WHAT: Where every kind of evidence lives, the curated skills in use, and the terms used across the masterplan.
> STATUS: Verified s10 (2026-11-04; v2 s09, v1 s08). Index extended with the s10 artifacts (Tier-B profiles, Sitemu record, flow library, benchmark pack, revalidation, acceptance matrix); the skills section corrected (no project skills exist yet).
> OWNER: Research agent
> DEPS: ../_evidence-index.md, ../03-teardowns/, ../../SKILLS-LOCK.md, ../README.md, ../_handoff/acceptance-matrix.md
> GREP: appendix, index, glossary, skills, evidence
> UPDATED: 2026-11-04

## 1. Evidence and dossier index
| What | Where |
|---|---|
| Evidence IDs (C-, S-, D-, H-, P-, B-, V-REA-) | `../_evidence-index.md` |
| Capture summaries (no page copy, no PII) | `../raw/<competitor>/C-*.json`; machine index `../raw/_captures.csv`; table `../04-template-benchmarks/captures-summary.csv` |
| Eligibility and exclusions | `../_tools/capture/eligibility.py`, `../04-template-benchmarks/benchmark-exclusions.csv`, protocol `../04-template-benchmarks/protocol.md` v1.2 |
| Dossiers (Tier A, 15 of 15) | `../03-teardowns/{indoinvite,paleo,satumomen,wevitation,viding,enviory,invitato,invi,katsudoto,sitemu,barunson,paperlesspost,rsvpify,joy,partiful}/dossier.md` (+ `api-observed.md`); Sitemu v1 since s12 (level C, D-030); Enviory §4 provisional (D-031) |
| Robots applicability audit (s12) | `../02-competitor-discovery/robots-applicability-s12.md` (D-030, D-031; per-origin results `../raw/_discovery/robots-applicability-2026-11-04.jsonl`) |
| Provisional evidence and sensitivity results (s13) | `../04-template-benchmarks/benchmark-provisional.csv` (C-ENV-111…123, Q-O09); `../04-template-benchmarks/sensitivity/`; `../05-feature-matrix/coverage-summary.md` § Sensitivity |
| Tier-B profiles (11 substantive, 3 thin, 7 blocked) | `../03-teardowns/tier-b-profiles.md`; facts `../raw/_discovery/profile-reads-2026-11-03.jsonl`; reader `../_tools/discovery/profile-reads.py` |
| Comparative flow library | `../03-teardowns/_flows/` (creator, guest, host day-of, reseller, post-event; OBSERVED / CLAIMED / PROPOSED) |
| Benchmark pack | `../04-template-benchmarks/benchmark-pack.md` (method, coverage, limits) with `blueprints.csv`, `tiers.csv`, `tier-aggregates.csv`; generator `../_tools/capture/benchmark-pack.py` (`--check`) |
| Own-product audit | `../01-codebase-audit/`; baseline vs shipped P0: `../01-codebase-audit/revalidation-s10.md` |
| Requirements verification | `../_handoff/acceptance-matrix.md` (every required deliverable with status, evidence, check and next action); reference checker `../_tools/safety/check-references.py` |
| Feature matrix, gaps, ideation | `../05-feature-matrix/`, `../06-gap-analysis/`, `../07-ideation/` |
| Backend plan and spike | `../08-backend-rust-plan/README.md` (plan, verdict); method `../08-backend-rust-plan/spike/README.md`; s09 results `../08-backend-rust-plan/spike/results/s09-20261103-r1/`, `…-r2/` (+ loader-in-`cache()` variant `…-cache/`, `…-cache-r2/`, summarised with `--targets next`); s08 historical Next-only files in `../08-backend-rust-plan/spike/results/s08-20261103-historical/` |
| Template contract and harness | `08-template-system-and-harness.md`; code `../../tools/template-harness/`; samples `../../templates/_harness-samples/`; verified religious texts `../../content/verified-religious-texts/` |
| Decisions | `12-decision-log.md` (ADR-W1, ADR-O01…O07, ADR-A1), `../_progress.md` (D-001…) |
| Handoff | `../_handoff/LATEST.md`, `../_handoff/sessions/`, `../_handoff/IMPLEMENTATION-LOG.md` |

## 2. Skills-lock summary
`../../SKILLS-LOCK.md` and `../../skills-lock.json` pin the 20 vetted core skills installed in s06 (vetting: `../00-setup/skill-vetting-report.md`); they live in `.agents/skills/` and Claude Code reads them through symlinks in `.claude/skills/`. **No `invitesion-*` project skill exists yet** (s10 check: no such directory); `SKILLS-LOCK.md` names planned ones such as `invitesion-motion-system` and `invitesion-rust-backend`. They are written in the implementation phase with B-012 / B-030 (RQ-ORIG-01 in `../_handoff/acceptance-matrix.md`).

## 3. Glossary
| Term | Meaning |
|---|---|
| Undangan digital | Web invitation sent as a link, usually per guest |
| Akad / resepsi / ngunduh mantu | Islamic marriage contract / reception / reception at the groom's family |
| Khitanan, aqiqah, walimatussafar, tahlilan | Circumcision celebration; birth thanksgiving; send-off before pilgrimage; prayer gathering for the deceased |
| Titip kado / amplop digital / e-angpao | Physical gift drop-off / digital gift envelope |
| QRIS | Indonesia's national QR payment standard (EMVCo-based) |
| PJP | Payment service provider licensed by Bank Indonesia |
| WIB / WITA / WIT | Western / Central / Eastern Indonesia time (UTC+7 / +8 / +9) |
| Tier A / Tier B | Deep-teardown competitors / one-page profiles |
| Cold-load eligible / structure eligible | Capture usable for Lighthouse aggregates / for page-structure facts (`eligibility.py`) |
| ADR-W1 | Reduced-confidence fallback that met the planning gate without strict Wave 1 |
| Level A / B / C | Dossier evidence level: measured with interaction / measured / marketing and claims only |
| FM-, G-, B-, I- | Feature-matrix row / upgrade-map gap / backlog item / idea |
| C-INV-0xx vs C-INV-1xx | Our Invitesion captures vs INVI.ID captures (naming hazard) |
| OBSERVED / CLAIMED / INFERRED / UNKNOWN / PROPOSED | Seen on a public page or capture / the vendor's own description / reasoned from evidence / not visible under the public-only method / our design target |
| Strict vs qualified coverage | Requirement counted literally vs counted "where safely available", always reported side by side |
| PASS / INCOMPLETE / FAIL | Harness report status: every gate, proof, valid Lighthouse result and snapshot present / a browser check missing or invalid / a gate failed |
| VERIFIED / PARTIAL / MISSING / BLOCKED | Acceptance-matrix status of a required deliverable (`../_handoff/acceptance-matrix.md`) |
| Pre-P0 / P0 | Our product at the audit baseline `22ed99e` / the 12 must-have items, ten of them shipped in s09 |
