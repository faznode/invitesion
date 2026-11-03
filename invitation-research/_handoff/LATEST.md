# LATEST: single entry point for resuming the Invitesion mission

> Overwrite this file at every checkpoint. History: `sessions/` (append-only). **Governing instruction: `briefs/03-standalone-continuation-brief.md`** (session 07 onward; the current consolidated owner instruction). Older briefs `00`–`02` are provenance only. Requirement reconciliation: `review-20261101.md` (status per brief section, Wave-1 table updated 17:36 UTC). Folder layout: `../README.md`. Phase board + decisions: `../_progress.md`. Questions: `../_open-questions.md`. Evidence: `../_evidence-index.md`.

| | |
|---|---|
| Session | **07** (in progress) |
| Start (UTC) | 2026-11-01T16:47Z · last checkpoint ≈ 17:49Z (both s07 batches finished; D-019…D-022; Wevitation dossier v1 done; robots 5xx handling fixed; next: Viding dossier from C-VID-101…103) |
| Session file | `sessions/session-07-20261101-1647.md` |
| Branch / commit | `v0/faznode-3b993736` @ `0ddd953` (owner sync of 2026-10-29T23:26Z; no newer commit on any branch as of 2026-11-01). Work lands through the platform's normal saving (platform commits so far: `e1a693b` 17:14Z, `270917c` 17:28Z); **never push, never rewrite history** |
| Working tree vs `0ddd953` | 38 modified, 20 new. New: `_handoff/briefs/03-…`, `_handoff/review-20261101.md`, `_handoff/sessions/session-07-…`, `03-teardowns/invitato/`, `queues/queue-tier-a-s07.tsv`, `queues/queue-intl-s07.tsv`, `_tools/safety/redact-demo-names.py`, 13 capture summaries (`raw/barunson/C-BRN-101…103`, `raw/indoinvite/C-IDI-105…107`, `raw/invitato/C-IVT-104`, `raw/viding/C-VID-104…106`, `raw/wevitation/C-WEV-104…106`). Modified: handoff/progress/index/privacy docs, Enviory dossier + api, `captures-summary.csv` (64 rows), `raw/_captures.csv`, two older queues + `discovery-IVT.json` + C-IVT-101…103 (D-019), 19 ENV/KAT summaries (D-017), `capture.mjs`, `pseudonymize.mjs`, `slug-rules.json`, `commit-guard.sh` |
| Research git | `/vercel/share/work/invitesion.git` (outside the project, worktree = project) on `v0/faznode-3b993736`; for `status`/`diff`/history only, no local commits |
| Resume protocol | On "continue": read this file + the newest session file → `source /vercel/share/work/tools/env.sh && $GIT_RESEARCH status --short \| head -30 && $GIT_RESEARCH log -5 --oneline` (if `env.sh` is missing, §7 rebuild first) → state the resume point in 2–3 lines → do §4 in order. **Log each finished task in the session file and here before starting the next** |

## 1. Status per brief area (detail: `review-20261101.md` §1–§2)
| Area | State | Where |
|---|---|---|
| Repo verification, orientation, brief saved | DONE s07 | `review-20261101.md` §0, `briefs/03-…` |
| REA verification (brief §8) | DONE s06; s07 runtime identical (REA 6.8.0 = npm latest) | `../00-setup/rea-verification.md`, `../_rea-playbook.md` |
| Privacy hygiene | DONE s06 + s07: **D-017** (demo names, 19 files), **D-019** (Invitato slugs + names, capture-time redaction, parity 23/23), **D-020** (Indoinvite catalog previews never captured) | `../00-setup/privacy-hygiene.md` |
| Skills (20 core), discovery (52 / rubric / Tier A 15), own audit docs | DONE (audit has open items: `tokens.css` palette, protocol-v2 own runs, revalidation leads) | `SKILLS-LOCK.md`, `../02-…`, `../01-…` |
| Tier-A dossiers | PARTIAL 5/15: ENV v2, IVT v1, **WEV v1** (all s07), KAT v1, INV v1 | `../03-teardowns/` |
| Benchmark pack | PARTIAL: protocol v1.1 (412×915 only), summary regenerated (64 rows), no blueprints / tiers / aggregates | `../04-template-benchmarks/` |
| Wave-1 gate | NOT MET: captures ≥ 3 for **5/8** (PLO, SMO, **IDI** missing; D-020), dossiers 4/8 (ENV, IVT, INV, WEV), international dossiers 0/5 (BRN has 3 captures) | `review-20261101.md` §2 |
| `_flows/`, Tier-B profiles, feature matrix, gap analysis, ideation, ADRs, Rust plan, masterplan, P0, harness + skills + dogfood | NOT STARTED | — |
| Blocked | verifying any `invitesion-cn` work after `ae355ce` (private mirror); production auth/middleware with real Clerk keys (P-INV-010); Android decompilation (no JDK 17 + JADX) | `review-20261101.md` §1 dependencies |

