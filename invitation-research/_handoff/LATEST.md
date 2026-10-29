# LATEST: single entry point for resuming the Invitesion research + harness mission

> Overwrite this file at every checkpoint. History: `sessions/` (append-only). Every prompt requirement with its status and path: `prompt-map.md`. Owner briefs (verbatim): `briefs/original-prompt.md`, `briefs/continuation-brief.md` (handoff and timing rules). Folder layout + filing rules + old→new paths: `../README.md`. Phase detail: `../_progress.md`. Decisions/questions: `../_open-questions.md`. Evidence: `../_evidence-index.md`.

| | |
|---|---|
| Session | **05** |
| Start (UTC) | 2026-10-29T18:05:56Z |
| End (UTC) | ≈ 2026-10-29T18:24Z, checkpoint committed (exact commit time in the session file). No batch running; Chrome left idle on CDP :9222 |
| Session file | `sessions/session-05-20261029-1805.md` |
| Base | `develop` @ `22ed99e` (+ platform snapshot `4794846` of sessions 01–02) |
| Working branch | research git `/vercel/share/work/invitesion.git` (outside the project, never pushed), branch `agent/research-harness`; s05 commit on top of `a39cc47`. **This is the source of truth.** The platform's own project git was re-initialised between s04 and s05 (`master`: `c44e72b` + `82a88bf`); expected and harmless |
| Owner request this session | Read the whole main prompt, map it against the actual repo, group all files by nature, archive old unrelated files |

## 1. Status per phase
| Phase | State | ≈% | Where |
|---|---|---|---|
| Step 0: REA, clone/baseline, skills, AGENTS.md | DONE | 100 | `00-setup/`, `_rea-playbook.md`, `../SKILLS-LOCK.md`, `../docs/skills-registry.md`, `../AGENTS.md` |
| 1: own-codebase audit | DONE (1 open check: palette source, §6) | 100 | `01-codebase-audit/`, `raw/invitesion/` |
| 2: discovery + selection | DONE | 100 | `02-competitor-discovery/`, `raw/_discovery/` |
| 3: teardowns | PARTIAL: 1/15 dossiers (Enviory v1), dossier template, discovery 15/15 attempted | 18 | `03-teardowns/` |
| 4: template benchmarks | PARTIAL: protocol v1.1; 34 captures; threshold-grade demos **ENV 6, KAT 6, INV 6**, IDI/IVT/VID/WEV 1; no blueprints/aggregates yet | 24 | `04-template-benchmarks/` (`queues/`), `raw/` |
| 5: feature matrix + gaps | NOT STARTED | 0 | `05-feature-matrix/`, `06-gap-analysis/` |
| 6: ideation | NOT STARTED | 0 | `07-ideation/` |
| 7: harness + custom skills + dogfood ★ | NOT STARTED | 0 | `tools/template-harness/`, `.agents/skills/invitesion-*`, `templates/_harness-samples/` |
| 8: Rust plan + spike | NOT STARTED | 0 | `08-backend-rust-plan/` |
| 9: masterplan | NOT STARTED | 0 | `09-masterplan/` |
Overall ≈ 30 % of the definition of done.

## 2. Original-prompt checklist (row-level detail and paths: `prompt-map.md`)
- [x] 0.1 REA playbook (6.8.0) · [x] 0.2 clone + baseline · [x] 0.3 20 vetted skills + lock + registry · [x] 0.4 AGENTS.md + CLAUDE.md
- [x] Phase 1 (9 docs + feature inventory + own captures C-INV-001…004)
- [x] Phase 2 (longlist 52, rubric, shortlist, tiers)
- [ ] Phase 3: [x] template · [x] discovery attempted 15/15 · [ ] 15 Tier-A dossiers (**1**) · [ ] api-observed per competitor (1) · [ ] APK metadata (PLO) · [ ] `_flows/` · [ ] Tier-B profiles
- [ ] Phase 4: [x] protocol v1.1 · [x] summarizer · [ ] ≥ 6 demos × 15 Tier A (**3/15** complete: ENV, KAT, INV) · [ ] 360×800 / in-app browser / long-name / RTL / WIB-WITA-WIT checks · [ ] blueprints · [ ] tier aggregates
- [ ] Phase 5 · [ ] Phase 6 · [ ] Phase 7 · [ ] Phase 8 · [ ] Phase 9
- [x] Handoff notes · [ ] Handoff zips current (last set 2026-10-29T03:41Z unless the s05 session file says regenerated) · [ ] Final report

