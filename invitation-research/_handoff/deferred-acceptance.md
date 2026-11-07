<!-- SUMMARY (first 7 lines — greppable) -->
# deferred-acceptance.md — acceptance moved out of the codebase-rebuild phase (owner, s25)
> WHAT: Acceptance the owner deferred on 2026-11-06 (s25): scope, what exists today, why that is not this acceptance, preconditions, and what to record when it runs. Neither entry is a next action or a rebuild completion criterion in this phase; neither has passed.
> STATUS: ACTIVE: DA-01 and DA-02 both **NOT RUN**
> OWNER: Operator role (research agent); runs need the owner (keys, environments)
> DEPS: LATEST.md §4, IMPLEMENTATION-LOG.md (E-038, E-042, E-047), ../../docs/systems/auth.md, ../../docs/systems/guest-management.md
> GREP: deferred, acceptance, Clerk, signed-in, child-photo migration, deployment, P-INV-010, DA-01, DA-02, not run
> UPDATED: 2026-11-07 (s33: DA-01 item 6, the creation wizard; s32: item 5; s25: created from the owner's clarification)

## Rules
- **Deferred is not passed.** An entry stays NOT RUN until a run is recorded here with date, environment, build id and a result per scope item.
- **Mocks are not this acceptance.** Unit tests with stubbed sessions, builds without middleware (D-012) and builds with placeholder keys are implementation evidence only. Never present them as real-Clerk acceptance.
- The implementation and its security boundaries stay as they are: middleware coverage, roles in the database, ownership checks, private 404s.
- During the rebuild phase no agent asks for Clerk keys or checks whether they exist (owner, s25). Secrets never go into the repo or a chat.

## DA-01 · Signed-in acceptance with a real Clerk instance
- **Deferred:** owner clarification of 2026-11-06 (s25), for the codebase-rebuild phase. Formerly LATEST §4 items 1 and 9 (EXT, P-INV-010).
- **Scope** (pass / fail each, on a production build **with** middleware and a Clerk instance dedicated to this project):
  1. Sign-in, sign-up, dashboard and admin after E-042 (ClerkProvider only in the signed-in route groups).
  2. The invite-only panel, the editor switches and the host override (E-038).
  3. The owner's read of `/media/protected/*` (the owner gets the file; another signed-in user and a signed-out request get the private 404) and the editor thumbnail of a protected upload (E-047).
  4. Template editability end to end: edit, save, then the guest page shows the change. Versioning needs working migrations, not only `schemaVersion`.
  5. B-035 (E-071, s32), before `FLAG_EDITOR_AUTOSAVE` is switched on: signed in, an edit is stored ≤ 2 s after idle and the side-by-side preview shows it; two tabs from one version end in the conflict choice with nothing overwritten; a stale tab's "load the latest" and "keep this tab" both behave; with `BACKEND_CONTENT=rust`, the same through the API with the session's owner token. s32 ran these in headless Chrome with Clerk replaced by a stub (scratch copy, scratch database); that is not this check. Also B-036 (E-072, s32): signed in, the theme tab lists the event type's catalog themes with Premium ones locked on a Standard invitation; a Standard switch is stored with its palette and the content kept, `invitations.template_id` unchanged and no checkout offered; s32's 12 / 12 ran with the same stub.
  6. B-037 (E-073, s33), before `FLAG_CREATION_WIZARD` is switched on: signed out, the wizard's save leads to Clerk's sign-in **and** sign-up and back to `/buat/simpan` with the typed names, date and theme kept; one tap creates exactly one draft in the new account, which opens in the editor; signed in, the wizard saves directly and a double tap makes one draft; with `BACKEND_CONTENT=rust`, the same through the API with the session's owner token. s33 ran the round trip in headless Chrome with Clerk replaced by a cookie stub (18 / 18, scratch copy, scratch database); that is not this check, and no real sign-up was exercised.
- **What exists (kept; implementation evidence only):**
  - Clerk middleware with explicit `/media/protected/*` coverage.
  - Roles in the local `users` table (`docs/systems/auth.md`).
  - Unit tests `tests/b015-clerk-scope.test.ts` and `tests/e047-child-photo-access.test.ts`, with session behaviour stubbed.
  - Builds with middleware compile with placeholder keys (latest `cIA3dPf8D5ZhHucojOsUo`, s24). Such a build is never served: with placeholder keys it hangs on the first request (P-INV-010).
- **Preconditions:**
  - A dedicated Clerk instance, with keys supplied by the owner through the environment.
  - A served middleware build on a stable origin.
  - Two fictional accounts: the owner and another user.
- **Record when run:** date, build id, origin, Clerk instance type, and PASS / FAIL with evidence for items 1–4.

## DA-02 · Children's-photo migration in real environments
- **Deferred to deployment:** owner clarification of 2026-11-06 (s25). Running it against a real environment is a deployment step and does not block local rebuilding. Formerly LATEST §4 item 2.
- **What exists (kept):**
  - The script `scripts/migrate-child-photos.ts`:
    - Steps: dry run (default) → `--apply` → `--apply --delete-public`; also `--rollback [--apply]` and `--invitation <id>`.
    - Safety: bytes are compared by SHA-256 before any row changes, and each path is one transaction guarded by its old value.
  - Database-backed acceptance on synthetic rows, `scripts/verify-child-photo-migration.ts`: 23 / 23 (s23r; the transfer operator on `d8bfb24`). Not rerun in s24 or s25.
  - Deploy order and rollback: IMPLEMENTATION-LOG E-047.
  - Behaviour: `docs/systems/guest-management.md` ("Akses file foto anak").
- **Preconditions, per environment:**
  - Confirm that the S3 bucket grants no public reads.
  - Take a database and storage backup, and review the dry-run output.
  - Before any release-facing claim, evaluate `--delete-public`'s "unreferenced" assumption against concurrent saves and cached public bytes.
  - Never run it against production from an agent sandbox.
- **Known limit:** bytes already served publicly cannot be recalled.
- **Record when run:** environment, date, dry-run counts, the apply result, the delete-public result (or "deferred"), and whether rollback was exercised.
