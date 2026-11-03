<!-- SUMMARY (first 7 lines — greppable) -->
# 13-appendix.md — evidence and dossier index, skills-lock summary, glossary
> WHAT: Where every kind of evidence lives, the curated skills in use, and the terms used across the masterplan.
> STATUS: FINAL v2 (s09, 2026-11-03; v1 s08)
> OWNER: Research agent
> DEPS: ../_evidence-index.md, ../03-teardowns/, ../../SKILLS-LOCK.md, ../README.md
> GREP: appendix, index, glossary, skills, evidence
> UPDATED: 2026-11-03

## 1. Evidence and dossier index
| What | Where |
|---|---|
| Evidence IDs (C-, S-, D-, H-, P-, B-, V-REA-) | `../_evidence-index.md` |
| Capture summaries (no page copy, no PII) | `../raw/<competitor>/C-*.json`; machine index `../raw/_captures.csv`; table `../04-template-benchmarks/captures-summary.csv` |
| Eligibility and exclusions | `../_tools/capture/eligibility.py`, `../04-template-benchmarks/benchmark-exclusions.csv`, protocol `../04-template-benchmarks/protocol.md` v1.2 |
| Dossiers (Tier A, 14 of 15) | `../03-teardowns/{indoinvite,paleo,satumomen,wevitation,viding,enviory,invitato,invi,katsudoto,barunson,paperlesspost,rsvpify,joy,partiful}/dossier.md` (+ `api-observed.md`) |
| Own-product audit | `../01-codebase-audit/` |
| Feature matrix, gaps, ideation | `../05-feature-matrix/`, `../06-gap-analysis/`, `../07-ideation/` |
| Backend plan and spike | `../08-backend-rust-plan/README.md` (plan, verdict); method `../08-backend-rust-plan/spike/README.md`; s09 results `../08-backend-rust-plan/spike/results/s09-20261103-r1/`, `…-r2/` (+ loader-in-`cache()` variant `…-cache/`, `…-cache-r2/`, summarised with `--targets next`); s08 historical Next-only files directly under `spike/results/` |
| Template contract and harness | `08-template-system-and-harness.md`; code `../../tools/template-harness/`; samples `../../templates/_harness-samples/`; verified religious texts `../../content/verified-religious-texts/` |
| Decisions | `12-decision-log.md` (ADR-W1, ADR-O01…O07, ADR-A1), `../_progress.md` (D-001…) |
| Handoff | `../_handoff/LATEST.md`, `../_handoff/sessions/`, `../_handoff/IMPLEMENTATION-LOG.md` |

## 2. Skills-lock summary
`../../SKILLS-LOCK.md` and `../../skills-lock.json` pin the 20 vetted core skills installed in s06 (vetting: `../00-setup/skill-vetting-report.md`). Project skills live under `.agents/skills/invitesion-*` (Claude Code reads them through `.claude/skills/` symlinks); they are project guidance written for this repository, not third-party code, and are listed in `SKILLS-LOCK.md` §Project skills.

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
