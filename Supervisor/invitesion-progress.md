<!-- SUMMARY (first 7 lines — greppable) -->
# invitesion-progress.md — Supervisor companion: master progress checklist and wave tracker (§18)
> WHAT: What is done, partial, open, external and gated across the platform (§1–§13 mirror S1 §7.1–§7.13), the decision and acceptance mirrors (§14–§17) and the wave tracker with checkboxes (§18). Reconstructed by session 56 from repository evidence; the original was never stored in the repository.
> STATUS: ACTIVE, reconstructed (s56, 2026-11-20, by the owner's instruction to write it "from your own evidence"). Baseline `develop` `ba0049c` / tree `14c450f`; W0 and W1 closed; W2.0 and W2.1 closed; next W2.2 (not started).
> OWNER: Supervisor. Written by the Operator of session 56; later sessions edit it in place and keep corrections visible.
> DEPS: Supervisor/invitesion-prompt-s1.md, Supervisor/invitesion-prompt-s4.md (untracked copy), Supervisor/invitesion-session-54-report.md, Supervisor/invitesion-session-55-report.md, Supervisor/invitesion-auditmap.md, invitation-research/_handoff/LATEST.md, invitation-research/_handoff/IMPLEMENTATION-LOG.md, invitation-research/_handoff/sessions/session-56-20261120-0034.md
> GREP: supervisor, progress, companion, wave tracker, §0, §18, W0, W1, W2, W2.0, W2.1, F3, F4, F5, reconstructed, s56, AM-010, AM-011, AM-061, E-106, D-073, W2.2, handoff
> UPDATED: 2026-11-20 (s56: reconstructed; W0 and W1 merged from the s54 and s55 reports; W2.0 closed; W2.1 closed with E-106 and D-073; session 56 handed off before W2.2)

---

## How this file was made
- **Why reconstructed:** S1 (§0, §3.3, §8) and S4 cite this file, but no copy exists at `ba0049c`, on any remote branch or anywhere in the history (session 56 worksheet, resume point). On 2026-11-20 the owner instructed session 56 to write it inside the project tree from its own evidence instead of waiting for files.
- **Sources, in order:** the code at `14c450f` (lines marked "s56 check" were verified against it on 2026-11-20); S1 §7–§8 (the specification as of 2026-11-16); Part B of the session 54 and 55 reports (changes that were never merged into a companion) with the Post-F4 addendum; S4 §2; `LATEST.md`, `IMPLEMENTATION-LOG.md` and the session 54–56 worksheets.
- **Not copied from the lost original.** Where its wording or ordering mattered, the audit map says so instead of guessing.
- **Status words:** DONE; DONE (sandbox) = closed with sandbox evidence, never production acceptance; PARTIAL; OPEN; EXT = the agent prepares, the owner executes; GATED = an owner decision comes first; BLOCKED-EVIDENCE = the scope is not recoverable from the repository; WATCH.

## §0 Mapping summary (2026-11-20, s56)

| Wave | Items | Done | Open | EXT / GATED | Freeze |
|---|---|---|---|---|---|
| W0 Baseline, records, F3 | 5 | 5 | 0 | — | F3 = local `8485cc8` / `36fd47a`; published `4e36e20` / `c4d20cc` (code equal to F3) |
| W1 Security and correctness | 6 | 6 (sandbox) | 0 | — | F4 = local `0ef8c7d` / `3c2b287`; published through the owner's import `ba0049c` / `14c450f` |
| W2 Customer and guest UX | 6 (W2.0–W2.5) | 2 (W2.0, W2.1) | W2.2–W2.4; W2.5 pending its evidence search | — | F5 pending |
| W3 Admin console | 6 | 0 | W3.1–W3.3; W3.4 after the owner confirms scope | W3.5 partly GATED; W3.6 GATED | — |
| W4 Platform hygiene | 7 | 0 | W4.1–W4.4, W4.7 (sandbox only); W4.5 (AGENTS.md part needs approval); W4.6 (owner picks a tool) | — | — |
| W5 Release readiness | 7 | 0 | — | 7 EXT | — |
| W6 Decision-gated scope | 4 | 0 | — | 4 GATED | — |

- **Lowest open wave:** W2. **Next item:** W2.2 (AM-011), not started.
- **Published baseline:** `develop` `ba0049c3bbb06c9daa346be43244465f85c81989`, tree `14c450f88f056c20940965e81110b2d132610b21`, 2,346 paths. Local work since then is on branch `agent/s56-w2`. By the owner's instruction of 2026-11-20 (turn 3), session 56 tried to push that branch to origin as a separate branch. The push failed for want of GitHub credentials and nothing was published, so the handoff is a full-diff patch from `ba0049c` (worksheet, LATEST).
- **Gates on `14c450f` (s56):** app 909 / 909, database 15 / 15, rust 23 / 23, product-gates 18 / 18; research fails there on one records reference and passes 10 / 10 once that is fixed (W2.0, AM-061).

## §1 Marketing, catalog and wizard (S1 §7.1)
- DONE: S1 §7.1 "Built" (homepage ID / EN, `/pricing`, catalog of 64 templates, 92 programmatic pages, help centre, wizard behind `FLAG_CREATION_WIZARD`, off).
- OPEN: robots and sitemap (W2.2, AM-011). s56 check: `app/robots.ts` and `app/sitemap.ts` absent.
- OPEN: English copy for programmatic index and detail pages (W2.4, B-022 note).
- GATED: pricing claims after the owner's B-040 decision (W6.2).

## §2 Guest experience (S1 §7.2)
- DONE: S1 §7.2 "Built".
- DONE (sandbox) since S1: limits on the default RSVP and wish writers, flag `GUEST_WRITE_LIMITS` on by default (W1.1, AM-001, E-100, D-071); form-key replay before the limiter with one transaction for key, write and analytics (W1.2, AM-002, E-101, D-072). B-013 is DONE in the sandbox.
- OPEN: backfill of image derivatives for uploads stored before B-019 (W2.3, AM-037).
- EXT: guest privacy notice copy (B-021) before `FLAG_SELF_REGISTRATION` and `FLAG_POST_EVENT_MEMORY`; B-009 devices and licensed audio (W5.6, AM-033); decisions D-041 and Q-D17.
- Investigate: render cost (B-014, G-008; W6.4).
- WATCH: guest shell 636.5 KiB decoded of 640 since W2.1 (AM-053; 635.5 KiB on `14c450f`; the root error file adds 1.0 KiB to every page).

## §3 Customer dashboard (S1 §7.3)
- DONE: S1 §7.3 "Built".
- DONE (sandbox) since S1: E-099 served, recorded and frozen (W0.3–W0.5, AM-024); "+ Buat event" reaches `/dashboard/templates` and the local-only picker is retired (W1.5, AM-006, OD-12's default, E-105).
- DONE (sandbox) s56: error boundaries and loading states (W2.1, AM-010, E-106, D-073): a bilingual dashboard boundary inside the shell, a root `app/global-error.tsx`, and a loading state for the 14 invitation pages below a layout that takes the access decision first.
- EXT: real-Clerk acceptance before each dark flag turns on (DA-01; W5.5, AM-045).

## §4 Team and reseller workspaces (S1 §7.4)
- DONE behind flags that are off: S1 §7.4 "Built" (G-044, G-052 / I-25).
- GATED: commercial terms (W6.2, AM-052).
- EXT: DA-01 items 8 and 13.

## §5 Admin console (S1 §7.5)
- DONE: S1 §7.5 "Built".
- DONE (sandbox) since S1: page-level `assertAuthorizedAdmin` on `/activity` and `/general` (W1.3, AM-003, AM-057, E-102); the overview's "Lihat semua" links carry the private entry (W1.6, AM-054, E-103).
- OPEN (W3): audit log (W3.1, AM-009); customers and invitations with pagination, search and detail pages (W3.2, AM-007, AM-008); orders search, filters, CSV export and payment timeline (W3.3); moderation (W3.4, after the owner confirms scope).
- GATED: reviewed publishing after the owner's art review (W3.5, G-062 step 2); corpus approval (W3.6, I-11). EXT: refunds once a PJP and Stripe are live.

## §6 Next.js server layer (S1 §7.6)
- DONE: S1 §7.6 "Built".
- DONE (sandbox) since S1: limiter and form keys on the default writers (W1.1, W1.2); `/api/user` removed (W1.4, AM-004, E-104).
- OPEN: starter remnants (W4.1, AM-012 to AM-014). s56 check: `bcryptjs` and `jose` are in `dependencies`; `ActivityType` is still in `lib/db/schema.ts`.

## §7 Rust domain API and jobs (S1 §7.7)
- DONE (sandbox): Rust writers for views, RSVP, wishes, roster, content and creation, and payment, plus the jobs binary. s56 on `14c450f`: rust 23 / 23, cargo 163 (service 146, feasibility 17), RSVP 41 / 41 and wishes 44 / 44 through both writers.
- EXT: per-domain rollout: preview, load, 7 days, TypeScript writer removal (W5.1, AM-047); traces at a collector (G-020); a jobs scheduler (W5.7).

## §8 Data model (S1 §7.8)
- DONE: 35 tables (S1 Appendix E), migrations `0000`–`0031`.
- OPEN, owner-approved data check first: dropping legacy `users.password_hash` (AM-014, OD-15; W4.1 plans it and does not run it).

## §9 Commerce (S1 §7.9)
- DONE (sandbox; receipts, coupons and the credit ledger are off): S1 §7.9 "Built".
- EXT: PJP or QRIS acquirer adapter and a Stripe test-mode run (W5.4, AM-042, AM-043); the seller's legal identity and tax documents.
- GATED: pricing and entry tier (W6.2, B-040, AM-052); account auto-creation from payment (W6.3, AM-044, OD-16).

## §10 Trust, privacy, security and compliance (S1 §7.10)
- DONE: S1 §7.10 "Built"; limits and idempotency on the default writers (W1.1, W1.2, sandbox).
- EXT: CSP enforcement after a real-traffic window (W5.2, AM-048); B-021 notice copy and the professional UU PDP and retention review; DA-02 (W5.5, AM-046); S3 bucket policy and a real bucket cycle (W5.3, AM-040).
- OPEN, the owner confirms: the HSTS `includeSubDomains` scope (AM-005). s56 check: `next.config.ts` sends `max-age=63072000; includeSubDomains`.

## §11 Template system and catalog (S1 §7.11)
- DONE: S1 §7.11 "Built". s56: family manifests (4) and catalog manifests (64 / 0) validated in the app job, 909 / 909.
- EXT: the owner's art review (147 files), corpus entries, Q-D17 and D-041.
- OPEN, unscheduled: harness samples not loadable by the product renderer (AM-049); custom `invitesion-*` skills (AM-050). s56 check: one skill exists, `invitesion-template-harness`, under `.agents/skills/` and `.claude/skills/`.

## §12 AI and WhatsApp layer (S1 §7.12)
- GATED: schema only, no code. Nothing starts until the owner records OD-01 to OD-04 and the G-067 privacy posture (W6.1, AM-027).

## §13 Platform operations (S1 §7.13)
- DONE (sandbox): the five gates (s56: four green on `14c450f`, research green after the W2.0 fix); security headers; flags and writer selection; storage drivers; the Rust service and worker as artefacts.
- OPEN (W4): package-manager pin (W4.2, AM-017); `.env.example` completeness (W4.3, AM-018, PARTIAL); tracked fixtures (W4.4, AM-016); documentation (W4.5, AM-025 to AM-028); linter (W4.6, AM-019).
- EXT: production environment, migrations, scheduler, telemetry, backups and alerting (W5.7).

## §14 Owner decisions
S1 §11 is the register. Applied so far: OD-12's default in W1.5 (route to the theme catalog, retire the picker; E-105). Sessions 54–56 decided no other OD item and needed no new one.

## §15 Deferred acceptance
DA-01 and DA-02 stay deferred and NOT RUN (S1 §4, S4 §1). W5.5 prepares the DA-01 script for a real Clerk instance and the DA-02 runbook.

## §16 External work
W5 (in §18). The agent prepares runbooks and scripts; the owner executes against real services.

## §17 Gated work
W6 (in §18), together with the GATED lines in §1–§12. Nothing gated starts without the owner's recorded decision.

## §18 Wave tracker

### W0 — Baseline, records and the F3 freeze (session 54): 5 / 5 DONE
- [x] **W0.1** Workspace recovered and proven: tree `ae46904…`, 2,335 paths, MATCH; frozen install with pnpm 10.34.9.
- [x] **W0.2** Five jobs on `9359d2d`: research 10 / 10; app 886 / 886; database 15 / 15; rust 23 / 23 (service 142, feasibility 17); product-gates 18 / 18 in 645 s.
- [x] **W0.3** E-099 served re-check (AM-024): run 2 **104 / 104** on build `rZDrFWPzlupGM4sUNm0mi`; full axe on 12 page × width runs, 0 violations.
- [x] **W0.4** E-099 records; checkpoint T1.
- [x] **W0.5** F3 = `8485cc8` / `36fd47a`: five jobs exit 0 (product-gates 18 / 18 in 640 s with every sub-count); records-only T2 `86edb6c` / `31bcef9`.

### W1 — Security and correctness (session 55): 6 / 6 DONE (sandbox), F4 DONE
- [x] **W1.1** (AM-001 HIGH, B-013) limits on the default RSVP and wish writers; flag `GUEST_WRITE_LIMITS` on by default. E-100, D-071; `2ad2729` / `7c11942`.
- [x] **W1.2** (AM-002 MEDIUM, D-044) form-key replay before the limiter; one transaction for key, write and analytics. E-101, D-072; `d593afc` / `ee92375`.
- [x] **W1.3** (AM-003, AM-057) page-level `assertAuthorizedAdmin` on `/activity` and `/general`. E-102; `61473f1` / `eed1805`.
- [x] **W1.6** (AM-054) the overview's "Lihat semua" links carry the private entry. E-103; `588071e` / `5b72cd9`.
- [x] **W1.4** (AM-004) `/api/user` removed. E-104; `cc2bb00` / `9f1c4fd`.
- [x] **W1.5** (AM-006, OD-12 default) "+ Buat event" reaches `/dashboard/templates`; the picker retired. E-105; `0ef8c7d` / `3c2b287`.
- [x] **F4** on `0ef8c7d` / `3c2b287`: research 10 / 10; app 909 / 909 (r2 build `wRMT9uTQVauJNW70Axymu`); database 15 / 15; rust 23 / 23; product-gates 18 / 18 in 614 s; served **159 / 159** on build `gmO6gGhSBbpwF7YWMCyhg` (session 55 report, Post-F4 addendum).

### W2 — Customer and guest UX completion (session 56 onward)
- [x] **W2.0** Re-anchor on `14c450f` (S4), session 56. (a) Clone proof MATCH: 2,346 paths, 21 symlinks, 3 executables, 11 g018 files. (b) On the proven `git archive ba0049c` extraction, input MATCH before and after every job: research **exit 1** on one unresolved reference, the W2.1 sentence written into `LATEST.md` after F4 (AM-061), explained and fixed at the cause in `2a3e289`, then research 10 / 10 on the fixed tree; app 909 / 909, build `ThmxEFUpCYYs4r1HBCYh0`; database 15 / 15; rust 23 / 23 in 323 s (cargo 163, RSVP 41 / 41, wishes 44 / 44); product-gates 18 / 18 in 610 s, build `CCcuvqBrRpYmaGrFilqMl`: gift privacy 57 / 57, design 198 / 198, cover fold 90 / 90, contrast 9 / 9, F-02 6 / 6, cover gate 69 / 69, gallery 253 / 253, guest shell 635.5 KiB decoded (225.4 KiB transfer), 0 OOM lines. (c) Post-F4 addendum in the session 55 report (AM-060), commit `2a3e289`. (d) This file and the audit map reconstructed from evidence (owner instruction, 2026-11-20). **Visible deviation:** S4 asks for F4's served harness on `14c450f` when any result differs from F4. Research differed, but the owner's instruction of 2026-11-20 was to record product-gates, write the companions and continue at W2.1, so that re-run moves to F5's served regression on the final W2 tree. It is recorded as NOT RUN in W2.0, never as passed. The basis: the only difference is one records sentence that no test, script, build input or served page reads, and the other four jobs match F4 count for count. The records checkpoint is the commit that adds this file; a commit cannot name itself, so its hash is recorded by the next commit's worksheet lines.
- [x] **W2.1** (AM-010) error boundaries and loading states: a new dashboard `error.tsx` (bilingual, retry, inside the shell), a new root `global-error.tsx`, `loading.tsx` on heavy dashboard routes without a second `main`; no guest budget regression; served check with a forced error in a scratch copy. **Closed (s56):** code `1702f5c` / `c655d18`; app 913 / 913 (build `J48Hkh4y5L27daqk2oJcm`); served 27 / 27 (build `HAaJjUoEQ1MBZ70Tnv8VG`). The loading state sits below an access-deciding layout for the 14 invitation pages so that real 404s and redirects survive streaming; `retry()` replaces S4's `reset()`. Product-gates 18 / 18 in 609 s (build `QRXxRD_heg8E2WK_vgzuK`), every pass count equal to W2.0's; guest shell 636.5 KiB decoded, 16 resources (+1.0 KiB; AM-053 headroom 3.5 KiB). E-106, D-073. The closing records checkpoint carries this tick; its hash is in session 56's final report.
- [ ] **W2.2** (AM-011) robots and sitemap. Not started: session 56 stopped before it by the owner's instruction.
- [ ] **W2.3** (AM-037) B-019 backfill tool: dry run, apply, idempotent, runbook (the production run is EXT).
- [ ] **W2.4** (B-022 note) English copy for programmatic pages; lexicon test extended.
- [ ] **W2.5** (AM-055, provisional) S2's item; its scope is not in the repository. Search the records first; if still unknown, BLOCKED-EVIDENCE (never DONE) and move on to F5.
- [ ] **F5** exact-tree freeze of the final W2 tree: five jobs plus the served regression, with F4's sections rebuilt (AM-062) and the sections W2.0 moved here.

### W3 — Admin console completion
- [ ] **W3.1** (AM-009) admin audit log in the same transaction as every admin mutation.
- [ ] **W3.2** (AM-007, AM-008) customers and invitations: keyset pagination, search, detail pages.
- [ ] **W3.3** orders: search, filters, formula-safe CSV export, payment-event timeline.
- [ ] **W3.4** invitation moderation (the owner confirms scope).
- [ ] **W3.5** G-062 step 2 groundwork; reviewed publishing GATED on the owner's review.
- [ ] **W3.6** corpus approval workflow (GATED, I-11).

### W4 — Platform and repository hygiene
- [ ] **W4.1** (AM-012 to AM-014) dependency and starter cleanup; plan, do not run, the `password_hash` drop.
- [ ] **W4.2** (AM-017) `packageManager`, `engines.node`, `onlyBuiltDependencies`.
- [ ] **W4.3** (AM-018) `.env.example` completeness (PARTIAL since W1.1).
- [ ] **W4.4** (AM-016) tracked-but-ignored g018 fixtures.
- [ ] **W4.5** (AM-025 to AM-028) documentation refresh; the AGENTS.md part needs owner approval.
- [ ] **W4.6** (AM-019) linter and formatter: the owner picks; report-only first.
- [ ] **W4.7** (AM-015) format minified files when touched.

### W5 — Release readiness (EXT: the agent prepares, the owner executes)
- [ ] **W5.1** Rust rollout runbook per domain (AM-047). - [ ] **W5.2** CSP window, then enforcement (AM-048). - [ ] **W5.3** S3 bucket cycle and policy (AM-040). - [ ] **W5.4** PJP / QRIS adapter and Stripe test run (AM-042, AM-043). - [ ] **W5.5** DA-01 script and DA-02 runbook (AM-045, AM-046). - [ ] **W5.6** device matrix (AM-033). - [ ] **W5.7** production environment, migrations, scheduler, telemetry, backups, alerting.

### W6 — Decision-gated scope
- [ ] **W6.1** AI / WhatsApp direction (AM-027; OD-01 to OD-04). - [ ] **W6.2** pricing, entry tier, workspace terms (B-040, AM-052, OD-05). - [ ] **W6.3** account auto-creation from payment (AM-044, OD-16). - [ ] **W6.4** investigate items when evidence appears.

## Change log
- s54 (2026-11-17): W0 done: the five jobs exit 0 on `9359d2d`; E-099 served run 2 104 / 104; F3 = `8485cc8` / `36fd47a`; records-only T2 `86edb6c`. The companions were not in the sandbox, so the changes came as the session 54 report.
- s55 (2026-11-18): W1.1–W1.6 closed in the sandbox (E-100–E-105, D-071, D-072); F4 on `0ef8c7d` / `3c2b287` with served 159 / 159. Changes came as the session 55 report; F4's completion is in its Post-F4 addendum.
- s56 (2026-11-20): this file reconstructed from evidence by the owner's instruction, with the s54 and s55 report changes merged; W2.0 closed (four jobs match F4 on `14c450f`; the research failure is explained and fixed, AM-061; the addendum closes AM-060). The served re-run moves to F5 by the owner's instruction. W2.1 started, then closed (E-106, D-073; product-gates 18 / 18 with the guest shell at 636.5 KiB). Session 56 ends before W2.2 by the owner's instruction, with the branch handed off.
