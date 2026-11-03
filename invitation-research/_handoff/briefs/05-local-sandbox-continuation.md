# Local-sandbox continuation and manual-push handoff brief (verbatim copy)

> Source: https://ctxt.io/3/qovXGH9Oo, captured 2026-11-03T16:14Z (session 08) with curl (raw HTML, HTTP 200, 70,829 bytes) + a line-preserving HTML-to-text pass (one `<div>` of the paste = one line). Owner instructions, not untrusted content. SHA-256 (first 16 hex) of the verbatim text below: `93e1f60d44da8d1d`.
> Authority (session 08 onward), per its §3: 1. subsequent explicit owner instructions and **this brief**; 2. `03-standalone-continuation-brief.md` for the complete mission requirements; 3. applicable repository guidance; 4. earlier briefs and logs as provenance. It overrides brief-03 wording that would require the original chat or a GitHub-connected chat, treat a disconnected local copy as invalid, forbid local branches/commits in every environment, or let another chat's uncommitted work block progress. Remote publishing stays forbidden.
> Extraction note: the reader-mode fetch of the same page dropped lines again ("Make explicit:", both "Record:" lead-ins, the harness CLI list `new`/`check`/`bench`/`preview`/`snapshot`/`report`, "Dogfood:", the closing line); this copy was made from the raw HTML and has them. No `04-…` brief exists in the accessible snapshot (`2c94140`); the owner named this file `05-…` (a `04` may exist in the stopped session's unexported work, which is unavailable). Requirement map: `../prompt-map.md`. Resume entry point: `../LATEST.md`.

---
# Invitesion — Independent Sandbox Continuation and Manual-Push Handoff

Continue the Invitesion project in YOUR OWN LOCAL SANDBOX.

I will push the results manually. You are explicitly authorized to obtain the public repository snapshot, create an isolated local working copy, restore the required tools, modify the project, run checks, and prepare the updated files for manual publishing.

A blank starter project, missing `.git`, missing GitHub connector, or chat that is not connected to the original repository is an expected starting condition—not, by itself, a blocker.

## 1. Explicit workspace authorization

My intended workflow is:

1. You obtain the existing Invitesion project.
2. You work on an isolated copy in your own sandbox.
3. You preserve the completed work through the platform’s persisted project files and available download/artifact mechanisms.
4. You hand me the updated project and a precise change manifest.
5. I handle GitHub synchronization and pushing separately.

“Fork” here means an independent local working copy. A remote GitHub fork is not required.

You do not need:

- The original Session 07 chat.
- A GitHub-connected chat.
- GitHub write credentials.
- Permission to push.
- Access to another agent’s live workspace.

Do not stop merely to tell me to move this prompt to another chat or connect a GitHub integration. Establish the authorized local workspace and continue.

The no-push rule prohibits remote publishing. It does NOT prohibit:

- Public cloning or fetching.
- Downloading an official public source archive.
- Creating an isolated local branch.
- Local edits and tests.
- Local commits in a dedicated checkout, where useful.
- Saving the updated project and handoff artifacts.

Preserve platform-managed Git metadata. Local commits outside the persisted project are not sufficient persistence by themselves.

## 2. Repository, integration target, and baseline

Source repository:

https://github.com/faznode/invitesion

Owner’s eventual integration branch:

`v0/faznode-3b993736`

Branch URL:

https://github.com/faznode/invitesion/tree/v0/faznode-3b993736

Last verified owner-synchronized commit:

`2c94140313edcc4a0af7fcea5622f4f73794c63d`

Title:

`docs: sync invitesion-lr research snapshot`

Reference tree:

`4d2782391b198cde99c7bd27039d3d59a43f72f6`

This is a historical reference, not an instruction to reset existing work. Check the public branch for newer commits when accessible and record the actual baseline used.

The temporary helper repository `invitesion-lr` is not required and may be deleted by the owner.

A previous agent briefly resumed after clarification about sandbox work, then was stopped. Its unexported changes have not been supplied here.

If a newer handoff or exported project is available, inspect and reconcile it. Otherwise:

- Use the accessible repository snapshot.
- Record that the other chat’s unexported changes are unavailable.
- Do not claim to have inspected or preserved inaccessible files.
- Do not let hypothetical changes in another sandbox block this isolated working copy.

The owner will reconcile any separate work during manual synchronization.

## 3. Instruction authority and saved briefs

Apply:

1. Subsequent explicit owner instructions and this prompt.
2. `invitation-research/_handoff/briefs/03-standalone-continuation-brief.md` for the complete mission requirements.
3. Applicable repository guidance within this authorized scope.
4. Earlier briefs and logs as provenance.

This prompt explicitly overrides earlier wording that could imply:

- Work must happen in the original chat.
- The chat must be connected to GitHub.
- A disconnected local copy is invalid.
- Local branches or commits are forbidden in every environment.
- The absence of another chat’s uncommitted changes prevents all progress.

The full unfinished mission remains in scope.

No expired ctxt.io link is required.

Save this instruction as:

`invitation-research/_handoff/briefs/05-local-sandbox-continuation.md`

Preserve existing briefs. If that filename already contains different instructions, use a new numbered or dated filename.

Start a new appropriately numbered session record; do not rewrite Session 07’s historical log.

## 4. Establish the workspace before declaring a blocker

### 4a. Inspect the current sandbox

Determine:

- Actual project directory.
- Existing files.
- Whether it is only a platform starter.
- Whether any Git metadata belongs to the platform.
- Which directories persist across turns or downloads.
- Whether there are meaningful existing user changes.

A missing repository does not end orientation. It triggers project acquisition.

### 4b. Obtain the public project

Preferred method: public clone of the target branch into a new isolated directory.

GitHub authentication is not required for a publicly accessible repository.

If ordinary Git acquisition is unavailable, try an official public GitHub archive of the verified branch/commit using the environment’s supported download tools.

These acquisition alternatives apply to the owner’s public repository. They do not authorize bypassing competitor access controls.

Record:

- Repository.
- Branch.
- Base commit and tree when obtainable.
- Acquisition method.
- Relevant environment limitations.

If using an archive without Git history, preserve an untouched baseline and enough metadata to compute a reliable change manifest.

Only an actual failure to obtain any authorized source copy after reasonable supported attempts is a source-access blocker. Missing chat integration or credentials alone is not.

If acquisition fails, report the exact attempted method and error. Do not describe “not connected to GitHub” as the technical cause without evidence.

### 4c. Choose the working arrangement

For a normal sandbox, work in a dedicated checkout. An isolated local branch such as `codex/invitesion-resume` is allowed.

For a v0-style persisted project:

- Import the project files into the actual persisted project area.
- Keep research Git metadata outside it if required.
- Do not replace the platform’s own `.git`.
- Preserve the connection between external Git metadata and the correct worktree.

The repository bootstrap already supports an external research Git arrangement. Inspect its current implementation before using it.

Historical path:

`invitation-research/_tools/ops/bootstrap-sandbox.sh`

Relevant configuration includes `WORK`, `PROJECT`, `REPO_URL`, `BRANCH`, and `LOCAL_BRANCH`.

Set these for the actual environment rather than blindly copying old sandbox paths.

Before replacing starter files:

- Inventory them.
- Preserve meaningful unknown changes.
- Use an isolated copy or safe backup where necessary.
- Remove or replace only confirmed starter artifacts that conflict with the imported project.

Do not indiscriminately delete untracked files.

### 4d. Make results persistent

If the working checkout is outside the platform’s persisted area, arrange persistence before substantial edits.

Updated files must end up in the persisted project or a usable downloadable artifact.

An ephemeral checkout, a local commit in a disappearing directory, or a final prose summary alone is not an adequate deliverable.

## 5. Tiered orientation after acquisition

Read first:

1. Applicable `AGENTS.md`, `CLAUDE.md`, and workflow guidance.
2. `invitation-research/_handoff/LATEST.md`.
3. The newest session file.
4. `_handoff/review-20261101.md`, treating stale status rows cautiously.
5. Brief 03’s safety, mission, and current-task sections.

Then begin the first corrective task.

Read other files when needed:

- `invitation-research/README.md`
- `_progress.md`
- `_handoff/prompt-map.md`
- `_open-questions.md`
- `_evidence-index.md`
- `_rea-playbook.md`
- `00-setup/rea-verification.md`
- `00-setup/privacy-hygiene.md`
- `04-template-benchmarks/protocol.md`
- `04-template-benchmarks/benchmark-exclusions.csv`
- Relevant scripts, captures, dossiers, and product documentation

Paths above are under `invitation-research/` unless otherwise stated.

Read relevant requirements fully before executing or finalizing their phase. Do not spend the whole session rereading unrelated historical material.

On later resumes, begin with LATEST and the newest session record.

## 6. Toolchain and REA

Official REA source:

https://github.com/morluto/rea

Use REA as the primary instrument where it supports the target. Document custom CDP/Lighthouse steps used for gaps.

Read:

- `invitation-research/_rea-playbook.md`
- `invitation-research/00-setup/rea-verification.md`

Previous verified tooling included:

- Node 24.
- REA 6.8.0.
- Lighthouse 12.8.2.
- Chromium/CDP.

These are historical pins. Verify the current environment and preserve measurement comparability unless a documented reason justifies changing versions.

Do not automatically repeat the completed REA learning and source-verification phase.

A fresh sandbox may lack every tool and process. Restore only what is needed.

Historical scripts:

- `_tools/ops/bootstrap-sandbox.sh`
- `_tools/ops/local-stack.sh`

Bootstrap subcommands include `git`, `tools`, `chrome`, and `check`; verify current behavior.

Inspect scripts before execution. Do not assume their Linux package-manager commands work unchanged in every environment. Adapt isolated setup when necessary without altering global agent configuration.

Run setup in the background when supported and do reconciliation or documentation meanwhile.

Background processes can die when the sandbox ends. Every long job must be resumable.

Only one measurement batch may run at a time. Redirect long output to logs and inspect the result.

## 7. Saved checkpoint to reconcile

The last inspected synchronized snapshot contained:

- 71 changed paths: 24 added, 47 modified.
- All changes under `invitation-research/`.
- No product-code changes.
- 64 raw capture summaries.
- 64 rows in `raw/_captures.csv`.
- 64 rows in `04-template-benchmarks/captures-summary.csv`.
- No duplicate IDs or missing/orphaned references.
- Five Tier-A dossier files:
  - Enviory v2.
  - Invitato v1.
  - Wevitation v1.
  - Katsudoto v1.
  - INVI v1.
- Three Barunson captures, but no international dossier.
- Twenty-four exclusion rows:
  - Seventeen with scope `all`.
  - Seven with scope `structure`.

Recompute if newer files exist.

### Completed work to carry forward

- Session-07 Indonesian capture batch: ten captures.
- Barunson batch: three captures.
- Enviory dossier v2.
- Invitato dossier v1.
- Wevitation dossier v1.
- Evidence-index updates.
- Slug/name redaction improvements.
- Robots fetch-failure correction.
- Exclusion register.

The ten Indonesian captures:

- C-IVT-104
- C-VID-104…106
- C-WEV-104…106
- C-IDI-105…107

Barunson: C-BRN-101…103.

Capture existence does not establish benchmark eligibility.

Do not restart from the older checkpoint that described Enviory v2 and these batches as unfinished.

## 8. Binding evidence corrections

### Indoinvite — D-020

C-IDI-101…107 are catalog/SEO pages, not guest invitation pages.

They cannot support guest-page performance or interaction benchmarks.

A linked preview exposed a real event. The previous agent stopped and retained only non-identifying findings.

Do not revisit account-based real-event previews.

Current eligible guest-page capture count: zero.

### Viding — D-022

C-VID-104…106 were captured while the studio host’s robots.txt returned HTTP 500 under the old permissive policy.

They are excluded from quantitative benchmarks.

Corrected project policy:

- Successful response: parse rules.
- Unavailable 4xx: no rules, except 429 is treated as disallow.
- 5xx, 429, or network failure: disallow.

Do not resume the cancelled studio-host probe while the restriction remains unresolved.

Use C-VID-101…103 with explicit interaction limitations.

### RSVPify — S-RSV-002

A reader fetch followed a Cloudflare challenge. That content was excluded as a process deviation.

Do not restore or cite that pricing content.

After a challenge, do not switch clients, readers, proxies, or routes to retrieve the challenged competitor content.

### Privacy — D-019 and D-021

Invitato identifying slugs were tokenized and names redacted.

Redaction was widened to competitor-demo summaries while retaining generic role labels.

Historical JS/Python parity results were 23/23 affected files and later 58/58 in-scope files. Do not claim a fresh rerun without performing it.

Seven robots tests and three privacy checks passed during the owner-side inspection.

## 9. Task A — repair active handoff inconsistencies

Saved records contain different checkpoint ages.

Examples:

- Completed batch still described as running.
- Enviory v2 still described as unfinished in some rows.
- Outdated dossier and working-tree counts.
- A review resume section still suggesting the cancelled Viding probe.
- An environment note saying 6/6 robots tests instead of 7/7.

Recompute and repair the minimum coherent set:

1. Update LATEST and affected living reconciliation rows.
2. Remove cancelled actions from active next actions.
3. Clearly identify the current status source.
4. Preserve historical session logs.
5. Keep historical prompt-map rows labelled as history.

Do not polish old entries merely for consistency. Correct stale active instructions.

## 10. Task B — focused benchmark correction

Inspect:

- `_tools/capture/summarize-captures.py`
- `_tools/capture/dossier-digest.py`
- `04-template-benchmarks/benchmark-exclusions.csv`
- Any existing aggregate consumers

The inspected summarizer and digest did not automatically apply the exclusions.

Deliver three small increments. Avoid a general tooling rewrite.

### B1. Eligibility

Implement consistent rules:

- `scope=all`: exclude from benchmarks.
- `scope=structure`: exclude structural/interaction use while retaining otherwise valid cold-load eligibility.
- Consider page classification, measurement success, and method.
- Lighthouse success does not turn a catalog, wrapper, or marketing page into a guest-page benchmark.
- Curated corrections cannot be silently overridden by heuristics.
- Report invalid scopes, references, and contradictions.
- Retries must not inflate unique coverage.
- Preserve relevant theme identifiers when deduplicating.

Retain raw evidence. An inventory can contain all captures with explicit eligibility/reasons.

Regenerate affected derived outputs and save with targeted checks.

### B2. Measurement-source separation

Make explicit:

- Lighthouse cold-load transfer and requests.
- Post-visit/open/scroll CDP transfer and requests.
- Bytes versus KiB.
- Cover detected.
- Click attempted.
- Gate opening verified.
- Audio playback verified.

Do not label CDP totals as Lighthouse measurements.

Keep consumers compatible or update them together. Document schema changes.

Save B2 with targeted checks.

### B3. Offline regression verification

Using existing evidence and small fixtures, verify:

1. Indoinvite catalogs are excluded.
2. C-VID-104…106 cannot enter quantitative aggregates.
3. Structure-only exclusions preserve valid cold-load evidence.
4. Failed Lighthouse results cannot enter relevant aggregates.
5. Retries do not inflate unique sample counts.
6. Privacy checks retain generic placeholders and redact names.
7. Derived values and units trace to their correct raw sources.

Also verify invalid exclusion definitions are handled explicitly.

Tests accompany implementation; B3 completes combined verification.

Do not request new competitor captures to test this logic.

## 11. Task C — tighten performance conclusions

Stored Wevitation figures were independently recomputed:

- Performance median: 40.
- LCP median: approximately 17.41 seconds.
- TBT median: approximately 982 ms.
- Lighthouse transfer median: approximately 3,448 KiB.
- Transfer ratio against C-INV-005: approximately 10.74.

These support comparison of those recorded lab measurements.

Correct “faster on every Core Web Vital.” INP was not established; TBT is not INP.

Carry forward C-INV-005’s limitation:

- Local production-build measurement variant.
- Middleware omitted because placeholder Clerk keys caused problems.
- Does not establish real-key authentication, middleware, CSP, locale-cookie, or full production behavior.

Preserve useful comparisons with precise scope.

## 12. Parallel ADRs and provisional masterplan

Owner-question ADRs and masterplan drafting may proceed before the research gate.

Do them alongside research or background setup:

- Resolve safe defaults.
- Draft current-state findings.
- Record evidence coverage.
- Structure the backlog.
- Draft architecture alternatives.
- Assemble flows.
- Draft the roadmap.

Mark affected documents `DRAFT / PROVISIONAL`, with evidence cutoff and dependencies.

Write coherent useful drafts, not empty scaffolds.

Do not finalize the masterplan before the applicable planning gate or begin product P0 implementation before masterplan finalization.

Revise conclusions as evidence changes.

## 13. Remaining research and bounded demo search

Last verified Wave-1 status:

- Capture breadth: 5/8 Indonesian competitors.
- Indonesian dossiers: 4/8.
- International dossiers: 0/5.

Top-eight Indonesian set:

1. Indoinvite
2. PALEO
3. SatuMomen
4. Wevitation
5. Viding
6. Enviory
7. Invitato
8. INVI.ID

Katsudoto does not substitute for an unfinished top-eight competitor.

Next work:

1. Viding dossier from permitted captures and marketing evidence.
2. Indoinvite dossier from catalog/public evidence without guest-page benchmark claims.
3. PALEO and SatuMomen dossiers from permitted evidence.
4. International dossiers:
   - Barunson.
   - Paperless Post.
   - RSVPify.
   - Joy.
   - Partiful.

Use preserved evidence before requesting more.

The Indonesian/English detector missing Korean features does not prove their absence.

### Bounded search

For Indoinvite, SatuMomen, and PALEO:

- Review previous discovery.
- Make one focused official-source pass for verified public placeholder demos.
- Inspect relevant permitted homepage/catalog/help/store surfaces.
- Record sources checked and results.
- Stop if progress requires private access, signup, protection bypass, personal-event inspection, or repeated speculative crawling.

Do not repeat an equivalent failed search with another tool.

This is a bounded discovery pass, not an arbitrary minute limit.

## 14. Strict Wave 1 and ADR-W1 fallback

Strict Wave 1 requires:

- Dossiers plus at least three valid demos for each top-eight Indonesian competitor.
- Dossiers for all five international competitors.

Do not report missing criteria as passed.

If the bounded search confirms unavailable or insufficient safe public demos, this prompt authorizes ADR-W1.

Record:

- Strict requirement.
- Blocked competitors and missing evidence.
- Existing searches and final focused pass.
- Why further attempts are unproductive or outside scope.
- Affected conclusions and confidence.
- Revisit triggers.
- Decision to proceed.

Fallback requirements:

1. Dossiers for all eight Indonesian competitors.
2. Dossiers for all five international competitors.
3. At least three valid demos wherever enough permitted official demos exist.
4. Where fewer exist, all safely available eligible samples plus an explicit exception.
5. Confidence limits recorded.
6. Exclusions fully respected.
7. No invalid sample counted to improve coverage.

Report separately:

- Strict Wave 1: met / not met.
- Planning gate: met literally / met through ADR-W1 / not met.

ADR-W1 is a reduced-confidence exception, not literal satisfaction of strict Wave 1.

After either valid planning route, finalize the masterplan. Deeper research becomes tracked addenda.

## 15. Complete the full mission

Brief 03’s remaining deliverables remain applicable.

### Research and analysis

- At least 12 substantive Indonesian profiles.
- At least 10 substantive international profiles.
- Ten Indonesian and five international Tier-A dossiers with evidence limits.
- Tier-B profiles.
- Creator, guest, host-day-of, reseller, and post-event flows.
- Sample blueprints and tiers.
- Eligible aggregates with sample counts/confidence.
- Updated own-product audit and actual style-DNA evidence.

A longlist row is not a substantive profile.

### Supporting plans

Complete:

- `05-feature-matrix/`
- `06-gap-analysis/`
- `07-ideation/`
- `08-backend-rust-plan/`

Include:

- At least 150 evidence-linked feature rows.
- Upgrade map tied to modules and paths.
- Strengths to preserve.
- At least 25 scored original ideas and detailed top ten.
- Owner-question ADRs.
- Measured current-stack versus Rust evaluation and isolated spike.
- Justified P0 list.

Preserve the current stack by default. Rust requires measured justification for specific hot paths.

### Masterplan

Complete `09-masterplan/` documents 00–13:

- Index.
- Bilingual executive summary.
- Evidence coverage.
- Market/competitors.
- Current state.
- Feature matrix/gaps.
- Backlog.
- Canonical flows.
- Template system/harness.
- Backend/frontend architecture.
- Privacy/security/payments.
- Pricing/growth/roadmap.
- ADRs.
- Appendix.

Each P0 needs evidence, acceptance criteria, tests, dependencies, risk, effort, and rollback.

Include a recommended 90-day sequence.

### Product P0

After masterplan finalization:

- Implement in dependency order.
- Use small increments.
- Run relevant tests and repository checks.
- Preserve published invitations, niches, authorization, and payments.
- Keep risky changes reversible.
- Record measurements and limitations.
- Maintain `_handoff/IMPLEMENTATION-LOG.md`.

### Harness and skills

Complete the manifest and CLI:

- new
- check
- bench
- preview
- snapshot
- report

Complete performance, accessibility, motion, 3D fallback, personalization, localization, license, originality, and browser gates.

Create the required custom skills from Brief 03.

Dogfood:

1. Basic wedding.
2. Premium Islamic wedding.
3. Signature 3D/motion with fallbacks.

Prove happy paths pass and deliberate failures are caught.

Never generate religious quotations from memory. Use only approved verified material; otherwise omit quotation blocks and maintain the corpus instructions.

## 16. Autonomous decisions and boundaries

Make routine project decisions yourself, including open owner questions.

Choose safe reversible options, record ADRs or assumptions with revisit triggers, and continue.

Do not invent credentials, analytics, measurements, legal confirmation, consent, or approvals.

Maintain:

- Public pages and verified demos only.
- Robots/opt-out/pacing compliance.
- No protection bypass.
- No automated signups, purchases, or competitor form submissions.
- No hostile testing against competitors.
- No real customer personal data committed.
- No copied competitor code/assets/fonts/audio/wording.
- No secrets or private research in public deliverables.
- No APKs/videos/large binaries committed.
- `raw/` within the project cap.
- No production deployment or destructive operations.
- No remote publishing, git push, force-push, rebase, or history rewriting.

Public acquisition, isolated local work, and manual-push handoff are authorized.

## 17. Persistence and cross-agent handoff

After each completed task, append a concise session entry:

- Work completed.
- Files.
- Check result.
- Material limitations.
- Next action.

Update LATEST at deliverable boundaries and before a forced stop.

Refresh the full reconciliation at phase boundaries; update affected rows sooner when evidence, eligibility, or gate status changes.

Before substantial work depends on temporary files, ensure needed non-private results are persisted.

### Required owner handoff

Provide the actual updated project files through the platform’s persisted project/download mechanism.

Also provide a concise manifest containing:

- Source repository and integration branch.
- Base commit used.
- Resulting commit/tree identifier if available.
- Added, modified, deleted, and renamed paths.
- Checks run and outcomes.
- Remaining failures and limitations.
- Exact next actions.
- Which intended files are not yet committed locally, if any.

Account for new files, executable modes, symlinks, and intentional deletions. Do not hand over a patch that silently omits untracked new files.

An optional patch/archive is useful if supported. Verify that it includes the intended changes and excludes:

- `.git`
- `node_modules`
- `.next`
- Credentials and `.env` values
- Private research
- Temporary toolchains/databases
- Unnecessary large binaries

Do not create a public private-evidence bundle.

If producing a patch, identify its exact base and verify it can reconstruct the intended result on that baseline where feasible.

No particular archive format is mandatory. Actual accessible files are mandatory.

Local commits in a temporary directory do not replace this handoff.

### If another session must take over

LATEST must contain:

- Exact baseline.
- Actual workspace arrangement.
- Completed and incomplete tasks.
- Changed files and where they are persisted.
- Running jobs and verified state.
- Tool/environment dependencies.
- Checks and unresolved failures.
- Next concrete action.

Do not finish with only “continue in the original chat.”

Do not claim unavailable work from another chat has been recovered.

## 18. First response and execution order

After initial inspection, state briefly:

- How you acquired or located the source.
- Actual baseline commit.
- Where the independent working copy lives.
- How results will persist for manual pushing.
- First unfinished task.

Then execute.

Expected sequence:

1. Acquire and establish the independent workspace if absent.
2. Restore necessary tooling while doing document work.
3. Repair active handoff records.
4. Complete B1–B3.
5. Correct unsupported performance wording.
6. Continue dossiers and bounded demo discovery.
7. Draft ADRs/masterplan in parallel.
8. Apply the appropriate planning gate.
9. Finalize the masterplan.
10. Implement P0.
11. Complete and dogfood the harness.
12. Provide the updated project and manual-push handoff.

A blank sandbox is setup work. Lack of remote write access is compatible with this workflow.

Thank you, and please give this your best effort.
