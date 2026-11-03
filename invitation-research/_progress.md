<!-- SUMMARY (first 7 lines — greppable) -->
# _progress.md — resumable checkpoint for the Invitesion research + harness run
> WHAT: Phase status, 10-line summaries, decisions, open questions, changed files. Resume from the last "NEXT" line.
> STATUS: ACTIVE
> OWNER: Oracle (research agent)
> DEPS: _evidence-index.md, _open-questions.md, _rea-playbook.md
> GREP: progress, checkpoint, phase, resume, next
> UPDATED: 2026-11-03

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
| 3 — teardowns | PARTIAL (**14/15 dossiers**; s08: Viding, Indoinvite, Satu Momen, PALEO, Barunson, Paperless Post, Joy, RSVPify, Partiful v1 (all but VID/BRN without guest-page measurement, ADR-W1); planning gate met through ADR-W1 at 16:54Z; Sitemu, `_flows/`, Tier-B one-pagers remain as addenda; Enviory v2, Invitato v1, Wevitation v1 (s07); Katsudoto v1 + INVI v1 (s06); dossier template; `_tools/capture/dossier-digest.py` for §4 tables; customer-showcase links dropped) (s08 recount) | `03-teardowns/` |
| 4 — template benchmarks | PARTIAL (s08 recount after both s07 batches: valid guest-page demos ENV 6 opened/rendered + 7 cold-load only, KAT 6, INV 6, WEV 6, IVT 4/4, VID 3 (104–106 excluded, D-022), **IDI 0** (101–107 are catalog pages, D-020), BRN 3; 64 summaries; `benchmark-exclusions.csv` 26 rows applied by `eligibility.py` (D-023: 44 cold-load / 35 structure eligible; IVT structure 2/4 after the C-IVT-102/103 rows); blueprints + tier aggregates not started) | `04-template-benchmarks/` (+ `queues/`) |
| 5 — feature matrix + gaps | DONE s08 (187 rows × 16 columns; 68-row upgrade map) | `05-feature-matrix/`, `06-gap-analysis/` |
| 6 — ideation | DONE s08 (32 scored ideas, top 10) | `07-ideation/` |
| 7 — harness + skills + dogfood | IN PROGRESS s09 (contract final in `09-masterplan/08-…`; status in `_handoff/IMPLEMENTATION-LOG.md`) | `tools/template-harness/`, `.agents/skills/invitesion-*`, `templates/_harness-samples/` |
| 8 — Rust plan + spike | DONE s09 (matched rerun of three arms, two rounds; **ADR-A1: keep Next.js**); s08 Rust run never finished | `08-backend-rust-plan/` |
| 9 — masterplan + handoff | masterplan 00–13 FINAL v1/v2 s09; P0 implementation in progress; handoff per session | `09-masterplan/`, `_handoff/` |

Paths under `_handoff/briefs/` in older summaries below are provenance only: the owner removed stored prompts and transcripts (`64678cf`) and supplies instructions outside the repository; do not restore or recreate them.

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

