# LATEST: single entry point for resuming the Invitesion mission

> Technical progress records are in `sessions/`. The owner keeps agent instructions and raw response transcripts outside this repository. **Current status source: §1 of this file.** Per-requirement status: `acceptance-matrix.md`. Folder layout: `../README.md`. Decisions and phase board: `../_progress.md`. Questions: `../_open-questions.md`. Evidence: `../_evidence-index.md`. Implementation log: `IMPLEMENTATION-LOG.md`. Self-review: `review-20261104-self.md`. Design families: `../../templates/_briefs/`, skill `invitesion-template-harness`.

| | |
|---|---|
| Session | **15** (2026-11-04, from 15:56Z; fresh sandbox) |
| Session file | `sessions/session-15-20261104-1556.md` (previous: `sessions/session-14-20261104-1420.md`) |
| Baseline | `faznode/invitesion`, branch `v0/faznode-3b993736` @ **`bcc1af9b578457d868fd8a0610095088a8383b01`** (tree `ee1b3ddc1a83123125a23972f3d0cfb4703d4858`, parent `9bbd813`, owner commit "feat: sync invitesion-oa design families and research progress"; 1,436 files) |
| Workspace | `/vercel/share/v0-project` (persisted; the owner downloads it and pushes manually) is the worktree of the research git `/vercel/share/work/invitesion.git` (`core.worktree` set; local branch of the same name; s15 local commits on top of `bcc1af9`). Lost on a sandbox recycle: everything under `/vercel/share/work` (git dir, toolchain, Postgres, app snapshot, private evidence, logs) |
| Owner decisions in force (s14, ADR-O08–O10) | **Implementation proceeds alongside the remaining research**; unfinished rows stay visible and are not closed by the authorization (O08). **Self-review under owner authority** replaces the independent review requirement; it is labelled as such, never as Guardian approval (O09). **RQ-DEMO-01 is availability-limited** with strict counts and lower confidence kept (O10). Do not ask these again. Backend, frontend and harness order is chosen from the dependencies |
| Never in the repo | Owner prompts, raw agent-response transcripts (`_handoff/briefs/`, `_handoff/logs/` must not be recreated), secrets, private evidence, real customer data, competitor assets |
| Resume protocol | On "continue": read this file and the newest session file → if `/vercel/share/work` is gone, rebuild per §7 → `$GIT_RESEARCH status --short` → state the resume point in 2–3 lines → continue §4. Log every finished task in the session file before starting the next |

## 1. Status
| Area | State | Where |
|---|---|---|
| Implementation phase | **Started** (s14 code under ADR-O08: B-016 palette tokens, B-030 slice 1 with Gapura / Kartu / Riang). s15 completed the slice's verification: motion CSS, rendered-output tests, text-over-photo contrast fix | `IMPLEMENTATION-LOG.md` E-015, E-016 |
| Product checks | typecheck 0; `pnpm test` 123 / 123 at 16:04Z (before the E-015 extension; final numbers in the session file) | session 15 |
| Research / masterplan gate | **Not passed**, and no longer a precondition for implementation (ADR-O08). Criterion 1 open on RQ-COMP-04, RQ-COMP-05, RQ-OWN-02 and RQ-BENCH-05; RQ-DEMO-01 qualified (O10); RQ-VER-03 self-review in progress (O09) | `acceptance-matrix.md` §9 |
| Measurement | s15 resumed the v2 batch from the stored state (23 main + 4 espresso captures) after `verify-profiles` and one real-path capture | session 15, `04-template-benchmarks/queues/` |
| Enviory evidence | Provisional (D-031, Q-O09): excluded from unconditional results, reported in the sensitivity population; no new request to the demo route | `../02-competitor-discovery/robots-applicability-s12.md` §7 |
| Robots policy | D-030: applicability by identity and purpose. Open and separate from O08–O10: Q-O08 (Trustpilot / Canva legacy tokens), Q-O09 (Enviory challenge sequence), research-client identity questions | `../_open-questions.md` |
| Rust | ADR-A1 keeps Next.js; Rust exists only as the s09 benchmark spike. No service is planned unless a revisit trigger fires; an incremental service would first need ownership, contracts, auth, data boundaries, migration and rollback written down | `../09-masterplan/12-decision-log.md` |

## 2. Running jobs (verify before trusting; processes never survive a recycle)
- s15: CDP Chrome on `127.0.0.1:9222`, Postgres 16 on `127.0.0.1:5433`, capture batch log `/vercel/share/work/logs/batch-s15.log`. `run-batch.sh` skips every stored ID, so re-running a queue resumes it. A tool label such as "finished" is not evidence; count stored summaries.

## 3. Done in session 15 (details and times in the session file)
- Import at `bcc1af9`, baseline reproduced (115 / 119; research failures exactly as briefed).
- Product slice completed: `inv-rise` motion with reduced-motion switch-off; B-008 / B-011 / B-004 wiring tests rebuilt as rendered-output tests across all four layouts (9 / 9 mutants caught); text-over-photo contrast bound and fix (accent cover text fell to 2.83:1 worst case).
- Harness: review fixture `_tools/setup/seed-family-review.ts` (full, photo, sparse, birthday, expired, dark per layout; `--palettes` sweep), `tools/template-harness/rendered-contrast.ts`, `templates/_briefs/` (format + Lontar brief), skill `.agents/skills/invitesion-template-harness/` (the router target `AGENTS.md` named but nobody had created).

