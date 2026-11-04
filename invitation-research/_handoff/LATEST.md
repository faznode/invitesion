# LATEST: single entry point for resuming the Invitesion mission

> Technical progress records are in `sessions/`. The owner keeps agent instructions and raw response transcripts outside this repository. **Current status source: §1 of this file.** Per-requirement status: `acceptance-matrix.md`. Folder layout: `../README.md`. Decisions and phase board: `../_progress.md`. Questions: `../_open-questions.md`. Evidence: `../_evidence-index.md`. Implementation log: `IMPLEMENTATION-LOG.md`. Independent review scope: `review-request-s14.md`.

| | |
|---|---|
| Session | **14** (2026-11-04, from 14:20Z; fresh sandbox) |
| Session file | `sessions/session-14-20261104-1420.md` (previous: `sessions/session-13-20261104-1213.md`; s12 has no record of its own, its work is reconstructed in the s13 record and confirmed by the s12 log in s14) |
| Baseline | `faznode/invitesion`, branch `v0/faznode-3b993736` @ **`9bbd8132d9e4285130197c6a702aa303a6be682a`** (tree `544565d418a89d15112621b3c6cf33eeaaa03a10`, parent `0b5eb1b`, owner commit "chore: sync invitesion-yb research and viewport snapshot") |
| Workspace | `/vercel/share/v0-project` (persisted; the owner downloads it and pushes manually) is the worktree of the research git `/vercel/share/work/invitesion.git` (`core.worktree` set; local branch of the same name; s14 local commits on top of `9bbd813`). Lost on a sandbox recycle: everything under `/vercel/share/work` (git dir, toolchain, private evidence, logs) |
| Sequencing rule (owner, 2026-11-04) | Research / masterplan completion and verification first. After that gate passes, backend, frontend and the design harness proceed in the order the dependencies justify, independently or in parallel. Blocked requirements stay visible and are never waived |
| Never in the repo | Owner prompts, raw agent-response transcripts (`_handoff/briefs/`, `_handoff/logs/` must not be recreated), secrets, private evidence, real customer data |
| Resume protocol | On "continue": read this file and the newest session file → if `/vercel/share/work` is gone, rebuild per §7 → `$GIT_RESEARCH status --short` → state the resume point in 2–3 lines → do §4 in order. Log every finished task in the session file before starting the next |

## 1. Status
| Area | State | Where |
|---|---|---|
| Research / masterplan gate | **Not passed.** BLOCKED: RQ-DEMO-01 (no safe IDI / PLO / SMO demo, external) and RQ-VER-03 (independent review needs a separate session). PARTIAL: RQ-COMP-04 (SNT rendered read still movable), RQ-COMP-05 (themes for 4 / 15; forums / blogs not yet searched; Trustpilot waits on Q-O08), RQ-OWN-02 (current build measured, not comparable to the baseline). Promoted in s14 from artifacts: RQ-COMP-02, RQ-MP-06, RQ-MP-15 | `acceptance-matrix.md` §9 |
| Measurement pipeline | **Repaired s14.** Summary regenerated (89 captures); build-aware populations (D-033); digest exit status fixed; encoding and reference defects repaired; tests 38 + 22, ten mutants caught | session 14 log, commits `27dab9f`, `0f7362d` |
| Protocol v2 viewport batch (RQ-BENCH-05) | See §2 and the session file: resumed s14 after the capture path was re-verified (C-BRN-201) | `04-template-benchmarks/queues/queue-v2-s13.tsv`, `queue-v2-s14-espresso.tsv` |
| Enviory evidence | Provisional (D-031, Q-O09): excluded from unconditional results, reported in the sensitivity population; no new request to the demo route | `../02-competitor-discovery/robots-applicability-s12.md` §7 |
| Robots policy | D-030 (s12, verified s13): applicability by identity and purpose; legacy Anthropic names stay restricted unless inside a Cloudflare-managed training section. New s14 case for Q-O08: Trustpilot (explicit `Claude-User` group allows `/review/<domain>`, legacy group disallows all; restriction kept) | `../_open-questions.md` Q-O08 |
| Product | Unchanged since `0b5eb1b` (s11 increments E-012…E-014). typecheck 0, tests 105 / 105 in s14 | `IMPLEMENTATION-LOG.md` |
| Implementation phase | **Not started in s14**, because the gate has not passed (see §4 for the order once it does) | §4 |

