# LATEST: single entry point for resuming the Invitesion mission

> Technical progress records are in `sessions/`. The owner keeps agent instructions and raw response transcripts outside this repository. **Current status source: §1 of this file.** Per-requirement status: `acceptance-matrix.md`. Folder layout: `../README.md`. Decisions and phase board: `../_progress.md`. Questions: `../_open-questions.md`. Evidence: `../_evidence-index.md`. Implementation log: `IMPLEMENTATION-LOG.md`. Self-review: `review-20261104-self.md`. Design families: `../../templates/_briefs/`, skill `invitesion-template-harness`, latest review `family-review-20261104-s16.md` (with its s17 follow-up §9), rendered contrast `contrast-sweep-20261104-s16.md` (runs 1–3).

| | |
|---|---|
| Session | **17** (2026-11-04 from 20:20Z, fresh sandbox; resumed 2026-11-05 02:41Z after a VM restart that kept `/vercel/share/work` and `/tmp`) |
| Session file | `sessions/session-17-20261104-2020.md` (previous: `sessions/session-16-20261104-1751.md`) |
| Baseline | `faznode/invitesion`, branch `v0/faznode-3b993736` @ **`f2fd1285bf29fc594ecf520f96ddd4870d16c925`** (tree `6b19def72223cf2d19dd923d00b1fa00c6d3b589`, parent `e983700`, owner commit "feat: sync invitesion-j2 RSVP and corporate branding progress"; 1,488 files; the generated review cover `tools/template-harness/.out/review-assets/cover-photo.png` was excluded by the owner and must not be tracked) |
| Workspace | `/vercel/share/v0-project` (persisted; the owner downloads it and pushes manually) is the worktree of the research git `/vercel/share/work/invitesion.git` (`core.worktree` set; local branch of the same name; s17 local commits on top of `f2fd128`). Lost on a sandbox recycle: everything under `/vercel/share/work` (git dir, toolchain, Postgres, app snapshot, uploads, logs) and `/tmp` (renders, review fonts, contrast reports) |
| Owner decisions in force (ADR-O08–O10) | **Implementation proceeds alongside the remaining research**; unfinished rows stay visible (O08). **Self-review under owner authority** replaces the independent review requirement; never called Guardian approval (O09). **RQ-DEMO-01 is availability-limited** with strict counts and lower confidence kept (O10). Do not ask these again. Work order is chosen from dependencies |
| Never in the repo | Owner prompts, raw agent-response transcripts (`_handoff/briefs/`, `_handoff/logs/` must not be recreated), secrets, private evidence, real customer data, competitor assets, review screenshots and generated review assets |
| Resume protocol | On "continue": read this file and the newest session file → if `/vercel/share/work` is gone, rebuild per §7 → `$GIT_RESEARCH status --short` → state the resume point in 2–3 lines → continue §4. Log every finished task in the session file before starting the next |