## 4. NEXT ACTIONS (in order; from the repo root)
1. Finish whatever the session file lists as open at its last entry (batch, regeneration, review, commit).
2. **B-029 then Lontar** (`templates/_briefs/lontar.md`): shared agenda / speakers / dress-code / contact blocks with contract and renderer tests, then the programme-led family and its rendered review.
3. **B-014 step 2** (cacheable invitation-level shell behind a flag, cross-guest leakage test, invalidation on publish / edit); request-local caching does not prove shared-cache safety.
4. **RQ-OWN-02:** interleaved same-host runs of the historical pre-P0 baseline `22ed99e`, the pre-family build `9bbd813` and the current family build (≥ 3 each, benchmarkIndex per run), each ID registered in `OWN_BUILDS`.
5. **RQ-COMP-04 / -05:** Sonett rendered read where legitimately accessible; remaining public review searches (one per vendor, at most two pages, robots first, paraphrase without names). An unavailable-source record is not a complaint theme.
6. Template editability end to end (catalog → editor family select → validation → persistence → preview → published page → template switching and older invitations) once a signed-in Clerk session can be exercised; versioning needs working migrations, not only `schemaVersion`.

## 5. Decisions (latest first; full list `../_progress.md`, ADRs in `../09-masterplan/12-decision-log.md`)
- **ADR-O10 (owner, s14)** RQ-DEMO-01 accepted as availability-limited (strict 4 / 8, 5 / 8 with provisional Enviory).
- **ADR-O09 (owner, s14)** Self-review under owner authority replaces the independent review requirement for RQ-VER-03.
- **ADR-O08 (owner, s14)** Implementation starts while research rows stay open and visible.
- **D-033 (s14)** Our own pages: the product build is part of the measurement population.
- **D-032 (s13)** Measurement profiles are separate populations; CDP emulation clear → set → media after REA.
- **D-031 / D-030** Enviory provisional evidence; robots applicability by identity and purpose.
- Earlier: D-029 RFC 9309 matcher; D-027 observed-structure tiers; D-022 robots 5xx / 429 / unreachable = disallow; D-012 own builds without middleware while Clerk keys are placeholders; ADR-A1 keep Next.js.

## 6. Open problems, hazards, unverified (carry forward)
- **Editor tools serve the scaffold's copy (s15):** in a fresh import, Read / Edit return the v0 scaffold's version of files that exist in both the scaffold and the repository (`app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `package.json`, `tsconfig.json`, `.gitignore`, `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `postcss.config.mjs`, `pnpm-lock.yaml`). Change those only with checked scripts and confirm with `$GIT_RESEARCH diff`.
- **Platform side effects:** the host may add its own project `.git`, rewrite `.gitignore` and (re)start a preview `next dev` (s15: it started on the scaffold's Next 16 binaries and exited on `experimental.ppr`). On resume: `$GIT_RESEARCH diff --quiet -- .gitignore || $GIT_RESEARCH checkout HEAD -- .gitignore`; never commit `.clerk`.
- Host speed varies between sandboxes and runs; record benchmarkIndex and competing load; never read a cross-session timing change as a product change.
- Emulation: protocol v2 verifies the final CDP state, not every intermediate interaction (`emulation_during_scenario` shows the REA wipe); emulation is never a physical-device or in-app-browser test.
- Naming hazard: `C-INV-0xx` = our Invitesion, `C-INV-1xx` / `2xx` = INVI.ID.
- D-008 before every new queue row: a vendor-linked "contoh" page can be a real customer's event; stop at the first personal data.
- P-INV-010: the production middleware hangs with placeholder Clerk keys; signed-in editor behaviour, real Clerk authentication and live payments remain unverified in any sandbox.
- `tsconfig.json` includes `**/*.ts`, so `pnpm typecheck` also covers TypeScript under `invitation-research/`.
- Planned custom skills that do not exist: `invitesion-motion-system`, `invitesion-style-dna`, `invitesion-rust-backend` (named in `SKILLS-LOCK.md` / style-observations; s15 created only `invitesion-template-harness`).

## 7. Environment notes
- **Rebuild from a scaffold-only project:** clone the public branch into `/tmp`, delete the scaffold-only files with the Delete tool (`next.config.mjs`, `pnpm-workspace.yaml`, `next-env.d.ts`, the placeholder images in the scaffold's public folder), move the clone's `.git` to `/vercel/share/work/invitesion.git`, `$GIT_RESEARCH reset --hard`, set `core.worktree`. If the project already holds repo files, never reset: `$GIT_RESEARCH status` shows the session's work.
- `CI=true pnpm install --frozen-lockfile` (a plain install aborts without a TTY).
- Toolchain: `bash invitation-research/_tools/ops/bootstrap-sandbox.sh tools` as a background task (≈ 2 min in s15) → `source /vercel/share/work/tools/env.sh`; `… chrome` in the background for CDP; `verify-profiles.mjs --out raw/_setup/…` before any v2 capture, then one real-path capture alone.
- Create `/vercel/share/work/logs` before starting parallel background jobs that log there (s15 lost one start to that race).
- Local stack: `bash invitation-research/_tools/ops/local-stack.sh up` then `… start` in the background (port 3100); family review fixture per the skill.
- Tool quirks: no `diff` / `cmp` binary (use `git diff --no-index`); run Python with `-B`; `rm -rf` is blocked (Delete tool); the image generator writes only inside the project (use git-ignored `tools/template-harness/.out/`); background work uses the Bash background mode, not `&`.

## 8. Do not redo (finished and verified)
- Skills vetting, REA verification for 6.8.0 (same pinned versions in s15), privacy fixers (only if a `--check` fails).
- Every stored capture (check `raw/_captures.csv`), the bounded IDI / SMO / PLO demo search (ADR-W1), discovery for the Tier-A vendors, every S- read in the evidence index, the s12 robots audit, the s09 spike result sets and ADR-A1, the backlog chains (s12, verified s13 / s14).