## 3. Done in session 05 (exact paths)
- **Prompt:** re-read in full; stored verbatim in `invitation-research/_handoff/briefs/original-prompt.md` + `briefs/continuation-brief.md`. NEW `invitation-research/_handoff/prompt-map.md` (every requirement → ✅/◐/⬜ + path, verified against the tree).
- **Reorganisation (`git mv`, history kept; Q-D15):** research scripts → `invitation-research/_tools/ops/` (bootstrap-sandbox.sh, make-handoff-zips.sh), `_tools/safety/` (commit-guard.sh, secrets-scan.py, redact-discovery.py), `_tools/discovery/` (probe-homepages.py, discover-demos.mjs, select-demos.py), `_tools/capture/` (capture.mjs, robots.mjs, robots.test.mjs, run-batch.sh, summarize-captures.py), `_tools/setup/` (vet-skills.py, seed-local-demo.ts). Data → `raw/_discovery/` (candidates.txt, probe-2026-10-29.jsonl), `raw/_setup/` (skill-issue-catalog-2026-10-29.json). Queues → `04-template-benchmarks/queues/`. Root: `REBUILD-HANDOFF-A-Z.md` → `docs/specs/`; `artifacts/navigation/*.png` → `docs/worklog/assets/2026-07-18-public-navigation/`.
- **Archive (Q-D16):** `README.md` (Next.js SaaS Starter boilerplate) → `archive/README.nextjs-saas-starter.md`; `tokens.css` (old "Vienne" brand, never imported) → `archive/tokens.vienne-old-brand.css`; index `archive/README.md`. NEW root `README.md` (repo map + commands). NEW `invitation-research/README.md` (layout, filing rules, ID conventions, old→new path table).
- **References rewritten** in 26 living files (scripts, queues, `AGENTS.md`, `SKILLS-LOCK.md`, `docs/skills-registry.md`, `_progress.md`, `_evidence-index.md`, `_open-questions.md`, `_rea-playbook.md`, `00-setup/*.md`, `protocol.md`, `shortlist.md`, Enviory dossier) + manual fixes in `01-codebase-audit/{module-map,style-observations,template-system}.md`, `docs/worklog/2026-07-18-public-navigation.md`; `docs/INDEX.md` brought up to date (was 2026-07-14). Session logs 01–04 left untouched (append-only).
- **Verified:** syntax 14/14 (`bash -n`, `node --check`, `ast.parse`); `robots.test.mjs` 6/6; `redact-discovery.py --check` clean; `select-demos.py --help` loads; `summarize-captures.py` regenerated `04-template-benchmarks/captures-summary.csv` (32 captures); grep finds no stale path outside session logs; product code diff vs HEAD empty.
- **Captures landed after s04** and registered (`_evidence-index.md` § Session 05): `raw/katsudoto/C-KAT-102…106.json`, `raw/enviory/C-ENV-111…116.json`, `raw/invi/C-INV-111…114.json`, `raw/_captures.csv`.
- **Live end-to-end test of the moved pipeline:** Chrome via `_tools/ops/bootstrap-sandbox.sh chrome`; queue D via `_tools/capture/run-batch.sh 04-template-benchmarks/queues/queue-tier-a-4.tsv` skipped C-INV-111…114 and captured `raw/invi/C-INV-115.json` + `C-INV-116.json` (Lighthouse OK, not wrappers) → INVI has 6 threshold-grade demos. `captures-summary.csv` regenerated (34).
- **Handoff zips** regenerated 18:16Z in `/vercel/share/artifacts/` (handoff 620 files / 8.9 MB in the new layout, 0 private entries; private 115 files / 7.6 MB). C-INV-115/116 came after the zips; regenerate at the next phase end.
- Checkpoint files: `_progress.md` (board, session 05 summary, D-009/D-010), `_open-questions.md` (Q-D15, Q-D16), this file, session 05 log.

