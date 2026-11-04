# LATEST: single entry point for resuming the Invitesion mission

> Technical progress records are in `sessions/`. The owner keeps agent instructions and raw response transcripts outside this repository. **Current status source: §1 of this file.** Per-requirement status: `acceptance-matrix.md`. Folder layout: `../README.md`. Decisions and phase board: `../_progress.md`. Questions: `../_open-questions.md`. Evidence: `../_evidence-index.md`. Implementation log: `IMPLEMENTATION-LOG.md`. Self-review: `review-20261104-self.md`. Design families: `../../templates/_briefs/`, skill `invitesion-template-harness`, latest review `family-review-20261104-s16.md`, rendered contrast `contrast-sweep-20261104-s16.md`.

| | |
|---|---|
| Session | **16** (2026-11-04, from 17:51Z; fresh sandbox) |
| Session file | `sessions/session-16-20261104-1751.md` (previous: `sessions/session-15-20261104-1556.md`) |
| Baseline | `faznode/invitesion`, branch `v0/faznode-3b993736` @ **`e983700df3fb654ede1a37e9d17e442cf2b1b4b0`** (tree `4484e955e5ed2a5cca36f98fa0d10511df40d4a1`, parent `bcc1af9`, owner commit "feat: sync invitesion-my programme and design harness progress"; 1,478 files; the three scratch files under `tools/template-harness/.out/` were excluded by the owner and must not be tracked again) |
| Workspace | `/vercel/share/v0-project` (persisted; the owner downloads it and pushes manually) is the worktree of the research git `/vercel/share/work/invitesion.git` (`core.worktree` set; local branch of the same name; s16 local commits on top of `e983700`). Lost on a sandbox recycle: everything under `/vercel/share/work` (git dir, toolchain, Postgres, app snapshot, logs) and `/tmp` (renders, review fonts, contrast reports) |
| Owner decisions in force (ADR-O08–O10) | **Implementation proceeds alongside the remaining research**; unfinished rows stay visible (O08). **Self-review under owner authority** replaces the independent review requirement; never called Guardian approval (O09). **RQ-DEMO-01 is availability-limited** with strict counts and lower confidence kept (O10). Do not ask these again. Work order is chosen from dependencies |
| Never in the repo | Owner prompts, raw agent-response transcripts (`_handoff/briefs/`, `_handoff/logs/` must not be recreated), secrets, private evidence, real customer data, competitor assets, review screenshots and generated review assets |
| Resume protocol | On "continue": read this file and the newest session file → if `/vercel/share/work` is gone, rebuild per §7 → `$GIT_RESEARCH status --short` → state the resume point in 2–3 lines → continue §4. Log every finished task in the session file before starting the next |