## Session 07 summary (2026-11-01 UTC 16:47–17:49, last logged entry; owner-synced as `2c94140`)
1. Owner shared the standalone continuation brief; saved verbatim from raw HTML as `_handoff/briefs/03-standalone-continuation-brief.md`, now the governing instruction (older briefs = provenance).
2. Fresh sandbox again. `v0/faznode-3b993736` is still `0ddd953` (no commit on any branch since 2026-10-29T23:26Z); the `invitesion-cn` mirror behind it is private, so later mirror work is unverifiable. Workspace rebuilt with the s06 pattern (research git outside the project, `checkout-index`, scaffold leftovers deleted); toolchain identical to s06 (REA 6.8.0 still npm latest, Lighthouse 12.8.2, Chrome 156.0.8078.4).
3. Reconciliation (brief §7): `_handoff/review-20261101.md`. Snapshot contents match the brief; Wave 1 not met (captures 6/8, dossiers 2/8, intl 0/5).
4. Privacy defect fixed (**D-017**): 19 committed summaries showed demo-couple names next to the tokenized URLs; `_tools/safety/redact-demo-names.py` + guard check; residual exposure in `a5e119c`/`0ddd953` recorded.
5. Batch A resumed as `queues/queue-tier-a-s07.tsv` (9 missing rows + C-IDI-107 for the tahlilan demo whose C-IDI-104 run lacks Lighthouse): 10/10 `rea` + Lighthouse OK by 17:14. Opening verdict per row from `coverGate` before → after: IVT-104 and WEV-104…106 opened, VID-104…106 undetermined, IDI-105…107 no cover.
6. Dossiers: Enviory **v2** (direct guest pages) and Invitato **v1** (names-free).
7. **D-019** applied after the batch: Invitato template slugs tokenized (10 files, 4 tokens), names redacted (6 fields), `redactDemoNames()` at capture time with 23/23 parity.
8. First international captures: C-BRN-101…103 (Barunson vendor sample previews, 17:30–17:32). Visitor reads S-BRN-001…004, S-PPO-001/002, S-JOY-001, S-RSV-001, S-PTF-001. Process deviation S-RSV-002 (reader fetch after a Cloudflare challenge): content excluded.
9. **D-020:** Indoinvite `/preview/*` = SEO article + 493-theme catalog; catalog previews render a real event → 0 IDI guest-page captures, Wave-1 captures 5/8 (PLO, SMO, IDI), dossiers 3/8, intl 0/5.
10. **D-021:** demo-couple names redacted in every competitor demo capture (Wevitation titles), parity 58/58. **Wevitation dossier v1** (S-WEV-001…005): Wave-1 dossiers 4/8.
11. **D-022** (17:46–17:49Z): robots.txt fetch failures (5xx/429/network) now mean disallow; C-VID-104…106 excluded; `04-template-benchmarks/benchmark-exclusions.csv` created (24 rows). The planned `studio.viding.co` gate probe was cancelled.
12. Skills that helped so far: `research` (evidence levels, claim tagging), `reverse-engineer-anything` (REA routing per the playbook).