## 1. Status
| Area | State | Where |
|---|---|---|
| Implementation | **Running** (ADR-O08). Done: B-001…B-008, B-010, B-011 (s09); B-017a, B-014 step 1, content contract (s11); B-016 tokens + photo bound (s14–s15); B-030 slices 1–2 (Gapura, Kartu, Riang, Lontar) with rendered review (s15–s16); B-029 slices 1–2 (programme, organiser, logo, category; s15–s16, browser-accepted s17) and slice 3 (ceremony profile + wedding hashtag, E-026, s17; browser acceptance: session file); B-027 slice 1 (s16), switched-off notices (E-024) and "maybe" (E-025), both browser-verified s17; E-022 upload paths (s16, persistence verified s17 without a session); E-023 cover through `safeImageSrc` (s17). **Not done:** B-027 custom questions, per-event answers, dashboard overview count; ceremony photo (needs a person-photo treatment); B-014 step 2; template editability end to end; Gapura revision | `IMPLEMENTATION-LOG.md` E-015…E-026 |
| Product checks | s17: `pnpm typecheck` 0; `pnpm test` **181 / 181**; mutation E-023/E-024 10 / 10, E-025 9 / 9, E-026 14 / 14; `scripts/verify-upload-path.ts` 29 / 29 and the E-021 browser check 554 / 554 on the checkpoint build; on the `f1af734` snapshot: E-024 80 / 80, E-025 75 / 75, structure of all 141 fixture pages as intended; `verify-payment` 10 / 10, `verify-view-dedupe` 6 / 6 | session 17 |
| Design review | s16 review stands (175 shots, 0 px overflow at its build): Gapura revise, Kartu kept, Riang kept for celebrations, Lontar kept for formal / corporate, legacy compatibility fallback. s17 follow-up: organiser mark accepted in all five layouts; M1–M3, S17-L1 open. Open from s16: R1 (legacy bidi isolation), S16-X1 / X2 (Gapura) | `family-review-20261104-s16.md` §5, §9 |
| Rendered contrast (B-016) | Run 1 (checkpoint layouts of s16): palette 90 / 90 PASS. Run 2 (B-027 build): **closed as unrecoverable**, 120 / 121 lines observed (118 PASS, 2 INCOMPLETE photo pages), no verdict. Run 3 (checkpoint `f2fd128`): **INCOMPLETE**, 51 pages: 47 PASS, 0 FAIL, 4 INCOMPLETE (the headline over the cover photo in legacy and Gapura). Run 4 (`f1af734`, all 141 pages): see the record. Photo pages stay INCOMPLETE; the photo bound is separate evidence and never turns an INCOMPLETE into a PASS | `contrast-sweep-20261104-s16.md` |
| Research / masterplan gate | **Not passed**, no longer a precondition for implementation (ADR-O08). Criterion 1 open on RQ-COMP-04, RQ-COMP-05, RQ-OWN-02; RQ-BENCH-05 measured coverage complete for the queued themes with external limits unresolved; RQ-DEMO-01 qualified (O10); RQ-VER-03 self-review (O09) | `acceptance-matrix.md` §9 |
| Measurement | Stored and final for this phase: 165 raw summaries = 165 `_captures.csv` rows = 165 `captures-summary.csv` rows; `queue-v2-s13.tsv` 94 / 94 and `queue-v2-s14-espresso.tsv` 4 / 4; `lighthouse-environment.csv` 163 rows. Do not rerun these queues | `../04-template-benchmarks/` |
| Robots policy | D-030 applicability by identity and purpose. Open and separate from O08–O10: Q-O08, Q-O09, research-client identity questions | `../_open-questions.md` |
| Rust | ADR-A1 keeps Next.js; Rust exists only as the s09 benchmark spike. A service needs a measured revisit trigger plus written contracts, ownership, auth, data boundaries, migration and rollback | `../09-masterplan/12-decision-log.md` |

## 2. Running jobs (verify before trusting; processes never survive a recycle)
- s17 (resumed): Postgres 16.15 on 127.0.0.1:5433; app snapshot of `f1af734` (`next start`) on 127.0.0.1:3100; uploads under `/vercel/share/work/app/storage/uploads`; contrast run 4 (`/tmp/contrast-s17-run4`, log `/vercel/share/work/logs/contrast-s17-run4.log`). Run 3 ended and its report was read. A tool label such as "finished" is not evidence; count stored results.

## 3. Done in session 17 (details and times in the session file)
- Import at `f2fd128`, checkpoint reproduced (typecheck 0, 157 / 157).
- Contrast run 2 closed from the log's observations (unrecoverable, no verdict); run 3 scoped to what E-021 changed plus every non-corporate state page.
- E-021 / E-022 verified on the checkpoint build without a session: `scripts/verify-upload-path.ts` (29 / 29) and the browser check of the organiser mark (554 / 554); compatible E-022 rollback defined.
- E-023 cover through `safeImageSrc`; E-024 switched-off refusal notices. 164 / 164, mutation 10 / 10.
- Review fixture `--mark-variants --logo-files`; records repaired (Lontar S16-L6 split into code s16 / browser s17; S17-L1).
- E-025 "maybe" (`f1af734`); contrast run 3 read (47 / 0 / 4, overall INCOMPLETE); snapshot rebuilt; E-024 80 / 80 and E-025 75 / 75 end to end (flag-off rollback path included); structure of all 141 pages as intended.
- E-026 B-029 slice 3: ceremony profile per event type and the wedding hashtag in all five layouts, plus the S17-R2 headcount hint; 181 / 181, mutation 14 / 14; fixture `--ceremony` and `--match`.

