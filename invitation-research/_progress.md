<!-- SUMMARY (first 7 lines — greppable) -->
# _progress.md — resumable checkpoint for the Invitesion research + harness run
> WHAT: Phase status, 10-line summaries, decisions, open questions, changed files. Resume from the last "NEXT" line.
> STATUS: ACTIVE
> OWNER: Oracle (research agent)
> DEPS: _evidence-index.md, _open-questions.md, _rea-playbook.md
> GREP: progress, checkpoint, phase, resume, next
> UPDATED: 2026-10-29

## How to resume
0. **Start at `_handoff/LATEST.md`** (session entry point: status, NEXT ACTIONS, environment rebuild via `_tools/ops/bootstrap-sandbox.sh`). Steps 2–4 below describe the session 01–02 sandbox, which no longer exists; they are kept for the Postgres/audit-build recipe.
1. Read this file top to bottom, then `_open-questions.md`.
2. Environment (sandbox only): Postgres 16 on `127.0.0.1:5433` (`/vercel/share/work/pgdata`), Chrome CDP on `127.0.0.1:9222`, audit build served by `pnpm start -p 3100` built with a **production-mode** placeholder Clerk key (a `pk_test_` key makes Clerk redirect every browser navigation to a dev handshake; see 01-codebase-audit/quality-audit.md §Run log).
3. Capture tool: `INVITESION_PRIVATE_DIR=/vercel/share/work/invitesion-private node invitation-research/_tools/capture/capture.mjs …` (Node 24 at `/vercel/share/work/tools/node-v24.22.2-linux-x64/bin/node`). In this sandbox private evidence lives outside the project (incident Q-D06); in a normal clone it defaults to the git-ignored `invitation-research/_private/`.
4. Git: metadata at `/vercel/share/work/invitesion.git` (`git --git-dir=/vercel/share/work/invitesion.git --work-tree=.`), branch `agent/research-harness`, base `22ed99e`. Never push. **Before every commit:** `GIT="git --git-dir=/vercel/share/work/invitesion.git --work-tree=." bash invitation-research/_tools/safety/commit-guard.sh`.

## Phase board
| Phase | Status | Output |
|---|---|---|
| Step 0 — setup, REA, skills, AGENTS.md | DONE 2026-10-29 05:25 WIB; **REA re-verified s06** (PARTIAL → all gaps fixed; Android decompilation UNVERIFIED) | `00-setup/` (+ `rea-verification.md`), `_rea-playbook.md` v2, `SKILLS-LOCK.md`, `docs/skills-registry.md`, `AGENTS.md`, `CLAUDE.md` |
| 1 — own-codebase audit | DONE 2026-10-29 05:50 WIB | `01-codebase-audit/` (9 docs + seed fixture) |
| 2 — competitor discovery | DONE 2026-10-29 06:20 WIB | `02-competitor-discovery/` (longlist 52, rubric, shortlist, probe data) |
| 3 — teardowns | PARTIAL (3/15 dossiers: Enviory v1 (s04), **Katsudoto v1 + INVI v1 (s06)**; dossier template; `_tools/capture/dossier-digest.py` for §4 tables; customer-showcase links dropped) | `03-teardowns/` |
| 4 — template benchmarks | PARTIAL (session 05: queues B/C/D landed → threshold-grade demos **ENV 6, KAT 6, INV 6**, IDI/IVT/VID/WEV 1 each; 7 wrappers kept as evidence; batch A remainder pending; blueprints + tier aggregates not started) | `04-template-benchmarks/` (+ `queues/`) |
| 5 — feature matrix + gaps | TODO | `05-feature-matrix/`, `06-gap-analysis/` |
| 6 — ideation | TODO | `07-ideation/` |
| 7 — harness + skills + dogfood | TODO | `tools/template-harness/`, `.agents/skills/invitesion-*`, `templates/_harness-samples/` |
| 8 — Rust plan + spike | TODO | `08-backend-rust-plan/` |
| 9 — masterplan + handoff | TODO | `09-masterplan/`, zips |

