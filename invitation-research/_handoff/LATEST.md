# LATEST: single entry point for resuming the Invitesion mission

> Technical progress records are in `sessions/`. The owner keeps agent instructions and raw response transcripts outside this repository. **Current status source: §1 of this file.** Per-requirement status: `acceptance-matrix.md`. Folder layout: `../README.md`. Decisions and phase board: `../_progress.md`. Questions: `../_open-questions.md`. Evidence: `../_evidence-index.md`. Implementation log: `IMPLEMENTATION-LOG.md`.

| | |
|---|---|
| Session | **11** (2026-11-04, from 04:20Z; fresh sandbox) |
| Session file | `sessions/session-11-20261104-0420.md` (previous: `sessions/session-10-20261103-2045.md`, closed in s11 with reconstructed final entries) |
| Baseline | `faznode/invitesion`, branch `v0/faznode-3b993736` @ **`e8736809985551934f7382e24c488da08d2d5a53`** (tree `a5dc55fb8e01ca16283dc3531442019342ff90a3`, owner commit "chore: sync invitesion-h3 research and masterplan snapshot"). Nothing newer on the remote at 04:20Z |
| Workspace | `/vercel/share/v0-project` (persisted; the owner downloads it and pushes manually) is the worktree of the research git `/vercel/share/work/invitesion.git` (`core.worktree` set; local branch of the same name). Lost on a sandbox recycle: everything under `/vercel/share/work` (git dir, toolchain, Postgres data, logs, app snapshot) |
| Sequencing rule (owner, 2026-11-04) | Research / masterplan completion and verification first. After that, backend, frontend and the design harness proceed in the order the dependencies justify, independently or in parallel. The harness is a required deliverable but not a precondition for backend or frontend work. Blocked requirements stay visible and are never waived |
| Never in the repo | Owner prompts, raw agent-response transcripts (`_handoff/briefs/`, `_handoff/logs/` must not be recreated), secrets, private evidence, real customer data |
| Resume protocol | On "continue": read this file and the newest session file → if `/vercel/share/work` is gone, rebuild per §7 → `$GIT_RESEARCH status --short` → state the resume point in 2–3 lines → do §4 in order. Log every finished task in the session file before starting the next |

## 1. Status
| Area | State | Where |
|---|---|---|
| Research / masterplan gate | **Verified, not complete.** Blocked: RQ-COMP-02 (Sitemu, Q-O08), RQ-DEMO-01 (no safe IDI / PLO / SMO demos), RQ-VER-03 (needs a separate reviewer session). Partial and still movable in a sandbox: RQ-MP-06 / RQ-MP-15, RQ-COMP-04, RQ-COMP-05, RQ-BENCH-05 | `acceptance-matrix.md` §9 |
| Enviory evidence | **Policy-contested (D-028).** Its robots.txt disallows the legacy Anthropic tokens. Evidence kept and flagged; numbers reported with and without it; owner decision Q-O08 | `../03-teardowns/enviory/dossier.md` header |
| Discovery / capture robots policy | **Fixed s11 (D-029).** RFC 9309-complete matcher in both tools, redirects checked per hop, offline tests 21 + 10, s10 reads re-checked: 0 newly disallowed | `../_tools/discovery/`, `../_tools/capture/robots.mjs` |
| s10 closeout | Done in s11: §7 rows verified, Rust README encoding repaired, s10 record closed, LATEST rewritten, reference check passes on a fresh clone | `sessions/session-10-…`, `sessions/session-11-…` |
| Template editability | Investigated s11. One shared schema, one renderer, palette-only variation, 10+ editor inputs that never render, and a guestbook moderation toggle that is not enforced. Decision: versioned content contract + render-capability map + trusted design families | `../01-codebase-audit/template-editability-s11.md` |
| P0 | 10 / 12 done s09; B-009 and B-012 open (B-012 = harness budgets on product guest pages) | `../09-masterplan/06-backlog.md`, `IMPLEMENTATION-LOG.md` |
| Product implementation, s11 | **E-012** B-017a atomic view dedupe (DB-verified) · **E-013** B-014 step 1 (one load per request, measured 2 → 1) · **E-014** content contract + lenient read + honest editor notes. typecheck 0, tests 105 / 105, snapshot build OK | `IMPLEMENTATION-LOG.md` |
| Not started yet | B-016, design families + harness taste workflow, B-014 step 2, the movable research rows (§4 item 5) | §4 |

