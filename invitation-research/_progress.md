<!-- SUMMARY (first 7 lines — greppable) -->
# _progress.md — resumable checkpoint for the Invitesion research + harness run
> WHAT: Phase status, 10-line summaries, decisions, open questions, changed files. Resume from the last "NEXT" line.
> STATUS: ACTIVE
> OWNER: Oracle (research agent)
> DEPS: _evidence-index.md, _open-questions.md, _rea-playbook.md
> GREP: progress, checkpoint, phase, resume, next
> UPDATED: 2026-10-29

## How to resume
1. Read this file top to bottom, then `_open-questions.md`.
2. Environment (sandbox only): Postgres 16 on `127.0.0.1:5433` (`/vercel/share/work/pgdata`), Chrome CDP on `127.0.0.1:9222`, audit build served by `pnpm start -p 3100` built with a **production-mode** placeholder Clerk key (a `pk_test_` key makes Clerk redirect every browser navigation to a dev handshake; see 01-codebase-audit/quality-audit.md §Run log).
3. Capture tool: `INVITESION_PRIVATE_DIR=/vercel/share/work/invitesion-private node invitation-research/00-setup/scripts/capture.mjs …` (Node 24 at `/vercel/share/work/tools/node-v24.22.2-linux-x64/bin/node`). In this sandbox private evidence lives outside the project (incident Q-D06); in a normal clone it defaults to the git-ignored `invitation-research/_private/`.
4. Git: metadata at `/vercel/share/work/invitesion.git` (`git --git-dir=/vercel/share/work/invitesion.git --work-tree=.`), branch `agent/research-harness`, base `22ed99e`. Never push. **Before every commit:** `GIT="git --git-dir=/vercel/share/work/invitesion.git --work-tree=." bash invitation-research/00-setup/scripts/commit-guard.sh`.

## Phase board
| Phase | Status | Output |
|---|---|---|
| Step 0 — setup, REA, skills, AGENTS.md | DONE 2026-10-29 05:25 WIB | `00-setup/`, `_rea-playbook.md`, `SKILLS-LOCK.md`, `docs/skills-registry.md`, `AGENTS.md`, `CLAUDE.md` |
| 1 — own-codebase audit | DONE 2026-10-29 05:50 WIB | `01-codebase-audit/` (9 docs + seed fixture) |
| 2 — competitor discovery | DONE 2026-10-29 06:20 WIB | `02-competitor-discovery/` (longlist 52, rubric, shortlist, probe data) |
| 3 — teardowns | TODO | `03-teardowns/` |
| 4 — template benchmarks | TODO | `04-template-benchmarks/` |
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

## Decisions log (short; ADRs live in 09-masterplan/decision-log.md)
- D-001 Measure our own pages with the exact competitor protocol (capture.mjs + Lighthouse) on a production build, not `next dev`.
- D-002 Use a production-mode placeholder Clerk key for audit builds so the measured page equals what an anonymous guest receives in production.

## Changed files (this run, cumulative)
See `git status` at the end of each phase; manifest printed in the final handoff.

## NEXT
Phases 3–4: `03-teardowns/scripts/discover-demos.mjs` per Tier A → pick ≥ 6 public demos each → `capture.mjs --open-cover --lighthouse` (sequential, for metric integrity) → dossiers written immediately per competitor → blueprints + tier aggregates.