## Step 0 summary (DONE)
1. Cloned `develop` @ `22ed99e` into local branch `agent/research-harness`; git metadata kept outside the hosted project so nothing can be pushed by the platform.
2. Stack: Next.js 15.6-canary App Router, React 19.1, Tailwind 4, Drizzle + Postgres, Clerk, self-built QRIS + Stripe, S3-compatible storage.
3. Baseline: typecheck ✔, 49 tests ✔, build ✘ without env (DB client evaluated at build), ✔ with local Postgres.
4. REA 6.8.0 pinned (CLI; MCP setup not run because it edits global agent config). Playbook + routing table written.
5. 20 third-party skills vetted and installed project-scoped (3 modified for security), registry of optional skills, catalog snapshot saved.
6. Secrets scan of tree + history: 2 low-risk findings, details only in `_private/`.
7. `_private/` git-ignore verified before first write.
8. AGENTS.md extended (English section), CLAUDE.md points to it.
9. Skills that helped: `reverse-engineer-anything` (REA routing), `research` (source discipline).
10. Open: none blocking.

## Phase 1 summary (DONE)
1. 40 modules mapped (M-001…M-040), 102 features inventoried (F-001…F-102), 27 quality findings (QA-001…QA-027).
2. P0 template choice silently discarded: 64/64 `default_config` rows fail the strict schema on `art` → new invitations start as `{}` [P-INV-001].
3. P0 event times rendered in server TZ with hard-coded "WIB" (08:00 → "01.00 WIB"; WITA shown as WIB) [H-INV-002].
4. P0 guest slug = slugified name = only credential → guessable/enumerable; unknown slugs are soft-404 (200) [H-INV-006].
5. Guest page = one generic renderer; templates differ by 4 colours; music/countdown/cover gate/couple profiles/calendar/copy/OG absent; marketing preview promises more than the product renders.
6. Measured (Slow-4G, 4× CPU): guest page Perf 94–95, LCP 2.45–2.60 s, 294–323 KB + 70.7 KB clerk-js in prod; 11–16 contrast failures; dark palettes 1.64:1.
7. Guest page uncacheable (`no-store` + `Set-Cookie`), 13 DB queries per open, no indexes on wishes/analytics.
8. Strong areas to protect: payment core (idempotent, minor units, test vectors), ownership checks, XSS-safe rendering, upload hardening, clean config contract.
9. Niche taxonomy: 27 categories → 6 forms; tahlilan mapped to thanksgiving, khitanan unreachable, no religious/regional wedding variants.
10. Skills that helped: `web-quality-audit` + `core-web-vitals` (measurement checklist), `accessibility-compliance` (contrast triage), `postgresql-table-design` (index review).

## Phase 2 summary (DONE)
1. Longlist: 52 candidates (32 Indonesian, 20 international incl. 8 Asian) with installs, Tranco rank, homepage claims, stack hints, source + date.
2. Size signals: Indoinvite 500K+ installs + Tranco 195K + "1,4 juta undangan" [CLAIMED]; PALEO 500K+ installs; Viding Tranco 306K; Satu Momen 476K; Katsudoto 798K; Wevitation 50K+ installs / 845K.
3. Price band observed on homepages: Rp25k–Rp450k mass market; premium Rp249k–Rp1.3M (Enviory top Rp1.3M); business/reseller tiers to Rp9.999M (Harikita).
4. Stacks: legacy jQuery/Bootstrap/WordPress-Elementor dominate the big DIY players; newer premium players run Next.js/Nuxt; motion via GSAP/AOS/Lottie (Katsudoto, INVI, Sannubari).
5. Rubric: size 30 / catalog 20 / product 20 / innovation 15 / relevance 15.
6. Tier A ID (10): Indoinvite, PALEO, Satu Momen, Wevitation, Viding, Enviory, Invitato, INVI.ID, Katsudoto, Sitemu.
7. Tier A intl (5): Paperless Post, RSVPify, Joy, Partiful, Barunson Mcard (KR).
8. Tier B (21 profiles) incl. Invitee (MY, DuitNow QR = QRIS analogue) and Bridestory (marketplace).
9. Tooling: `probe-homepages.py` fixed to fetch robots.txt with the browser UA (urllib default UA got 403 → false "disallow all").
10. Skill that helped: `research` (claim tagging, source dating).