## 2. Running jobs (verify before trusting)
- **No capture batch running** (s07 batch done 17:14Z, Barunson batch done 17:32:08Z; logs `/vercel/share/work/logs/batch-s07.log`, `batch-intl-s07.log`). Check `pgrep -f "run-batch.s[h]"` before starting one; never two at once; every batch is a background task.
- **CDP Chrome** (background task): `curl -s -m 3 http://127.0.0.1:9222/json/version`; restart with `bash invitation-research/_tools/ops/bootstrap-sandbox.sh chrome` as a background task.

## 3. Done in session 07 (exact paths)
- Workspace restored from `0ddd953`; brief 03 saved verbatim; `review-20261101.md`; session file; `prompt-map.md` header.
- D-017: `_tools/safety/redact-demo-names.py`, guard check, 19 ENV/KAT summaries.
- `03-teardowns/enviory/dossier.md` **v2** + `api-observed.md`; `03-teardowns/invitato/dossier.md` **v1** + `api-observed.md`.
- Batch `queues/queue-tier-a-s07.tsv` 10/10 (C-IVT-104, C-VID-104…106, C-WEV-104…106, C-IDI-105…107) + per-row opening audit (evidence index s07).
- D-019: `slug-rules.json` (`ivt-template-couple`), rewritten queues/discovery/summaries/CSVs, `pseudonymize.mjs` `redactDemoNames()`, `capture.mjs` call; parity 23/23.
- First international captures: `queues/queue-intl-s07.tsv` → `raw/barunson/C-BRN-101…103.json`.
- Visitor reads indexed: S-IVT-001…005, S-BRN-001…004, S-PPO-001/002, S-JOY-001, S-RSV-001/002 (002 = excluded deviation), S-PTF-001, S-IDI-001…003. Private copies (not committed): `$INVITESION_PRIVATE_DIR/pages/`.
- D-020: Indoinvite reclassification (evidence index s07 rows, privacy doc, review discrepancy 8).
- `captures-summary.csv` regenerated (64 rows); `_evidence-index.md` session-07 section; `_progress.md` D-018…D-021 + session summary.
- D-021 (redaction for every competitor demo; `redact-demo-names.py`, `pseudonymize.mjs`, `capture.mjs`; C-WEV-101…106 titles).
- `03-teardowns/wevitation/dossier.md` **v1** + `api-observed.md` (S-WEV-001…005).

