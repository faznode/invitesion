<!-- SUMMARY (first 7 lines — greppable) -->
# invitesion-auditmap.md — Supervisor companion: master audit map of bugs, source defects, errors and risks (AM-NNN)
> WHAT: One row per audit id AM-001 to AM-062 with title, severity, status, slot and evidence, plus environment notes (R-X). Reconstructed by session 56 from repository evidence; the original was never stored in the repository, and ids no record names are listed as UNRESOLVED, not invented.
> STATUS: ACTIVE, reconstructed (s56, 2026-11-20, by the owner's instruction to write it "from your own evidence"). Of 62 rows: open 35 (PARTIAL, EXT and GATED included); closed 12; WATCH 1; UNRESOLVED 14 (11 never named, 3 named without text). Next free id: AM-063.
> OWNER: Supervisor. Written by the Operator of session 56; later sessions edit it in place and keep corrections visible.
> DEPS: Supervisor/invitesion-prompt-s1.md, Supervisor/invitesion-prompt-s4.md (untracked copy), Supervisor/invitesion-session-54-report.md, Supervisor/invitesion-session-55-report.md, Supervisor/invitesion-progress.md, invitation-research/_handoff/IMPLEMENTATION-LOG.md, invitation-research/_handoff/sessions/session-56-20261120-0034.md
> GREP: supervisor, auditmap, audit map, AM-001, AM-010, AM-011, AM-021, AM-053, AM-055, AM-058, AM-059, AM-060, AM-061, AM-062, R-X2, R-X13, R-X15, unresolved, reconstructed, s56
> UPDATED: 2026-11-20 (s56: reconstructed; s54 and s55 changes merged; AM-060 and AM-061 closed; AM-062 opened; AM-010 closed with W2.1; AM-053 at 636.5 KiB)

---

## How this file was made
- **Why reconstructed:** S1 and S4 cite this file, but no copy exists at `ba0049c`, on any remote branch or in the history. On 2026-11-20 the owner instructed session 56 to write it from its own evidence instead of waiting for files.
- **Where each row comes from:** S1 §2–§11 (the finding named next to its item, for example "robots and sitemap (AM-011)"); S4 §2; Part B of the session 54 and 55 reports; the s56 worksheet. **Titles are reconstructed** from those mentions, so they are short paraphrases, not the original rows. Where a title rests on the order of a range (for example "AM-025 to AM-028" over four bullets), the row says "inferred".
- **s56 check** = verified against the code at `14c450f` on 2026-11-20.
- **Severity:** recorded values come from S4 §2.1 and the session 55 report. **n/r** = no repository record gives one; the Supervisor assigns it. Session 56 proposes a severity only for the id it opened (AM-062).
- **UNRESOLVED:** an id with no row text in any repository file. Its original is lost with the companion (and, for AM-055, AM-058 and AM-059, with the S2 prompt). These rows stay UNRESOLVED until the owner supplies the text, and their ids are never reused.

## Rows

| ID | Title (reconstructed) | Sev. | Status (2026-11-20) | Slot | Evidence and notes |
|---|---|---|---|---|---|
| AM-001 | No rate limit on the default (`next`) RSVP and wish writers | HIGH | CLOSED (sandbox) | W1.1 | E-100, D-071; `2ad2729` / `7c11942`; served burst 6 / 6 in F4. s56 on `14c450f`: rust 23 / 23, RSVP 41 / 41 and wishes 44 / 44 through both writers |
| AM-002 | No form-key idempotency on the default wish writer; duplicate RSVP analytics rows on resubmission | MEDIUM | CLOSED (sandbox) | W1.2 | E-101, D-072; `d593afc` / `ee92375`; database 15 / 15 (again on `14c450f`) |
| AM-003 | `/activity` lacks the page-level `assertAuthorizedAdmin` | LOW | CLOSED (sandbox) | W1.3 | E-102; `61473f1` / `eed1805`; served 7 / 7 in F4 |
| AM-004 | Dead `/api/user` endpoint | LOW | CLOSED (sandbox) | W1.4 | E-104; `cc2bb00` / `9f1c4fd`; served 404 3 / 3 in F4 |
| AM-005 | HSTS `includeSubDomains` scope not confirmed | n/r | OPEN (owner confirms) | S1 §7.10 | s56 check: `next.config.ts` line 31 sends `max-age=63072000; includeSubDomains`; keep it only if every subdomain serves HTTPS |
| AM-006 | "+ Buat event" dead end (local-only blueprint picker) | MEDIUM | CLOSED (sandbox) | W1.5 | E-105, OD-12's default; `0ef8c7d` / `3c2b287`; served 22 / 22 in F4 |
| AM-007 | Admin customers list: no pagination, search or detail page | n/r | OPEN | W3.2 | S1 §7.5 |
| AM-008 | Admin invitations list: no pagination, search or detail page | n/r | OPEN | W3.2 | S1 §7.5 |
| AM-009 | No admin audit log (the unused `ActivityType` is to be replaced) | n/r | OPEN | W3.1 | S1 §7.5, W3.1 |
| AM-010 | No customer dashboard error boundary, no global error file, no loading states on heavy dashboard routes | n/r | CLOSED (s56) | W2.1 | at `14c450f` the only `error.tsx` and `loading.tsx` were in the admin console, plus `app/not-found.tsx` (S4, s56 check). E-106, D-073; code `1702f5c` / `c655d18`; app 913 / 913; served 27 / 27 (real 404s and 307s survive the loading state through an access-deciding layout); product-gates 18 / 18, every pass count equal to W2.0's, so no budget regression on guest pages; the shell delta (+1.0 KiB) is recorded under AM-053 |
| AM-011 | No `robots.txt` or sitemap | n/r | OPEN | W2.2 | s56 check: `app/robots.ts` and `app/sitemap.ts` absent |
| AM-012 | Unused `bcryptjs` dependency (starter remnant; inferred from S1 W4.1's order) | n/r | OPEN | W4.1 | s56 check: `bcryptjs` in `dependencies` |
| AM-013 | `jose` and build-only packages in `dependencies` (inferred from S1 W4.1's order) | n/r | OPEN | W4.1 | s56 check: `jose` in `dependencies`, not `devDependencies` |
| AM-014 | Legacy `users.password_hash` column; the unused `ActivityType` (the second part is inferred) | n/r | OPEN (the drop needs an owner-approved data check, OD-15) | W4.1 | S1 §7.8 and OD-15; s56 check: `ActivityType` in `lib/db/schema.ts`; the column appears in migrations `0000` and `0006` |
| AM-015 | Minified files in the tree are unformatted (format when touched) | n/r | OPEN (opportunistic) | W4.7 | S1 W4.7 |
| AM-016 | 11 tracked-but-ignored `g018` fixtures | n/r | OPEN | W4.4 | every s54–s56 tree proof must add these 11 files with `-f` |
| AM-017 | No `packageManager` or `engines` pin; the install prints the ignored-build-scripts warning | n/r | OPEN | W4.2 | s56 check: no `packageManager`, `engines` or `onlyBuiltDependencies`; s56's frozen install warned for `@tailwindcss/oxide` and three `esbuild` versions (as in s54 and s55) |
| AM-018 | `.env.example` incomplete | n/r | PARTIAL | W4.3 | s56 check: `RATE_LIMIT_RSVP_*`, `RATE_LIMIT_WISH_*` and `GUEST_WRITE_LIMITS` are present (added in W1.1); `ADMIN_SEED_EMAIL` and `CUSTOMER_SEED_EMAIL` are missing; 7 `FLAG_` lines for 30 flags |
| AM-019 | No linter or formatter | n/r | OPEN (the owner picks, OD-15) | W4.6 | s56 check: no ESLint, Biome or Prettier configuration at the root |
| AM-020 | — | — | UNRESOLVED | — | named by no repository file |
| AM-021 | The platform rewrites `.gitignore` at turn boundaries (R-X2) | n/r (platform) | OPEN | S1 §3.1 guard | recurrences, each restored from HEAD before any commit: s54 17:20Z; s55 18:42Z; **s56 00:53:18Z** (rewritten to a 7-line, 224-byte v0 default, +7 / −68; restored at 01:03Z, sha256 equal to HEAD's `4defdfe3…`) |
| AM-022 | — | — | UNRESOLVED | — | named by no repository file |
| AM-023 | — | — | UNRESOLVED | — | named by no repository file |
| AM-024 | E-099 needed its served verification, records and the F3 freeze | n/r | CLOSED | W0.3–W0.5 | served run 2 104 / 104; `### E-099` in the implementation log; F3 `8485cc8` / `36fd47a` (s54 proposed the close; the record supports it) |
| AM-025 | `README.md` stale | n/r | OPEN | W4.5 | S1 §2 ("stale: AM-025"); README is inside the reference check |
| AM-026 | AGENTS.md stack block out of date; the file is LOCKED (inferred from S1 W4.5's range and order) | n/r | OPEN (owner approval) | W4.5 | S1 W4.5 |
| AM-027 | `docs/PROJECT_OVERVIEW.md` and `docs/specs/REBUILD-HANDOFF-A-Z.md` older and partly superseded; the AI / WhatsApp vision undecided | n/r | OPEN; GATED on OD-01 | W4.5, W6.1 | S1 §2 and §7.12 |
| AM-028 | `docs/INDEX.md` does not cover `Supervisor/` (inferred from S1 W4.5's range and order) | n/r | OPEN | W4.5 | s56 check: `docs/INDEX.md` exists and mentions `Supervisor` 0 times |
| AM-029 | LICENSE copyright line | n/r | OPEN (owner, OD-15) | W4 | s56 check: "Copyright (c) 2025 Vercel" |
| AM-030 | Branch flow undefined | n/r | OPEN (owner, OD-14) | process | s56: `develop` = `ba0049c`, `main` = `4e36e20` |
| AM-031 | Stale remote branches | n/r | OPEN (owner, OD-14) | process | s56: `develop`, `main`, `staging`, `invitesion-design`, `feat/template-catalog`, `v0/faznode-3b993736`, `v0/research-harness-update` |
| AM-032 | — | — | UNRESOLVED | — | named by no repository file |
| AM-033 | Device matrix not run: B-009 audio, B-024 scanner, printed cards (DA-01 item 17) | n/r | EXT | W5.6 | S1 W5.6 |
| AM-034 | — | — | UNRESOLVED | — | named by no repository file |
| AM-035 | — | — | UNRESOLVED | — | named by no repository file |
| AM-036 | — | — | UNRESOLVED | — | named by no repository file |
| AM-037 | Uploads stored before B-019 have no derivatives and there is no backfill tool | n/r | OPEN | W2.3 | S1 W2.3, S4 W2.3 |
| AM-038 | — | — | UNRESOLVED | — | named by no repository file |
| AM-039 | — | — | UNRESOLVED | — | named by no repository file |
| AM-040 | No real S3 bucket cycle; bucket policy unverified | n/r | EXT | W5.3 | S1 W5.3 |
| AM-041 | — | — | UNRESOLVED | — | named by no repository file |
| AM-042 | No licensed QRIS acquirer or PJP adapter (split from AM-043 inferred from S1 W5.4's order) | n/r | EXT | W5.4 | S1 W5.4, ADR-O03 |
| AM-043 | No real Stripe run (inferred as above) | n/r | EXT | W5.4 | S1 W5.4 |
| AM-044 | Account auto-creation from payment undecided | n/r | GATED (OD-16) | W6.3 | S1 §7.9 |
| AM-045 | DA-01 (20 items) needs a real Clerk instance | n/r | EXT; deferred, NOT RUN | W5.5 | S1 W5.5 |
| AM-046 | DA-02 needs its runbook and a real environment | n/r | EXT; deferred, NOT RUN | W5.5 | S1 W5.5 |
| AM-047 | Rust writers not rolled out (preview, load, 7 days, TypeScript writer removal) | n/r | EXT | W5.1 | S1 §7.7 |
| AM-048 | CSP in report-only mode; enforcement waits for a real-traffic window | n/r | EXT | W5.2 | S1 §7.10 |
| AM-049 | Harness samples are not loadable by the product renderer | n/r | OPEN (unscheduled) | S1 §7.11 | S1 §7.11 |
| AM-050 | Custom `invitesion-*` skills incomplete | n/r | OPEN | S1 §7.11 | s56 check: one skill, `invitesion-template-harness`, under `.agents/skills/` and `.claude/skills/`; the intended set is not recorded |
| AM-051 | — | — | UNRESOLVED | — | named by no repository file |
| AM-052 | Pricing, entry tier and workspace commercial terms undecided | n/r | GATED (OD-05) | W6.2 | S1 W6.2 |
| AM-053 | Guest shell budget headroom is small (F2: 636.04 of 640 KiB) | n/r | WATCH | product-gates | s56 on `14c450f`: 635.5 KiB decoded, 225.4 KiB transfer, 15 resources, the same as F3 and F4. **W2.1 (`1702f5c`): 636.5 KiB decoded, 227 KiB transfer, 16 resources (+1.0 / +1.6 KiB, +1): the root `global-error.tsx` loads on every page; headroom now 3.5 KiB; confirmed in all three product-bytes runs of W2.1's product-gates (18 / 18).** New client code on guest pages needs a budget plan first |
| AM-054 | Admin overview "Lihat semua" links resolve outside the private entry and land on the 404 | LOW | CLOSED (sandbox) | W1.6 | was AM-s54-1; E-103; `588071e` / `5b72cd9`; served clicks 7 / 7 in F4 |
| AM-055 | S2's W2.5 item; its scope is not in the repository | LOW (provisional) | UNRESOLVED; W2.5 open | W2.5 | S4 W2.5; s56 searches the records before F5 |
| AM-056 | LATEST lacked the map from local checkpoints to published commits | LOW | CLOSED | — | LATEST's Session 55 resume point opens with the map (s55) |
| AM-057 | `/general` lacks the page-level `assertAuthorizedAdmin` | LOW | CLOSED (sandbox) | W1.3 | E-102 |
| AM-058 | Environment item; its text is not in the repository | — | UNRESOLVED | — | S4 §2.3; lost with S2 (R-X notes below are not mapped to it) |
| AM-059 | Environment item; its text is not in the repository | — | UNRESOLVED | — | as AM-058 |
| AM-060 | The session 55 report still said F4 was running; F4's completion was unrecorded there | n/r | CLOSED (s56) | W2.0 (c) | the Post-F4 addendum in the session 55 report, commit `2a3e289` |
| AM-061 | `local.sh research` fails on the published tree `14c450f`: records written after F4 were never covered by a research run | n/r | CLOSED (s56) | W2.0 | cause: LATEST's W2.1 sentence named W2.1's future file in backticks; fixed at the cause in `2a3e289`; research 10 / 10 on the fixed tree; app, database, rust and product-gates match F4 on `14c450f` (worksheet). S4's served re-run for a differing result moves to F5 by the owner's instruction of 2026-11-20 and is NOT RUN in W2.0 |
| AM-062 | The served regression cannot be re-run from the repository: F4's harness (`f4.cjs`) and its stack scripts lived only in scratch and were lost with the s55 sandbox | LOW (proposed, s56) | OPEN | F5; W4 | the repository tracks only the g018 pieces they grew from, under `tools/template-harness/.out/g018/` (themselves AM-016). s56 rebuilt a stack script in scratch. **Fix proposal:** track the served harness as test tooling outside the product build, with fictional data only, so each freeze can re-run the earlier sections |

## Environment notes (R-X; sandbox behaviour, not product defects)
- **R-X2 (AM-021):** `.gitignore` rewritten at turn boundaries; diff against HEAD and restore before every commit.
- **R-X13:** one production build at a time (2 CPUs, about 4 GB, no swap).
- **R-X15:** a tool call is capped at 600 s; product-gates (610–775 s) runs detached (`setsid -f`, log on disk). s56's W2.0 chain ran that way and finished across a turn boundary (00:45:02Z–00:55:12Z).
- **Turn timeouts:** turns end near 27 minutes. Commit each closed item and its records before a long wait (AM-060 is what happens otherwise).

## Change log
- s54 (2026-11-17): AM-024 proposed closed; AM-s54-1 opened (became AM-054); AM-021 recurred; AM-053 unchanged; AM-017 open. Delivered as the session 54 report.
- s55 (2026-11-18): AM-001, AM-002, AM-003, AM-004, AM-006, AM-054 and AM-057 closed in the sandbox; AM-056 closed; AM-021 recurred; AM-017 open; AM-055 unchanged. Delivered as the session 55 report.
- s56 (2026-11-20): this file reconstructed from evidence by the owner's instruction, with the s54 and s55 changes merged; AM-060 and AM-061 closed; AM-021 recurred (00:53:18Z); AM-062 opened; 14 ids recorded as UNRESOLVED: 11 that no repository file names (AM-026 appears only inside S1's range "AM-025 to AM-028" and keeps an inferred title) and AM-055, AM-058 and AM-059, which are named without their text.
- s56 (2026-11-20), W2.1 closure: AM-010 closed (E-106, D-073); AM-053 stays WATCH at 636.5 KiB (headroom 3.5 KiB); counts recomputed from the table: open 35, closed 12, WATCH 1, UNRESOLVED 14.