## Session 03 summary (Phase 3–4 PARTIAL, 2026-10-29 UTC 03:25–)
1. Resumed from branch `v0/faznode-3b993736` @ `4794846`; the session 01–02 local commits and private evidence were gone (sandbox recycled).
2. Branch vs old logs: Phase 2 complete on the branch even though the old todo list said otherwise; discovery existed for 8/15 Tier A.
3. `_tools/ops/bootstrap-sandbox.sh` rebuilds git dir, toolchain and CDP Chrome; validated (Chrome 156.0.8078.4, same build as session 02).
4. Discovery fix: `pratinjau` previews (Enviory) now recognized; PLO is app-only, SMO hides links from headless Chrome (plain fetch works; S-SMO-001).
5. `_tools/discovery/select-demos.py` → `04-template-benchmarks/queues/queue-tier-a.tsv`: 34 official demos (ENV, IDI, INV, IVT, VID, WEV); customer showcase pages excluded (R1).
6. `run-batch.sh` hardened (stdin); discovery for the other Tier A + capture batch launched sequentially in one background chain.
7. New discovery: KAT 61, STM 0, PPO 0 (more pending in the chain).
8. Secrets report regenerated (same 2 LOW items).
9. Handoff system created: `_handoff/LATEST.md` + `_handoff/sessions/` (01–02 reconstructed from logs).
10. Skills that helped: `reverse-engineer-anything` (REA routing in `_rea-playbook.md`), `research` (evidence tagging of S-SMO-001/S-PLO-001).

## Session 04 summary (Phase 3–4 PARTIAL, 2026-10-29 UTC 04:16–)
1. The sandbox restarted at 04:11Z with its files restored but no processes. Batch A had died at 03:53Z after 7/34. The platform had rewritten `.gitignore` again (Q-D10): restored and verified clean (807 tracked files in both gits, commit-guard OK).
2. `bootstrap-sandbox.sh chrome` now clears stale Chromium `Singleton*` locks left by the pre-restart browser.
3. **Methodology finding (Q-D11, protocol §2.1):** Enviory and INVI "demo" links are preview *wrappers*. C-ENV-101…106 measured a shell + iframe, and C-INV-101 measured nothing (Lighthouse NO_FCP). The summarizer now flags `wrapper`; guest pages were re-targeted as queue C (ENV) and queue D (INV, iframe targets read per page, S-INV-001).
4. **Privacy (Q-D12/Q-D13):** 35 Indoinvite customer-showcase links dropped from `discovery-IDI.json` (`redact-discovery.py`, and discovery drops them at collection). Every queued Katsudoto demo verified as a vendor placeholder (S-KAT-002).
5. First dossier: `03-teardowns/enviory/dossier.md` v1 (12 sections, evidence-tagged) + `api-observed.md`; `03-teardowns/_TEMPLATE-dossier.md` holds the prompt's 12-section spec.
6. Enviory facts [OBSERVED S-ENV-001]: 5-day reverse trial after publish; Silver Rp 75k (1 yr) / Gold Rp 125k (forever); reseller Rp 26k–38k per invitation; 18 wedding-only themes; Next.js + Turbopack + Tailwind behind Cloudflare; GTM blocks 2.8–4.4 s per run.
7. New captures: C-IDI-101 (Perf 12, LCP 12.3 s, 7.2 MB), C-IVT-101 (Perf 35, 19.2 MB CDP), C-VID-101 (Perf 50, GSAP + ScrollTrigger, 12 sections), C-WEV-101.
8. Discovery re-runs after the robots fix: PPO allowed (0 demo-shaped links, card pattern needed), JOY allowed (1).
9. Round-robin queue (`queue-tier-a-rr.tsv`) so every competitor gets data early; batch A paused after WEV-101 so queues B → C → D run in one background waiter.
10. Skills that helped: `research` (evidence tagging, dated sources), `web-quality-audit` (reading Lighthouse third-party and blocking data).