## 4. NEXT ACTIONS (in order; run from `invitation-research/` unless stated)
1. `date -u`; create `_handoff/sessions/session-06-YYYYMMDD-HHMM.md`; read this file + the newest session file; `source /vercel/share/work/tools/env.sh && $GIT_RESEARCH status --short | head && $GIT_RESEARCH log -5 --oneline`. **`.gitignore` first:** if `$GIT_RESEARCH diff --stat .gitignore` shows changes, restore with `$GIT_RESEARCH show HEAD:.gitignore > .gitignore` (repo root).
2. Environment: if `/vercel/share/work/tools/env.sh` is missing → from the repo root `bash invitation-research/_tools/ops/bootstrap-sandbox.sh git` (skip if the git dir exists), `tools`, `chrome` (BACKGROUND), `check > /vercel/share/work/logs/check.txt` and Read it. If env.sh exists but `curl -s 127.0.0.1:9222/json/version` fails → only `chrome` (background).
3. Resume batch A first so captures accumulate while you write (background; no batch runs at the s05 checkpoint): `source /vercel/share/work/tools/env.sh && bash _tools/capture/run-batch.sh 04-template-benchmarks/queues/queue-tier-a-rr.tsv > /vercel/share/work/logs/batch-a-s06.log 2>&1` → IDI 102–106, IVT 102–104, VID 102–106, WEV 102–106 (finished IDs are skipped). Stop with `pkill -f "queue-tier-a-r[r]"` (TaskStop orphans the loop). Never two batches, or a batch and Chrome discovery, at once.
4. Verify C-ENV-112/113 (130/148 DOM nodes vs 458–487 for the other four): read `structure.afterOpen` in `raw/enviory/C-ENV-112.json` + `113.json`, and one WebFetch of `https://enviory.com/tema/rocaille` and `/tema/velora-linear` for the official "Full Preview" link (log S-ENV-003). If a `tpl` slug is wrong: add corrected rows **with new IDs** (C-ENV-117/118) to `04-template-benchmarks/queues/queue-tier-a-3.tsv`, capture them, and mark 112/113 superseded in `_evidence-index.md` (evidence stays immutable).
5. Enviory dossier v2: replace §4.2 provisional numbers in `03-teardowns/enviory/dossier.md` with the guest-page captures (`python3 -B _tools/capture/summarize-captures.py --competitor raw/enviory`, exclude `wrapper=True` and any superseded ID); re-check §10/§12; update `_progress.md` + `_evidence-index.md` (R10).
6. Katsudoto dossier `03-teardowns/katsudoto/dossier.md` from `03-teardowns/_TEMPLATE-dossier.md`: C-KAT-101…106, S-KAT-001/002, plus one homepage/pricing WebFetch (S-KAT-003). Then the INVI dossier `03-teardowns/invi/dossier.md` (all six guest pages C-INV-111…116 are in, S-INV-001; wrapper C-INV-101 only as §2/§5 evidence).
7. Write the dossiers IDI, VID, WEV, IVT as their batch-A sets complete (step 3), same template and sources pattern (summarizer `--competitor raw/<dir>`, one homepage/pricing WebFetch each). After each: `_progress.md` + `_evidence-index.md` (R10).
8. Pending discovery (only while no batch runs): PPO card-detail pattern → whitelist in `_tools/discovery/select-demos.py` (`OFFICIAL`) → `python3 -B _tools/discovery/select-demos.py --only PPO --out 04-template-benchmarks/queues/queue-tier-a-5.tsv`; JOY (1 link); RSV `--catalog https://rsvpify.com/online-invitations/`; BRN sample shape; STM theme demos on `https://sitemu.id/product`; SMO plain-fetch profile only (never bypass); PTF secondary sources; PLO Play listing + APK metadata via REA (never commit the APK). Run `python3 -B _tools/safety/redact-discovery.py --check` after any discovery.
9. Phase 4 completion: `04-template-benchmarks/tiers.csv`, `blueprints/<id>.md`, `tier-aggregates.csv` (exclude wrappers); add the protocol §3 checks to `_tools/capture/capture.mjs` (360×800, WhatsApp/Instagram UA + audio unlock, long name via `?to=`, RTL, WIB/WITA/WIT) → protocol v2; tune the section detector. Before Phase 7.3, re-verify the palette in `01-codebase-audit/style-observations.md` against `app/globals.css` (§6).
10. At each phase end: `source /vercel/share/work/tools/env.sh && bash invitation-research/_tools/ops/make-handoff-zips.sh` (repo root) and show both zips from `/vercel/share/artifacts/`. Then continue in prompt order: Phase 5 → 6 → 7 (★ harness) → 8 → 9, using `prompt-map.md` as the deliverables checklist and keeping new files in the layout of `../README.md`.

## 5. Decisions (session 05)
- Group files by nature: documents in phase folders, scripts in `_tools/`, machine data in `raw/`, queues in `queues/` (Q-D15, D-009). Reason: the owner asked for it, and one rule per kind of file makes new work land in the right place.
- Keep scripts exactly two levels below `invitation-research/`. Reason: they compute the research root as `../..`, so the move needed no logic change.
- Archive only what is unused and not part of the current project (Q-D16, D-010). Reason: a LOCKED router, code comments (`next.config.ts` → `docs/AUDIT-2026-07-27.md`) and configs cite the other old-looking files.
- Product code stays byte-identical (scope guard). Reason: makes "no product change" verifiable with one diff.
- Store the owner's briefs verbatim in the repo. Reason: paste links can expire, and the handoff must work from the repo alone.
- Leave session logs 01–04 untouched and resolve their old paths through the path table. Reason: they are append-only history.
- Re-captures get new IDs instead of overwriting. Reason: evidence stays immutable and traceable.