## 2. Running jobs (verify before trusting; processes never survive a recycle)
- Postgres 16.15 on `127.0.0.1:5433` (`/vercel/share/work/pgdata`, db `invitesion`, 64 templates + fixture `budi-sari`).
- App snapshot `/vercel/share/work/app`, production build without middleware (D-012). Start it with `local-stack.sh start` as a background task (port 3100).
- No capture batch is running. Chrome for Testing is not installed in this sandbox yet (`bootstrap-sandbox.sh tools` was cut short): run it as a background task before any Lighthouse, CDP or harness `check` run.

## 3. Done in session 11
- Import and reconciliation; baseline checks (typecheck 0, tests 94 / 94).
- `profile-reads.py` rewrite + `test_profile_reads.py` + `recheck-robots.py`; `robots.mjs` + test aligned (D-029, RQ-TOOL-01).
- Robots re-check of every s10 read and capture origin → D-028 (Enviory), S-STM-006, S-ENV-003; Q-O08 extended.
- Records: acceptance matrix (§7, RQ-TOOL-01, recounts, s11 verdict), s10 closeout, `_progress.md` (D-028, D-029, NEXT), evidence index, dossier notes, `check-references.py` `.clerk` rule, Rust README line 54.
- Template-editability investigation and architecture decision.
- Implementation: E-012 (B-017a, migration `0011`, `scripts/verify-view-dedupe.ts`), E-013 (B-014 step 1), E-014 (`content-contract.ts`, `content-read.ts`, editor notes), `tests/content-contract.test.ts`; docs (`DATABASE_SCHEMA.md`, AGENTS verification list, README).

## 4. NEXT ACTIONS (in order; from the repo root)
Implementation order (s11 decision, reasoning in the session file at 05:20Z):
1. ~~Backend correctness: B-017a, B-014 step 1~~ DONE s11 (E-012, E-013). Remaining backend: B-014 step 2, the cacheable invitation-level shell behind its flag with the cross-guest leakage test and the spike CPU target.
2. ~~Shared content contract~~ DONE s11 (E-014). Next for it: when a design family renders a stored-only field, move it to `rendered` in the same change (the contract test enforces this); decide whether guestbook moderation gets real enforcement (hide until approved + a host approval list) or the toggle leaves the editor.
3. **B-016** contrast-safe palette tokens (WCAG unit test) → foundation for design families.
4. **Design families + harness taste workflow:** structured briefs, family recipes, critique log and project skill; ≥ 3 genuinely different families (one non-wedding) rendered through the product contract; browser renders at 360×800, 390×844, 412×915 and a wide viewport, plus the stress cases (long names, RTL, emoji, hostile input, missing images, sparse content, reduced motion).
5. **Research rows still movable:** RQ-MP-06 / RQ-MP-15 (acceptance, verification and rollback for the remaining P1 / P2, sprint-3 items B-023, B-026, B-029, B-032 first); RQ-COMP-04 (EQX one re-request with explicit `Accept-Encoding`; WNK, BRS, MMO at most two more public pages each) with the fixed tool; RQ-COMP-05 (public review themes, robots first, no names); RQ-BENCH-05 (360 / 390 px + reduced motion batch, Chrome needed).
6. B-015 Clerk scoping only with a plan to verify sign-in on real keys (EXT, P-INV-010).
7. README update for every shipped change; handoff from `$GIT_RESEARCH`.

## 5. Decisions (latest first; full list `../_progress.md`)
- **D-029 (s11)** Robots matching is self-contained and RFC 9309-complete in both tools; AI-agent groups use the same matcher; page redirects are followed by hand with per-hop checks.
- **D-028 (s11)** Enviory is policy-contested under D-026: no new requests, evidence retained and flagged, dual reporting, owner decides via Q-O08.
- **D-027 (s10)** Benchmark tiers come from observed structure; theme-first aggregates; no parity threshold.
- **D-026 (s10)** A robots group for a user-initiated AI agent (including the legacy `Claude-Web` / `anthropic-ai`) that disallows the path is an explicit opt-out.
- Earlier: D-012 own builds without `middleware.ts` while Clerk keys are placeholders; D-016 cover opening = gate before → after, not the click flag; D-022 robots 5xx / 429 / unreachable = disallow; D-023 eligibility computed by `eligibility.py`; ADR-A1 keep Next.js, no Rust service (Rust only behind its revisit triggers).