## Session 08 summary (2026-11-03 UTC 16:12–≈17:35; owner-synced as `cde56b2`, prompts removed in `64678cf`)
1. Owner shared the local-sandbox continuation brief; saved verbatim from raw HTML as `_handoff/briefs/05-local-sandbox-continuation.md` (top authority with owner messages; brief 03 keeps the mission requirements).
2. Fresh sandbox in a chat not connected to GitHub. Public clone of `v0/faznode-3b993736` @ `2c94140` (= the brief's last verified owner sync; nothing newer); research git outside the project, `checkout-index`, 11 scaffold leftovers deleted → clean; toolchain identical to s06/s07.
3. Checkpoint recomputed: matches brief 05 §7 exactly (71 paths since `0ddd953`, 64/64/64 captures, 5 dossiers, 24 exclusions). Fresh checks: robots 7/7, privacy `--check`s clean, guard OK.
4. Task A: stale active records repaired (`LATEST.md` = current status source, `review-20261101.md` rows `(s08)` + discrepancy 12, phase rows 3–4, NEXT, prompt-map header, README).
5. Task B1–B3 (**D-023**): `eligibility.py` (curated register first, cold-load vs structure, unique themes, theme-first medians), summary schema v2 (Lighthouse vs CDP columns, bytes vs KiB, separate cover facts, `audio_playback=not_measured`), digest with eligible-only medians and masking, 19 offline tests (mutation-checked) incl. a fresh JS/Python redaction parity run on fixtures; guard validates the register. C-IVT-102/103 curated `scope=structure`.
6. Task C: dossier comparisons against C-INV-005 rescoped (lab only, INP not measured, local build without middleware); Enviory request count (CDP 18 → Lighthouse 26) and Katsudoto source mix fixed.
7. Viding dossier v1 (S-VID-001…006; §4 from C-VID-101…103 via the digest; studio host untouched, D-022). Bounded demo search for IDI/SMO/PLO → no safe public demo → **ADR-W1 decided** (D-024).
8. Resume at 16:42Z in the same sandbox: the platform had created its own project `.git` ("Initial commit from v0", same 919 files as the research set, nothing private) and replaced `.gitignore`; its preview dev server started the app and Clerk keyless mode wrote `.clerk/.tmp/keyless.json`. `.gitignore` restored from `2c94140` (ignores `/.clerk/`); research git unaffected.
9. **Indoinvite dossier v1** (S-IDI-001…006 incl. the new `/harga` read; catalog captures for structure only): pricing ladder Rp 0–119k one-time + Rp 400k–4.6M subscriptions, tier gating, done-for-you production, guest-side gift commerce and paid stickers, 50 event/faith SEO pages, Laravel/Xendit stack; **no guest-page numbers** (D-020, ADR-W1). Wave-1 dossiers 6/8, Tier-A 7/15.
10. **Satu Momen v1** (new reads S-SMO-005 `/harga`, S-SMO-006 reseller page: tiers by active period 7 d–1 y from Rp 79k, admin-built from Rp 129k, custom/corporate with strikethrough discounts, credit-based reseller packages, check-in with greeting screen, Laravel) and **PALEO v1** (S-PLO-003 Play listing: 500K+, 4.5, five-step builder, last update Oct 2025, pricing unknown, developer-declared data sharing). Both level C, no guest-page numbers. **Wave-1 Indonesian dossiers 8/8**, Tier-A 9/15; ADR-W1 now waits only on the five international dossiers.
11. **International dossiers v1:** Barunson (level B: 3 captures, median Perf 55 / LCP 23.15 s / TBT 0 / 4,461 KiB, fonts 48–55 % of bytes; Korean features read per page from the template area labels, new read S-BRN-005), Paperless Post, Joy, RSVPify, Partiful (level C from preserved s07 reads; RSV prices stay [UNKNOWN], S-RSV-002 never cited). **Planning gate MET through ADR-W1 (16:54Z); strict Wave 1 NOT MET** (IDI, PLO, SMO 0 valid captures). Tier-A 14/15 (Sitemu remains an addendum).

12. (17:03–≈17:35Z, reconstructed in s09) Feature matrix, gap analysis and ideation done; spike scaffolding written; Next.js runs recorded; the Rust run was launched but never finished; masterplan drafts 02–07, 10, 11, 13 written.

## Session 09 summary (2026-11-03 UTC 18:16–, new independent sandbox; baseline `64678cf`)
1. Public clone of `v0/faznode-3b993736` @ `64678cf` (owner's last verified commit, nothing newer; product code identical to `2c94140`); research git outside the project; scaffold backed up, `checkout-index`, 11 leftovers deleted → clean.
2. Disposable stack (Postgres 16.15, app snapshot, production build without middleware) and spike toolchain pinned to the s08 versions (Rust 1.99.1, k6 v0.54.0).
3. Spike tooling fixed (**D-025**) and a third arm `next-min` added; matched rerun of `next` / `next-min` / `rust` in two rounds (order reversed), every scenario valid. Round 1 read spike 36 / 242 / 1,156 req/s; server CPU per page ≈ 30 / 4 / 0.3 ms; Postgres saturates first under Rust. Writes consistent on every arm; allowance overwrite and view-dedupe race reproduced on every arm.
4. **ADR-A1:** keep Next.js; B-014 (cached guest data, one loader call) is the lever; new B-017a (atomic view dedupe); Rust only behind explicit triggers.
5. Backend plan (`08-backend-rust-plan/README.md`), spike method (`spike/README.md`), masterplan 00, 01 (EN + ID), 08, 09 written; 02, 04, 06 (every P0 complete), 11, 12, 13 reconciled.

## Decisions log (short; ADRs live in 09-masterplan/12-decision-log.md)
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
- D-017 (s07) Couple names displayed on a pseudonymized demo (title, section headings, button labels of a capture summary whose `url` carries an `rdct-` token) are replaced by `[name]`, structural headings kept; `redact-demo-names.py --check` runs in `commit-guard.sh`, and capture applies the same rule at write time. Why: the s06 pass tokenized URLs but left the names beside them.
- D-018 (s07) Follow-up captures always get a NEW id (C-IDI-107 re-captures the tahlilan demo of C-IDI-104, which lacks Lighthouse) and go into a new queue file (`queue-tier-a-s07.tsv`), so failure evidence is never overwritten and no queue is edited while a batch may read it.
- D-019 (s07) Invitato template previews are not synthetic placeholders (designs named after client couples, at least one tied to a real wedding): the couple part of `invitato.net/template-<couple>/` is tokenized (rule `ivt-template-couple`) and their names are redacted (D-017 rule); applied only after the batch stopped. `redactDemoNames()` now also runs at capture time (parity with the Python fixer 23/23).
- D-020 (s07) Indoinvite `/preview/contoh-undangan-online-<event>` pages are SEO article + catalog pages, not demos: C-IDI-101…107 stay as catalog-page evidence but are never used as guest-page benchmarks. Catalog previews (`/s/<account>/undangan/<themeId>?…&contoh=1`) render real events (S-IDI-003) and are never captured; account ids and preview URLs stay out of committed files. IDI joins PLO/SMO in the "no public placeholder demo" question (ADR if unresolved).
- D-021 (s07) Demo-couple names are redacted in **every competitor demo capture**, not only tokenized ones: a page alone cannot prove its couple is a placeholder (Invitato showed vendor demos can be real couples). Generic role words ("Wanita & Pria", "Groom & Bride") are not names and stay as evidence of placeholder content. Same rule at capture time (`capture.mjs`) and in `redact-demo-names.py --check` (guard); parity JS vs Python 58/58. Applied to C-WEV-101…106 (one title each).
- D-022 (s07) Robots fetch outcomes follow RFC 9309: 2xx parse, 4xx (not 429) = no rules, 5xx/429/network failure = assume complete disallow (`robotsStatusVerdict()` in `robots.mjs`, all tools, tested). C-VID-104…106 were captured while `studio.viding.co/robots.txt` answered 500 under the old lenient policy: process deviation; files kept (no personal data) but excluded from medians, quantitative claims and Wave-1 counts (`04-template-benchmarks/benchmark-exclusions.csv`, which now lists every exclusion with its decision). No visits to that host while its robots.txt is unreachable.
- D-023 (s08) Benchmark eligibility is computed, not remembered: `_tools/capture/eligibility.py` applies the curated register (`benchmark-exclusions.csv`, now with an explicit `page_class` column) before any heuristic, separates cold-load (Lighthouse) from structure/interaction eligibility, counts unique themes instead of attempts (median per theme first), keeps Lighthouse cold-load and CDP post-visit measurements in separately named columns (bytes vs KiB explicit), and reports cover detected / click attempted / gate opening / audio playback (never measured) as separate facts. Register errors fail `commit-guard.sh`. Curation on existing evidence: C-IVT-102/103 get `scope=structure` (the s07 Invitato dossier records their closed English covers; the detector could not see them).
- D-024 (s08) **ADR-W1** (`09-masterplan/12-decision-log.md`): the bounded demo search found no safe public demo for Indoinvite, Satu Momen (public previews render personal data, D-008 stop) or PALEO (app-only), so planning proceeds through the reduced-confidence fallback once dossiers exist for all eight Indonesian and five international competitors. Strict Wave 1 stays reported as NOT MET.
- D-025 (s09) Load-spike validity is enforced by the tools, not by the reader: k6 thresholds on the measured operation (checks ≥ 99 %, failures < 1 %), setup requests tagged and excluded, the runner fails on any invalid scenario and verifies the database identity before seeding, the sampler uses per-PID deltas and reports host busy/steal, and a database snapshot after every scenario keeps writes, unique guests, view events and allowances apart. Results of different tool versions or environments are never compared (s08 files stay historical).

## Changed files (this run, cumulative)
See `git status` at the end of each phase; manifest printed in the final handoff.

## NEXT
Authoritative ordered list: `_handoff/LATEST.md` §4. In short (s09): P0 in dependency order (`_handoff/IMPLEMENTATION-LOG.md`) → harness + project skills + three dogfood templates → bounded research addenda (Sitemu dossier, Tier-B profiles, `_flows/`, blueprints, tier aggregates) → manual-push handoff against `64678cf`.