## Session 05 summary (repo organisation + prompt map, 2026-10-29 UTC 18:05–)
1. Owner request: read the whole main prompt, map it against the actual repo, organise all files by their nature, archive old unrelated files.
2. Prompt re-read in full and stored verbatim: `_handoff/briefs/original-prompt.md` (+ `continuation-brief.md` with the handoff rules). Requirement-by-requirement status: `_handoff/prompt-map.md`.
3. Research tooling consolidated from five phase folders into `_tools/{ops,safety,discovery,capture,setup}/`; cross-competitor data into `raw/_discovery/` and `raw/_setup/`; capture queues into `04-template-benchmarks/queues/`. Phase folders now hold documents only. Folder map + old→new path table: `README.md` (this folder).
4. Repo root: `REBUILD-HANDOFF-A-Z.md` → `docs/specs/`; navigation screenshots → `docs/worklog/assets/2026-07-18-public-navigation/`; archived (`archive/README.md`): the Next.js-starter boilerplate `README.md` (replaced by a real repo README) and the unused old-brand `tokens.css`. Product code untouched.
5. Verified after the move: 14/14 scripts pass syntax checks, robots tests 6/6, privacy check clean, `select-demos.py` loads, summarizer regenerated `captures-summary.csv` (32 captures); no stale path left outside the append-only session logs.
6. Background captures from s04 registered: C-KAT-102…106, C-ENV-111…116, C-INV-111…114 (`_evidence-index.md` § Session 05). ENV and KAT now meet the ≥ 6-demo bar; a live run of the relocated pipeline then captured C-INV-115/116, so INVI meets it too (3/15 Tier A). Handoff zips regenerated 18:16Z.
7. Found: `01-codebase-audit/style-observations.md` and `template-system.md` cited `tokens.css` values, but that file was never imported → re-verify the platform palette against `app/globals.css` before the style-DNA skill (Phase 7.3).