## 4. NEXT ACTIONS (in order; from the repo root)
1. Finish whatever the session file lists as open at its last entry (run 4 result; E-026 on a rebuilt snapshot: seed `--ceremony --match '-(aqiqah|khitanan|tasyakuran|share)$'`, `e026-check.cjs`, a scoped contrast run on the 20 new pages, the rendered critique of the new blocks).
2. **B-027 slice 2b:** custom questions and per-event answers. `detail-config.ts` already has a question-field type enum but no answers storage: decide answers table vs JSON column, write the migration, export columns and tests; `schemaVersion` alone is not a migration. Also the dashboard overview's "Hadir"-only count.
3. **Ceremony photo** (the last stored-only ceremony field) once a person-photo treatment is decided (frame, alt text, children's privacy); couple photos share the decision.
4. **B-014 step 2:** the s09 spike shows the render, not the data, is the cost (`cache()` left server CPU unchanged), so a shared data cache cannot meet "≤ 2 × next-min". Step 2 needs a cached invitation shell with per-guest holes (name, RSVP state, link token, refusal notices) in all five layouts, behind a flag, invalidated on publish / edit, with the cross-guest leakage test and a spike re-run on an otherwise idle host. Request-local caching does not prove shared-cache safety.
5. **Gapura revision** (S16-X1 photo framing, S16-X2 phone rhythm) rendered with both covers (high- and low-contrast assets exist in s17 provenance); taste candidate T1 needs exactly this low-contrast evidence. Then Lontar S17-L1 and M2 (missing-file logos after media deletion).
6. **Harness × product families:** the tier budgets in `tools/template-harness/policy.ts` were set for standalone samples; product family pages also ship the shared app shell (Next runtime, clerk-js until B-015), so a family gate must separate shell bytes from family-attributable bytes, keeping the total guest-page budget.
7. **RQ-OWN-02:** interleaved same-host runs of `22ed99e`, `9bbd813` and the current build (≥ 3 each, benchmarkIndex per run), never overlapping builds, tests or browser review.
8. **RQ-COMP-04 / -05:** Sonett rendered read where legitimately accessible; remaining public review searches (one per vendor, at most two pages, robots first, paraphrase without names). An RSVPify rendered read is a legitimate research direction for the owner's taste preference; no RSVPify finding exists yet.
9. Template editability end to end once a signed-in Clerk session can be exercised; versioning needs working migrations, not only `schemaVersion`.

## 5. Decisions (latest first; full list `../_progress.md`, ADRs in `../09-masterplan/12-decision-log.md`)
- **s17** E-026 (IMPLEMENTATION-LOG): each ceremony type renders exactly the fields its editor tab offers; the profile takes the corporate programme's slot in every layout; the hashtag renders for weddings only (the editor's module matrix); person photos stay stored-only until a treatment (frame, alt text, children's privacy) is decided.
- **s17** E-022 rollback contract (IMPLEMENTATION-LOG): storage keeps accepting upload paths plus every absolute URL it took; renderers request only upload paths and http(s) URLs; a rollback of the schema needs a data migration first.
- **ADR-O10 / O09 / O08 (owner, s14)** as in the table above.
- **D-033 (s14)** Our own pages: the product build is part of the measurement population.
- **D-032 (s13)** Measurement profiles are separate populations; CDP emulation clear → set → media after REA.
- **D-031 / D-030** Enviory provisional evidence; robots applicability by identity and purpose.
- Earlier: D-029 RFC 9309 matcher; D-027 observed-structure tiers; D-022 robots 5xx / 429 / unreachable = disallow; D-012 own builds without middleware while Clerk keys are placeholders; ADR-A1 keep Next.js.

## 6. Open problems, hazards, unverified (carry forward)
- **Editor tools may serve the scaffold's copy (s15):** in a fresh import, Read / Edit returned the v0 scaffold's version of files that exist in both the scaffold and the repository (`app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `package.json`, `tsconfig.json`, `.gitignore`, `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `postcss.config.mjs`, `pnpm-lock.yaml`). Change those only with checked scripts and confirm with `$GIT_RESEARCH diff`.
- **A script that rewrites a file (mutation checks) changes its mtime;** the editor then refuses the next Edit until the file is read again.
- **Platform side effects:** the host may add its own project `.git`, rewrite `.gitignore` and (re)start a preview `next dev`. On resume: `$GIT_RESEARCH diff --quiet -- .gitignore || $GIT_RESEARCH checkout HEAD -- .gitignore`; never commit `.clerk`.
- **Background Bash runs are cut off at the tool's 10-minute limit (s16):** a running child survives, but a chained second command never starts. Run a long job as one invocation and count its stored results. Never background with `&` inside a foreground command.
- **Served guest pages write VIEW events** that reference the guest; scratch cleanups delete `analytics_events` first (s17).
- **TaskStop does not stop a background `local-stack.sh start`** (s17): pnpm and `next-server` are reparented to init and keep serving. Stop them by PID after checking `/proc/<pid>/environ` (port, flags).
- **Restoring a jsonb config from scratch scripts (s17):** postgres.js JSON-encodes a string bound straight to a `::jsonb` parameter (the value becomes a JSON string scalar); bind text and cast in SQL (`${raw}::text::jsonb`). psql `-c` does not interpolate `:'var'`. Verify restores by digest or a structural page comparison.
- **Browser checks after a server action (s17):** the redirect is a soft navigation, so the URL changes before the new tree is committed; wait for the expected notice and an idle network before measuring, and read visible text (`innerText` of `<main>`), never `body.textContent` (it includes the first load's RSC payload).
- Host speed varies between sandboxes and runs; record benchmarkIndex and competing load; never read a cross-session timing change as a product change.
- Emulation: protocol v2 verifies the final CDP state, not every intermediate interaction; emulation is never a physical-device or in-app-browser test.
- Naming hazard: `C-INV-0xx` = our Invitesion, `C-INV-1xx` / `2xx` = INVI.ID.
- D-008 before every new queue row: a vendor-linked "contoh" page can be a real customer's event; stop at the first personal data.
- P-INV-010: the production middleware hangs with placeholder Clerk keys; signed-in editor behaviour, real Clerk authentication and live payments remain unverified in any sandbox.
- `tsconfig.json` includes `**/*.ts`, so `pnpm typecheck` also covers TypeScript under `invitation-research/`.
- Planned custom skills that do not exist: `invitesion-motion-system`, `invitesion-style-dna`, `invitesion-rust-backend`.

## 7. Environment notes
- **Rebuild from a scaffold-only project:** clone the public branch into `/tmp`, delete the scaffold-only files with the Delete tool (`next.config.mjs`, `pnpm-workspace.yaml`, `next-env.d.ts`, the nine placeholder images in the scaffold's public folder), move the clone's `.git` to `/vercel/share/work/invitesion.git`, `$GIT_RESEARCH reset --hard`, set `core.worktree`. If the project already holds repo files, never reset: `$GIT_RESEARCH status` shows the session's work.
- `CI=true pnpm install --frozen-lockfile` (a plain install aborts without a TTY).
- Toolchain: `bash invitation-research/_tools/ops/bootstrap-sandbox.sh tools` as a background task (≈ 2 min) → `source /vercel/share/work/tools/env.sh`; Postgres with `local-stack.sh pg` chained after it (dnf lock); `… chrome` in the background for CDP; `verify-profiles.mjs --out raw/_setup/…` before any v2 capture, then one real-path capture alone.
- Local stack: `local-stack.sh sync && deps && db && build` (copy review covers into `$APP/public/review/` before `build`: `next start` serves only public files present at build time), then `… start` in the background (port 3100). Fixture: `UPLOAD_ROOT=/vercel/share/work/app/storage/uploads npx tsx invitation-research/_tools/setup/seed-family-review.ts --cover-url http://127.0.0.1:3100/review/cover.png --palettes --mark-variants --logo-files <square>,<wide>,<tall>`; review-only fonts per the harness skill.
- Upload path check: `POSTGRES_URL=… UPLOAD_ROOT=<server upload root> npx tsx scripts/verify-upload-path.ts --base http://127.0.0.1:3100 [--logo file.png]`.
- Tool quirks: no `diff` / `cmp` binary (use `git diff --no-index`); run Python with `-B`; `rm -rf` is blocked and the Delete tool refuses paths outside the project (use a Node `unlinkSync` for scratch files under `/vercel/share/work`); the image generator writes only inside the project (use git-ignored `tools/template-harness/.out/`) and may add borders (trim with sharp from `node_modules/.pnpm/sharp@*/node_modules/sharp`); background work uses the Bash background mode, not `&`.

## 8. Do not redo (finished and verified)
- Skills vetting, REA verification for 6.8.0 (same pins in s17), privacy fixers (only if a `--check` fails).
- Every stored capture (check `raw/_captures.csv`), the v2 queues (94 / 94, 4 / 4), the bounded IDI / SMO / PLO demo search (ADR-W1, ADR-O10), discovery for the Tier-A vendors, every S- read in the evidence index, the s12 robots audit, the s09 spike result sets and ADR-A1, the backlog chains.
- The s16 family review (re-render only after a layout change), the contrast-gate semantics, the E-021 browser check on `f2fd128`, contrast run 3 (read), the E-024 / E-025 end-to-end checks on `f1af734`.