## 4. NEXT ACTIONS (in order; from the repo root)
1. **Environment** (only if processes or `/vercel/share/work` are gone): §7 rebuild; `.gitignore` must equal `$GIT_RESEARCH show HEAD:.gitignore` (the platform rewrote it at 17:14Z); run `GIT="$GIT_RESEARCH" bash invitation-research/_tools/safety/commit-guard.sh`.
2. ~~Wevitation dossier v1~~ DONE s07 17:45Z (`03-teardowns/wevitation/dossier.md` + `api-observed.md`; S-WEV-001…005; D-021 applied to its demo titles). Pattern for the next dossiers: digest → structure extract → visitor reads (robots first, one request at a time) → dossier → API notes → index rows → guard.
3. **Viding dossier v1** from C-VID-101…103 (`viding.co/theme/preview`, robots allow) + `viding.co` marketing reads. **No visit to `studio.viding.co`** while its robots.txt answers 5xx (D-022; the planned gate probe is cancelled). C-VID-104…106 are excluded (`benchmark-exclusions.csv`); the dossier may say only that a second, Next.js-based product generation exists on that host (observed before the fix), with no numbers from it.
4. **Indoinvite dossier v1** from catalog captures + S-IDI-001…003 only: catalog/content-theme architecture, guest-side commerce (gift shop, paid stickers, JASTIO), stack. **No guest-page benchmark numbers** (D-020); never open `/s/<account>/…` previews.
5. **Placeholder-demo search for IDI, SMO, PLO** (visitor-style; a demo counts only if verified placeholder per page, D-008). If none exists publicly, write an ADR per vendor (blocker, impact, reduced-confidence decision), visibly distinct from literal gate satisfaction (brief §14).
6. **International dossiers** BRN (3 captures + S-BRN-001…004), PPO, RSV (prices [UNKNOWN]; never cite S-RSV-002 content), JOY, PTF (private events out of scope).
7. **ADRs** for Q-O01…Q-O07 in `09-masterplan/12-decision-log.md` (can run alongside 2–6; defaults in brief §17).
8. Wave-1 gate → `05-feature-matrix/`, `06-gap-analysis/`, `07-ideation/`, `08-backend-rust-plan/` → masterplan 00–13 → P0 → harness (brief §15–21).

## 5. Decisions (latest first; full list `../_progress.md`)
- **D-022 (s07)** robots.txt answering 5xx/429 or unreachable = disallow, 4xx = no rules (RFC 9309; shared `robotsStatusVerdict()`); C-VID-104…106 excluded; every exclusion lives in `04-template-benchmarks/benchmark-exclusions.csv`, which all aggregates must honour.
- **D-021 (s07)** Demo-couple names redacted in every competitor demo capture (not only tokenized); generic role words stay; enforced at capture time and by the guard (parity 58/58).
- **D-020 (s07)** Indoinvite `/preview/*` = SEO article + catalog, not demos; C-IDI-101…107 never feed guest-page benchmarks; catalog previews render real events and are never captured; account ids and preview URLs stay out of committed files.
- **D-019 (s07)** Invitato template slugs tokenized + names redacted; `redactDemoNames()` at capture time.
- **D-018 (s07)** Follow-up captures get new ids and new queue files.
- **D-017 (s07)** Couple names on pseudonymized demos → `[name]`; guard check.
- **D-016 (s06)** Cover control: trusted CDP click on the settled first-viewport control after REA's scenario; the **opening verdict** is `features.coverGate` before → after (s07 audit), not the click flag.
- D-015 identifying slugs pseudonymized; D-013 Android only on redistributable APKs; D-012 own builds without `middleware.ts` while Clerk keys are placeholders; D-011 REA drives every capture.

## 6. Open problems, hazards, unverified (carry forward)
- **Aggregates must read `04-template-benchmarks/benchmark-exclusions.csv`** (24 rows: wrappers, closed covers for structure, IDI catalog pages, C-VID-104…106). A robots.txt answering 5xx/429 or unreachable blocks the host (D-022).
- **After any bot challenge (Cloudflare etc.) there is no fallback route** (no reader tool, no other client): record [UNKNOWN] (S-RSV-002 deviation, discrepancy 10).
- **D-008 before every new queue row:** S-IDI-003 showed a vendor-linked "contoh" page can be a real customer's event. Verify placeholder status per page; stop at the first personal data; keep only non-identifying facts.
- `coverClicked: true` ≠ opened. C-VID-104…106 undetermined; pre-D-016 demo captures (C-KAT-101…106, C-INV-111…116, C-VID-101…103, C-WEV-101…103, C-IVT-101…103, C-ENV-111/114–116) have valid Lighthouse but unverified gate/audio rows. Gate opening never proves audio playback.
- Feature detector keywords are Indonesian/English: Korean (BRN) and English-US pages need per-vendor reading before any feature-matrix row.
- `sectionCount` is unreliable for div layouts (Invitato, Barunson, the IDI catalog); never compare it across vendors without a note.
- Wrapper heuristic (< 200 nodes + same-origin iframe) also matches closed-cover guest pages (C-ENV-117/120).
- C-ENV-111/114/115/116 share `docHeight` 13,009 px across four `tpl` values → one layout family or a `tpl` fallback [INFERRED].
- Re-capturing Katsudoto, Enviory or Invitato rows needs `$INVITESION_PRIVATE_DIR/redaction-map.json` (lost with every sandbox): re-run discovery first (it rebuilds the map).
- P-INV-010: production middleware hangs with placeholder Clerk keys; unknown with real keys. Own captures lack CSP/locale-cookie/Clerk headers.
- `style-observations.md` / `template-system.md` cite `tokens.css` (never imported): re-verify against `app/globals.css` before the style-DNA skill.
- TBT caveat: the platform's `next dev` runs on the capture host. Naming hazard: `C-INV-0xx` = our Invitesion, `C-INV-1xx` = INVI.ID.
- Residual exposure (Q-O07, no history rewriting): research history `4794846`, `a5e119c`, `0ddd953` and platform `e1a693b` (details `../00-setup/privacy-hygiene.md` §4).