## Session 06 summary (in progress, 2026-10-29 UTC 20:36–)
1. Fresh sandbox: repo placed from `v0/faznode-3b993736` @ `a5e119c`, research git outside the project, owner briefs saved verbatim (`_handoff/briefs/00…02`). `briefs/01-new-instructions.md` (Steps 0–7) now governs.
2. **Step 0 done:** REA re-verified against the source (tag `rea-agents-6.8.0`): 20 claims → 13 PASS, 5 PARTIAL, 2 FAIL. The serious one: v1 said `capture_browser_scenario` is MCP-only, but the CLI has it, so the pipeline had bypassed REA for the visit. Verdict + fixes: `00-setup/rea-verification.md`; playbook v2 with a verification log.
3. `capture.mjs`: REA drives every visit by default (`--driver rea`, CDP fallback recorded in `driver`). Custom steps remain only where REA has no coverage: animation libraries, text features, mobile/touch emulation, Lighthouse.
4. Smoke tests V-REA-001…007: web PASS (own guest page, viding.co), HAR route PASS after normalisation (REA rejects Playwright's `time: -1` entries), Android static triage PASS on the F-Droid APK, decompilation UNVERIFIED (no JDK 17 + JADX JAR).
5. `_tools/ops/local-stack.sh`: Postgres 16 + production snapshot + seeded fixture for own-page measurement. With placeholder Clerk keys the middleware never answers (P-INV-010), so measurement builds set `middleware.ts` aside (copy only).
6. C-INV-005 (own guest page, REA driver): Perf 93, LCP 2.62 s, CLS 0, consistent with C-INV-001.
7. The platform rewrote `.gitignore` again (Q-D10 recurrence): restored byte-identical from the branch; `.env`, `_private`, `*.pem`, `/storage/` rules active.
8. H-INV-007: the anonymous guest page loads Clerk's browser SDK (root `ClerkProvider`) → masterplan input (guest-page weight).
9. **Step 1 done** (`_handoff/review-20261029.md`): evidence levels A 3 (ENV, INV, KAT) · B 4 (IDI, WEV, VID, IVT) · C 3 (PLO, SMO, STM) · D 5 (all international). **Step 2 done**: 62 identifying slugs pseudonymized in 18 files + discovery/capture hardened (D-015), `.env.example` placeholder, commit guard runs both privacy checks, s05 root reorganisation redone (`archive/`, new root `README.md`, `docs/specs/`, `docs/worklog/assets/`), stale C-IDI-101 row dropped, summary regenerated.
10. Step 3 started: batch A (18 captures) running in the background; first results C-IDI-102, C-IVT-102 (CDP fallback) and C-VID-102 (REA driver after D-014).

## Decisions log (short; ADRs live in 09-masterplan/decision-log.md)
- D-001 Measure our own pages with the exact competitor protocol (capture.mjs + Lighthouse) on a production build, not `next dev`.
- D-002 Use a production-mode placeholder Clerk key for audit builds so the measured page equals what an anonymous guest receives in production.
- D-003 (s03) Queue only vendor-official demo URL shapes; exclude customer showcase pages (R1).
- D-004 (s03) Discovery and Lighthouse captures run strictly sequentially in one chain (metric integrity).
- D-005 (s03) Every session rebuilds the sandbox with `bootstrap-sandbox.sh`; only the project directory persists.
- D-006 (s04) Wrapper captures never feed thresholds; re-target to the iframe's official URL (protocol §2.1).
- D-007 (s04) Customer-showcase links are dropped from discovery data, not hashed (minimisation; never captured anyway).
- D-008 (s04) Placeholder status is verified per queued page, never generalized from one sample.
- D-009 (s05) Files are grouped by nature: phase folders = documents, `_tools/` = scripts, `raw/` = machine data, `queues/` = generated work lists; locations pinned by the prompt or the toolchain never move.
- D-010 (s05) Archive only files that are both unused and not part of the current project (starter README, old-brand tokens); anything a LOCKED router, product code or config cites stays put.
- D-011 (s06) REA drives every capture visit (`capture-browser-scenario`); custom steps only where REA has no coverage, each listed in `_rea-playbook.md` §6.
- D-012 (s06) Own-page measurement builds run without `middleware.ts` while only placeholder Clerk keys exist (P-INV-010); the product code is untouched and the effect is recorded per capture.
- D-013 (s06) The Android procedure is proven on a redistributable APK (F-Droid client); competitor APKs are analysed only if the vendor publishes one, otherwise store-listing metadata.
- D-014 (s06) The optional cover click is performed by the capture's CDP session inside REA's settle window: REA 6.8.0 scenarios have no conditional step, and a failed click aborts the rest of the REA visit (C-IDI-102). **Superseded by D-016.**
- D-016 (s06) Cover control = first-viewport button/link matched by visible text or `aria-label` (or a bare "OPEN"), opened after REA's scenario by a trusted CDP mouse click once it has settled, then scrolled by CDP; `coverClickMethod` + `coverClickLanding` recorded (C-ENV-117…121 document the failure modes, C-ENV-122 the first verified opening).
- D-015 (s06) Identifying URL slugs are pseudonymized (`rdct-` + 10 hex of SHA-256) in every committed file and written that way by discovery and capture; the token map stays private (`00-setup/privacy-hygiene.md`).

## Changed files (this run, cumulative)
See `git status` at the end of each phase; manifest printed in the final handoff.

## NEXT
Authoritative ordered list: `_handoff/LATEST.md` §4. In short (s06): Step 1 review file → Step 2 hygiene → Step 3 batch A in the background (first item also tests the REA cover click) + dossiers → Step 4 ADRs → Step 5 masterplan.