## 6. Open problems, hazards, unverified (carry forward)
- **Platform side effects:** the host may add its own project `.git`, rewrite `.gitignore` and start a preview `next dev`, whose Clerk keyless mode writes a git-ignored `.clerk` directory at the project root (temporary keys of an unclaimed dev instance). On resume: `$GIT_RESEARCH diff --quiet -- .gitignore || $GIT_RESEARCH checkout HEAD -- .gitignore`; never commit or hand over `.clerk`; build any manifest only from `$GIT_RESEARCH`.
- Aggregates must honour `04-template-benchmarks/benchmark-exclusions.csv` (use the tools, never hand medians). After any bot challenge there is no fallback route: record [UNKNOWN].
- D-008 before every new queue row: a vendor-linked "contoh" page can be a real customer's event; stop at the first personal data.
- Cover detection ≠ click ≠ opening ≠ audio playback; Lighthouse ≠ CDP; TBT ≠ INP; unknown ≠ absent; attempts ≠ eligible captures ≠ unique themes ≠ vendors.
- Own-product captures C-INV-001…005 predate P0 (RQ-OWN-02): re-measure before quoting own numbers as current.
- P-INV-010: the production middleware hangs with placeholder Clerk keys, so it is unknown with real keys. Product checks run in the snapshot without middleware.
- `tsconfig.json` includes `**/*.ts`, so `pnpm typecheck` also covers TypeScript under `invitation-research/`.
- Naming hazard: `C-INV-0xx` = our Invitesion, `C-INV-1xx` = INVI.ID.

## 7. Environment notes
- **Rebuild from a scaffold-only project** (no `invitation-research/` folder): clone the public branch into `/tmp`, move its `.git` to `/vercel/share/work/invitesion.git`, set `core.worktree` to the project, delete the scaffold-only files with the Delete tool (`next.config.mjs`, `pnpm-workspace.yaml`, `next-env.d.ts` and the placeholder images in the scaffold's `/vercel/share/v0-project/public/` folder; the repository has no such folder), then `$GIT_RESEARCH reset --hard`. If the project already holds repo files, never reset: `$GIT_RESEARCH status` shows the session's work. `bootstrap-sandbox.sh git` does the same from a clean clone.
- `CI=true pnpm install --frozen-lockfile` (a plain install aborts without a TTY). Then `bash invitation-research/_tools/ops/local-stack.sh up` (Postgres via dnf, sync, deps, migrate + seed, production build) and `… start` in the background → `http://127.0.0.1:3100/i/budi-sari/<guest>` (guests: budi-hartono, nama-panjang, hostile-name, rtl-name, emoji-name; also `/i/dimas-laras-makassar/<guest>`).
- Research toolchain: `bash invitation-research/_tools/ops/bootstrap-sandbox.sh tools` as a background task (Node 24.22.2, REA 6.8.0, Lighthouse 12.8.2, Chrome for Testing) → `source /vercel/share/work/tools/env.sh`.
- Checks: `pnpm typecheck && pnpm test && pnpm build` (build in the snapshot); `npx tsx scripts/verify-payment.ts` and `npx tsx scripts/verify-view-dedupe.ts` with `POSTGRES_URL` pointing at the disposable database; `python3 -B invitation-research/_tools/safety/check-references.py`; `GIT="$GIT_RESEARCH" bash invitation-research/_tools/safety/commit-guard.sh`; `python3 -B invitation-research/_tools/discovery/test_profile_reads.py`; `node --test invitation-research/_tools/capture/robots.test.mjs`.
- Tool quirks: no `diff` or `cmp` binary (use `git diff --no-index`); run Python with `-B`; `rm -rf` and deleting `.next` are blocked (Delete tool); background work must use the Bash background mode, not `&`.

## 8. Do not redo (finished and verified)
- Skills vetting (20 core), REA verification (re-run `rea-smoke.mjs` only after an REA version change), privacy hygiene fixers (run only if a `--check` fails).
- All captures in `captures-summary.csv` (67), the bounded IDI / SMO / PLO demo search (ADR-W1), discovery for the Tier-A vendors, every S- read in the evidence index.
- The s09 spike result sets (`summarize-spike.py --check` passes) and ADR-A1; the s10 benchmark pack, flow library and chapter reconciliation; the s11 robots re-check.