## 6. Open problems, blockers, unverified
- **Enviory C-ENV-112/113** look incomplete (≈ ⅓ of the DOM of the other guest pages); the theme of all six is [INFERRED] (identical page titles). Step 4.
- Chrome was left idle on CDP :9222 at the s05 checkpoint. Reuse it if `curl -s 127.0.0.1:9222/json/version` answers; otherwise restart per step 2 (stale locks are cleared automatically).
- **Palette source:** Phase 1 `style-observations.md` / `template-system.md` cited values from the old `tokens.css`, which no page imports. Re-verify against `app/globals.css` before the style-DNA skill.
- TBT caveat: the platform's `next dev` ran during captures; re-check outliers before TBT becomes a threshold.
- Naming hazard: `C-INV-0xx` = our own Invitesion, `C-INV-1xx` = INVI.ID.
- History (Q-O07): older pushed commits on `v0/faznode-3b993736` still hold 35 Indoinvite showcase links and 58 Katsudoto subdomains; rewriting history is the owner's call.
- Old-brand naming left in product config (`.env.example` defaults `vienne`, `.claude/launch.json` config `vienne-dev`): debt QA-025, owner's call.
- Private evidence (thumbnails, Lighthouse JSON) lives only in `/vercel/share/work/invitesion-private`; it is lost if the sandbox is wiped. Regenerate the private zip whenever possible.
- Repo dependencies are NOT installed (the platform's `node_modules` belong to its scaffold); typecheck/test/build need `CI=true pnpm install --frozen-lockfile` + local Postgres (`00-setup/setup-log.md`).
- Owner questions open in `../_open-questions.md` §B: Q-O01–Q-O07.

## 7. Environment notes
- Persisted: `/vercel/share/v0-project`. `/vercel/share/work/*` (tools, research git, private evidence, logs) and `/tmp` survived every restart so far, but do not rely on it.
- Rebuild: `bash invitation-research/_tools/ops/bootstrap-sandbox.sh git | tools | chrome | check`, then `source /vercel/share/work/tools/env.sh` (`REA_NODE REA_BIN LH_BIN CHROME_PATH INVITESION_PRIVATE_DIR CDP_HTTP GIT_RESEARCH`).
- Checks: `"$REA_NODE" --test invitation-research/_tools/capture/robots.test.mjs` (6/6); `python3 -B invitation-research/_tools/safety/redact-discovery.py --check`; before committing: `GIT="$GIT_RESEARCH" bash invitation-research/_tools/safety/commit-guard.sh` (repo root).
- Always run Python with `-B` (no `__pycache__` next to the tools).
- Tool quirks: the Bash tool drops output (redirect to a file, then Read it); `diff` is not installed; `rm -rf` is blocked (use the Delete tool); TaskStop does not kill grandchildren (use `pkill -f` with a `[x]` pattern).
- WIP files: none. Generated files: `04-template-benchmarks/queues/*.tsv`, `04-template-benchmarks/captures-summary.csv`; captures land one at a time in `raw/<competitor>/` (atomic writes).

## 8. Do not redo (finished and verified)
- Skills vetting + install (20 core), `SKILLS-LOCK.md`, REA playbook, the capture pipeline.
- Phase 1 docs + own captures C-INV-001…004 (unless product code changes); Phase 2 longlist/rubric/tiers.
- Discovery for IDI, INV, IVT, VID, WEV, ENV, KAT, PPO, JOY; Katsudoto placeholder checks S-KAT-001/002; INV iframe targets S-INV-001.
- Tools: `robots.mjs` (6/6), `bootstrap-sandbox.sh`, `select-demos.py`, `summarize-captures.py`, `redact-discovery.py`, `make-handoff-zips.sh`, protocol v1.1, dossier template.
- Enviory dossier v1 §1–3, §5–12 (only §4 waits for step 5).
- Captures with Lighthouse OK and `wrapper=False`: C-IDI-101, C-IVT-101, C-VID-101, C-WEV-101, C-KAT-101…106, C-ENV-111/114/115/116 (C-ENV-112/113 pending step 4), C-INV-111…116. Wrapper captures C-ENV-101…106 and C-INV-101 stay as evidence; do not re-capture them.
- **Session 05 reorganisation + archive + prompt map + verbatim briefs.** Do not move files back or re-split `_tools/` by phase.
- Secrets scan (2026-10-29T03:31Z, 2 LOW, triaged).