## 7. Environment notes
- Persisted: `/vercel/share/v0-project` only. `/vercel/share/work/*` (toolchain, research git, private evidence, logs, Postgres data, app snapshot) is lost when the sandbox is recycled (it was, before s06 and before s07).
- Rebuild: `LOCAL_BRANCH=v0/faznode-3b993736 bash invitation-research/_tools/ops/bootstrap-sandbox.sh git` → `… tools` (≈ 3 min) → `… chrome` as a BACKGROUND task → `source /vercel/share/work/tools/env.sh` (`REA_NODE REA_BIN LH_BIN CHROME_PATH INVITESION_PRIVATE_DIR CDP_HTTP GIT_RESEARCH`). In a sandbox whose project still holds the scaffold, write the tracked files with `$GIT_RESEARCH checkout-index -a -f`, then delete untracked scaffold leftovers (s07 recipe).
- Own instance: `bash invitation-research/_tools/ops/local-stack.sh up`, then `local-stack.sh start` in the background → `http://127.0.0.1:3100/i/budi-sari/<guest>` (guests: budi-hartono, nama-panjang, hostile-name, rtl-name, emoji-name; also `/i/dimas-laras-makassar/<guest>`). Postgres `127.0.0.1:5433`, db `invitesion`.
- Checks: `"$REA_NODE" --test invitation-research/_tools/capture/robots.test.mjs` (6/6); `python3 -B invitation-research/_tools/safety/{redact-discovery,pseudonymize-slugs,redact-demo-names}.py --check`; before any checkpoint `GIT="$GIT_RESEARCH" bash invitation-research/_tools/safety/commit-guard.sh`.
- Tool quirks: run Python with `-B`; redirect long output to a log and Read it; `rm -rf` is blocked (Delete tool inside the project; plain `rm -f` + `rmdir` for `/tmp` scratch); TaskStop does not kill grandchildren (stop the parent task first, then `pkill -f` with a `[x]` pattern); Bash cannot read `user_read_only_context/`; Node's test runner prints `ℹ pass N`; `robots.mjs` exports `robotsVerdict(text, pathWithQuery)` (fetch the robots text yourself).

## 8. Do not redo (finished and verified)
- Skills vetting + install (20 core), `SKILLS-LOCK.md`; Phase 1 docs + C-INV-001…005; Phase 2 longlist/rubric/tiers.
- REA re-verification (s06). Re-run `rea-smoke.mjs` only after an REA version change.
- Step-1 review (s06) and the s07 review; privacy hygiene s06 + D-017 + D-019 (run the fixers only if a `--check` fails); the 23/23 parity test.
- Discovery for IDI, INV, IVT, VID, WEV, ENV, KAT, PPO and JOY (robots-fixed); all S- reads listed in the evidence index (re-read only for a new question).
- Captures with Lighthouse OK (`captures-summary.csv`, 64 rows), incl. the s07 batch and C-BRN-101…103. Wrappers C-ENV-101…106 and C-INV-101, cold-load-only C-ENV-112/113/117…121 and the IDI catalog captures stay as evidence; do not re-capture.
- s05/s06 reorganisations (`_tools/`, `queues/`, `raw/_discovery/`, `archive/`, `docs/specs/`, `docs/worklog/assets/`): never move files back.