## 2. Running jobs (verify before trusting; processes never survive a recycle)
- CDP Chrome on `127.0.0.1:9222` (`bootstrap-sandbox.sh chrome`) and the batch `run-batch.sh queue-v2-s13.tsv` were started as background tasks in s14 (log `/tmp/inv-scratch/batch-s14.log`, not persisted). The session file records where the batch stopped. `run-batch.sh` skips every stored ID, so re-running the same queue resumes it; then run `queue-v2-s14-espresso.tsv`.
- No Postgres or local app in s14 (no own capture was needed: C-INV-006…015 are stored).

## 3. Done in session 14
- Import and reconciliation at `9bbd813`; the s12 log (now available) checked against the s13 reconstruction.
- Measurement pipeline: encoding repairs, external Lighthouse path qualified, population audit of every consumer, D-033, digest exit status, regenerated outputs, `lighthouse-environment.csv` first retained (own reports only; competitor reports were never retained).
- Batch resumed after `verify-profiles.mjs` (all channels) and a single real-path capture.
- RQ-COMP-05 passes A–C and §10 of 14 dossiers; Q-O08 Trustpilot case; evidence index (including the s13 batch captures s13 never indexed).
- Records: this file, the acceptance matrix (recomputed), the s14 session record, D-033, `review-request-s14.md`.

## 4. NEXT ACTIONS (in order; from the repo root)
1. **If the batch is unfinished:** rebuild per §7, start CDP Chrome, re-run `run-batch.sh queue-v2-s13.tsv` (resumes), then `queue-v2-s14-espresso.tsv`. Afterwards `summarize-captures.py --strict`, `benchmark-pack.py`, `lighthouse-environment.py`, both test suites, and update `benchmark-pack.md` §7 from `viewport/` (never by hand).
2. **RQ-COMP-04:** Sonett rendered read (one public page, CDP text extraction after robots / D-030; never during a performance batch).
3. **RQ-COMP-05:** one public-review search per vendor for VID, KAT, INV, SMO, IVT, ENV, STM; at most two pages each through `profile-reads.py`; paraphrase without names.
4. **RQ-OWN-02:** interleaved same-host runs of `22ed99e` and the current build (≥ 3 each, benchmarkIndex per run) before any own-build comparison.
5. **RQ-VER-03 (owner):** start a separate Guardian session with `review-request-s14.md`. Owner questions that unblock rows: Q-O08 (Canva, Trustpilot), Q-O09 (Enviory provisional captures).
6. **When the gate passes** (or the owner explicitly authorizes starting despite the open rows), the build order chosen from the dependencies: (a) **B-016** contrast-safe palette tokens with a WCAG unit test, because design families and the harness gates need trusted tokens; (b) **design harness taste workflow + three families** (one non-wedding) rendered through the existing content contract (`lib/invitation/content-contract.ts`, `lib/invitation/content-read.ts`), at 360×800, 390×844, 412×915 and a wide viewport with the stress cases; (c) in parallel with (a)–(b), **backend B-014 step 2** (cacheable invitation-level shell behind a flag, cross-guest leakage test), which shares no files with them; (d) the guestbook moderation decision (enforce or remove the toggle). Rust: no service (ADR-A1) unless a revisit trigger fires.