## 1. Status
| Area | State | Where |
|---|---|---|
| Implementation | **Running** (ADR-O08). Done: B-001…B-008, B-010, B-011 (s09); B-017a, B-014 step 1, content contract (s11); B-016 tokens + photo bound (s14–s15); B-030 slice 1 (Gapura, Kartu, Riang) and slice 2 (Lontar) with rendered review (s15–s16); B-029 slice 1 (corporate programme: description, agenda, speakers, dress code, contact; organiser beside the event name); B-027 slice 1 (s16: deadline shown and enforced, refusal notices, actions honour the host's switches, F7 name text). **Not done:** B-029 ceremony blocks and hashtag, corporate `logoUrl` / `eventCategory` rendering; B-027 "maybe", custom questions, per-event answers; B-014 step 2; template editability end to end | `IMPLEMENTATION-LOG.md` E-015…E-020 |
| Product checks | s16 after B-027: `pnpm typecheck` 0; `pnpm test` 147 / 147 (135 + 6 contrast-gate + 6 B-027); production build OK at 18:42Z (snapshot, middleware set aside per D-012); B-027 browser end to end 26 / 26 against the real server actions | session 16 |
| Design review | s16 rendered review of legacy + four families: 175 shots, 0 px overflow; verdicts Gapura revise, Kartu kept, Riang kept for celebrations, Lontar kept for formal / corporate. F7 fixed (E-020). Open: R1 (legacy bidi isolation), S16-X1 / X2 (Gapura), S16-L6 (logo) | `family-review-20261104-s16.md` |
| Rendered contrast (B-016) | Tool fixed: PASS / FAIL / INCOMPLETE with exit codes; INCOMPLETE never completes the gate. Run 1 (checkpoint layouts): palette pages PASS 90 / 90, state pages not run. Run 2 (B-027 build, 121 pages): see the record | `contrast-sweep-20261104-s16.md` |
| Research / masterplan gate | **Not passed**, no longer a precondition for implementation (ADR-O08). Criterion 1 open on RQ-COMP-04, RQ-COMP-05, RQ-OWN-02; RQ-BENCH-05 measured coverage complete for the queued themes with external limits unresolved; RQ-DEMO-01 qualified (O10); RQ-VER-03 self-review (O09) | `acceptance-matrix.md` §9 |
| Measurement | Stored and final for this phase: 165 raw summaries = 165 `_captures.csv` rows = 165 `captures-summary.csv` rows; `queue-v2-s13.tsv` 94 / 94 and `queue-v2-s14-espresso.tsv` 4 / 4 with Lighthouse OK; `lighthouse-environment.csv` 163 rows. Do not rerun these queues | `../04-template-benchmarks/` |
| Robots policy | D-030 applicability by identity and purpose. Open and separate from O08–O10: Q-O08 (Trustpilot / Canva legacy tokens), Q-O09 (Enviory challenge sequence), research-client identity questions | `../_open-questions.md` |
| Rust | ADR-A1 keeps Next.js; Rust exists only as the s09 benchmark spike. A service needs a measured revisit trigger plus written contracts, ownership, auth, data boundaries, migration and rollback | `../09-masterplan/12-decision-log.md` |

## 2. Running jobs (verify before trusting; processes never survive a recycle)
- s16: Postgres 16.15 on 127.0.0.1:5433; app snapshot `next start` on 127.0.0.1:3100 (B-027 build, fixture of 121 invitations); contrast run 2 (`/tmp/contrast-s16b`, log `/vercel/share/work/logs/contrast-s16b.log`); no CDP Chrome, no capture batch. A tool label such as "finished" is not evidence; count stored results.

## 3. Done in session 16 (details and times in the session file)
- Import at `e983700`, checkpoint reproduced (typecheck 0, 135 / 135).
- Rendered-contrast gap closed: `contrast-gate.ts` + CLI exit codes + 6 regression tests (mutation 9 / 10, survivor equivalent).
- Interrupted design review closed with fresh renders (final Lontar binding included) and a written record; briefs, briefs index and harness skill corrected from it; the missing s15 review file is documented, not manufactured.
- Contrast run 1 on the checkpoint layouts (palette pages 90 / 90 PASS; the chained state stage never started, recorded as such). Local commit `64701bb`.
- B-027 slice 1 (E-020): deadline, refusal notices, server-side switches, F7; 147 / 147, mutation 13 / 13, browser 26 / 26.

## 4. NEXT ACTIONS (in order; from the repo root)
1. Finish whatever the session file lists as open at its last entry.
2. **B-029 rest:** logo (S16-L6: `http(s)` URLs only, fixed-ratio frame, organisation name as alt text; the cover image is still rendered from any URL the schema parses, a recorded gap), `eventCategory` label, ceremony blocks, hashtag; each moved from stored-only to rendered with contract and renderer tests in every layout, then a corporate re-render.
3. **B-027 slice 2:** "maybe" (status value, dashboard count, CSV export neutralised per B-006), custom questions and per-event answers. These need a schema decision (answers table or JSON column), a migration and export tests; `schemaVersion` alone is not a migration.
4. **B-014 step 2:** the s09 spike shows the render, not the data, is the cost (`cache()` left server CPU unchanged), so a shared data cache cannot meet "≤ 2 × next-min". Step 2 needs a cached invitation shell with per-guest holes (name, RSVP state, link token) in all five layouts, behind a flag, invalidated on publish / edit, with the cross-guest leakage test and a spike re-run on an otherwise idle host. Request-local caching does not prove shared-cache safety.
5. **Harness × product families:** the tier budgets in `tools/template-harness/policy.ts` were set for standalone samples. Product family pages also ship the shared app shell (Next runtime, clerk-js until B-015), so a family gate must separate shell bytes from family-attributable bytes before it can pass or fail a family.
6. **Gapura revision** (S16-X1 photo framing, S16-X2 phone rhythm) with a re-render including a low-contrast photo; legacy bidi isolation (R1) needs a compatibility decision because legacy markup is kept verbatim (B-027 already isolates the RSVP name).
7. **RQ-OWN-02:** interleaved same-host runs of `22ed99e`, `9bbd813` and the current build (≥ 3 each, benchmarkIndex per run), never overlapping builds, tests or browser review.
8. **RQ-COMP-04 / -05:** Sonett rendered read where legitimately accessible; remaining public review searches (one per vendor, at most two pages, robots first, paraphrase without names). An unavailable-source record is not a complaint theme.
9. Template editability end to end once a signed-in Clerk session can be exercised; versioning needs working migrations, not only `schemaVersion`.

## 5. Decisions (latest first; full list `../_progress.md`, ADRs in `../09-masterplan/12-decision-log.md`)
- **ADR-O10 / O09 / O08 (owner, s14)** as in the table above.
- **D-033 (s14)** Our own pages: the product build is part of the measurement population.
- **D-032 (s13)** Measurement profiles are separate populations; CDP emulation clear → set → media after REA.
- **D-031 / D-030** Enviory provisional evidence; robots applicability by identity and purpose.
- Earlier: D-029 RFC 9309 matcher; D-027 observed-structure tiers; D-022 robots 5xx / 429 / unreachable = disallow; D-012 own builds without middleware while Clerk keys are placeholders; ADR-A1 keep Next.js.

## 6. Open problems, hazards, unverified (carry forward)
- **Editor tools may serve the scaffold's copy (s15):** in a fresh import, Read / Edit returned the v0 scaffold's version of files that exist in both the scaffold and the repository (`app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `package.json`, `tsconfig.json`, `.gitignore`, `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `postcss.config.mjs`, `pnpm-lock.yaml`). Change those only with checked scripts and confirm with `$GIT_RESEARCH diff`.
- **A script that rewrites a file (mutation checks) changes its mtime;** the editor then refuses the next Edit until the file is read again (s15 and s16).
- **Platform side effects:** the host may add its own project `.git`, rewrite `.gitignore` and (re)start a preview `next dev`. On resume: `$GIT_RESEARCH diff --quiet -- .gitignore || $GIT_RESEARCH checkout HEAD -- .gitignore`; never commit `.clerk`.
- **Background Bash runs are cut off at the tool's 10-minute limit (s16):** a running child survives, but a chained second command never starts. Run a long job as one invocation and count its stored results.
- Host speed varies between sandboxes and runs; record benchmarkIndex and competing load; never read a cross-session timing change as a product change.
- Emulation: protocol v2 verifies the final CDP state, not every intermediate interaction; emulation is never a physical-device or in-app-browser test.
- Naming hazard: `C-INV-0xx` = our Invitesion, `C-INV-1xx` / `2xx` = INVI.ID.
- D-008 before every new queue row: a vendor-linked "contoh" page can be a real customer's event; stop at the first personal data.
- P-INV-010: the production middleware hangs with placeholder Clerk keys; signed-in editor behaviour, real Clerk authentication and live payments remain unverified in any sandbox.
- `tsconfig.json` includes `**/*.ts`, so `pnpm typecheck` also covers TypeScript under `invitation-research/`.
- Planned custom skills that do not exist: `invitesion-motion-system`, `invitesion-style-dna`, `invitesion-rust-backend`.

## 7. Environment notes
- **Rebuild from a scaffold-only project:** clone the public branch into `/tmp`, delete the scaffold-only files with the Delete tool (`next.config.mjs`, `pnpm-workspace.yaml`, `next-env.d.ts`, the placeholder images in the scaffold's public folder), move the clone's `.git` to `/vercel/share/work/invitesion.git`, `$GIT_RESEARCH reset --hard`, set `core.worktree`. If the project already holds repo files, never reset: `$GIT_RESEARCH status` shows the session's work.
- `CI=true pnpm install --frozen-lockfile` (a plain install aborts without a TTY).
- Toolchain: `bash invitation-research/_tools/ops/bootstrap-sandbox.sh tools` as a background task (≈ 2 min) → `source /vercel/share/work/tools/env.sh`; Postgres with `local-stack.sh pg` chained after it (dnf lock); `… chrome` in the background for CDP; `verify-profiles.mjs --out raw/_setup/…` before any v2 capture, then one real-path capture alone.
- Local stack: `local-stack.sh up`, then `… start` in the background (port 3100); family review fixture, review-only fonts and the fictional cover per the harness skill and `family-review-20261104-s16.md` §2 / §6.
- Tool quirks: no `diff` / `cmp` binary (use `git diff --no-index`); run Python with `-B`; `rm -rf` is blocked (Delete tool); the image generator writes only inside the project (use git-ignored `tools/template-harness/.out/`); background work uses the Bash background mode, not `&`.

## 8. Do not redo (finished and verified)
- Skills vetting, REA verification for 6.8.0 (same pins in s16), privacy fixers (only if a `--check` fails).
- Every stored capture (check `raw/_captures.csv`), the v2 queues (94 / 94, 4 / 4), the bounded IDI / SMO / PLO demo search (ADR-W1, ADR-O10), discovery for the Tier-A vendors, every S- read in the evidence index, the s12 robots audit, the s09 spike result sets and ADR-A1, the backlog chains.
- The s16 family review (re-render only after a layout change) and the contrast-gate semantics.