## 5. Decisions (latest first; full list `../_progress.md`)
- **D-033 (s14)** Our own pages: the product build is part of the measurement population; D-032 amended to re-capture the pilot theme with new IDs.
- **D-032 (s13)** Measurement profiles are separate populations; CDP emulation clear → set → media after REA; each channel verified where it runs.
- **D-031 (s13, from s12)** Enviory's challenged-route captures are provisional (Q-O09); unconditional and sensitivity populations are reported apart.
- **D-030 (s13, from s12)** Robots applicability by identity and purpose (replaces D-026's blanket reading).
- Earlier: D-029 RFC 9309 matcher; D-027 observed-structure tiers; D-022 robots 5xx / 429 / unreachable = disallow; D-012 own builds without middleware while Clerk keys are placeholders; ADR-A1 keep Next.js.

## 6. Open problems, hazards, unverified (carry forward)
- **Platform side effects:** the host may add its own project `.git`, rewrite `.gitignore` and start a preview `next dev` (Clerk keyless mode writes a git-ignored `.clerk`). On resume: `$GIT_RESEARCH diff --quiet -- .gitignore || $GIT_RESEARCH checkout HEAD -- .gitignore`; never commit `.clerk`.
- Host speed: Lighthouse benchmarkIndex varies between sandboxes and between consecutive runs; same-session own runs split into two LCP modes. Never read a cross-session timing change as a product change; record benchmarkIndex and competing load.
- Emulation: protocol v2 verifies the final CDP state, not every intermediate interaction; v1.2 post-REA passes ran at DPR 1 (protocol §2.3). Emulation is never a physical-device or in-app-browser test.
- Naming hazard: `C-INV-0xx` = our Invitesion, `C-INV-1xx` / `2xx` = INVI.ID.
- D-008 before every new queue row: a vendor-linked "contoh" page can be a real customer's event; stop at the first personal data.
- P-INV-010: the production middleware hangs with placeholder Clerk keys; signed-in editor behaviour and real Clerk authentication remain unverified in any sandbox.
- `tsconfig.json` includes `**/*.ts`, so `pnpm typecheck` also covers TypeScript under `invitation-research/`.

## 7. Environment notes
- **Rebuild from a scaffold-only project:** clone the public branch into `/tmp`, delete the scaffold-only files with the Delete tool (`next.config.mjs`, `pnpm-workspace.yaml`, `next-env.d.ts`, the placeholder images in the scaffold's `/vercel/share/v0-project/public/` folder), move the clone's `.git` to `/vercel/share/work/invitesion.git`, `$GIT_RESEARCH reset --hard`, set `core.worktree`. If the project already holds repo files, never reset: `$GIT_RESEARCH status` shows the session's work.
- `CI=true pnpm install --frozen-lockfile` (a plain install aborts without a TTY).
- Research toolchain: `bash invitation-research/_tools/ops/bootstrap-sandbox.sh tools` as a background task (≈ 5 min: Node 24.22.2, REA 6.8.0, Lighthouse 12.8.2, Chrome for Testing 156.0.8078.4) → `source /vercel/share/work/tools/env.sh`; `… chrome` as a background task for CDP; `node invitation-research/_tools/capture/verify-profiles.mjs --out …` before any v2 capture.
- Local stack for own captures: `bash invitation-research/_tools/ops/local-stack.sh up` then `… start` in the background (port 3100).
- Checks: see `acceptance-matrix.md` RQ-VER-01 and `review-request-s14.md` §3.
- Tool quirks: no `diff` / `cmp` binary (use `git diff --no-index`); run Python with `-B`; `rm -rf` is blocked (Delete tool); background work uses the Bash background mode, not `&`.

## 8. Do not redo (finished and verified)
- Skills vetting, REA verification for 6.8.0, privacy fixers (only if a `--check` fails).
- Every stored capture (89 + those the s14 batch added), the bounded IDI / SMO / PLO demo search (ADR-W1), discovery for the Tier-A vendors, every S- read in the evidence index, the s12 robots audit, the s09 spike result sets and ADR-A1, the backlog chains (s12, verified s13 / s14).
