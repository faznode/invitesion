<!-- SUMMARY (first 7 lines — greppable) -->
# IMPLEMENTATION-LOG.md — technical record of masterplan implementation (P0 first)
> WHAT: One entry per finished increment: backlog item, behaviour confirmed before the change, acceptance criteria, change, tests, checks, measurements, risks, rollback. A work record, not a transcript.
> STATUS: ACTIVE (started session 09, 2026-11-03; baseline `64678cf`). B-001…B-008, B-010, B-011 DONE s09; B-009 and B-012 open. s11 (baseline `e873680`): E-012 B-017a, E-013 B-014 step 1, E-014 content contract.
> OWNER: Operator role (research agent)
> DEPS: ../09-masterplan/06-backlog.md, ../09-masterplan/08-template-system-and-harness.md, sessions/session-09-20261103-1816.md
> GREP: implementation, P0, B-0, acceptance, tests, rollback, verify, migration
> UPDATED: 2026-11-04

## How checks are run
Product checks run in the local-stack snapshot (`/vercel/share/work/app`, refreshed with `local-stack.sh sync`; `app/spike-min` and stale `.next/types` removed first so spike files never mask a product result): `pnpm typecheck`, `pnpm test`, `pnpm build` (the repository's required gates, `AGENTS.md`). Database steps run against the disposable Postgres (`127.0.0.1:5433`, identity checked: `invitesion|127.0.0.1|5433|/vercel/share/work/pgdata`). Build = production build without `middleware.ts` (placeholder Clerk keys, P-INV-010), so middleware behaviour is not validated here. Results are quoted from the run, never assumed.

## Status
| Item | State | Entry |
|---|---|---|
| B-001 catalog presets survive `art` | **DONE s09** | E-001 |
| B-002 price copy from `lib/pricing.ts` | **DONE s09** | E-002 |
| B-003 unverified religious text out of presets + corpus scaffold | **DONE s09** | E-003 |
| B-004 event time zone | **DONE s09** | E-004 |
| B-005 editor preview + theme tab | **DONE s09** (preview goes to an owner route, see deviation) | E-005 |
| B-006 CSV formula neutralisation | **DONE s09** | E-006 |
| B-007 RSVP keeps the allowance | **DONE s09** (additive migration 0009) | E-007 |
| B-008 countdown + add-to-calendar | **DONE s09** (`FLAG_GUEST_CALENDAR`, default on) | E-008 |
| B-010 per-invitation link-preview image | **DONE s09** | E-010 |
| B-011 opaque guest links + real 404 | **DONE s09** (`FLAG_OPAQUE_GUEST_LINKS`, default **off** per the owner's "slug without token" decision; additive migration 0010) | E-011 |
| B-009, B-012 | open (B-012 is delivered with the template harness; B-009 builds on it) | — |

Sprint-1 check run (s09, after E-001…E-007): `pnpm typecheck` exit 0; `pnpm test` **68/68** (59 before: +9 new P0 tests, the drafted B-003 registry test failed on the baseline as expected); mutation check (five deliberate regressions in the snapshot: preset key handling, CSV neutralisation, attendance rule, zone label) → 6 tests fail, restored afterwards; migration `0009` applied to the disposable database; `pnpm build` OK (19:13:54Z; `/i/[slug]/[guestSlug]` and `/preview/[id]` are Partial Prerender). Live smoke on the built server (19:14–19:16Z, no middleware): `08.00 WIB` / `19.00 WITA` on a UTC host; no "Rp0", prices `Rp 149.000`; RSVP over HTTP confirm 2 → decline → confirm 2 → confirm 5 gives `2|2`, `2|0`, `2|2`, `2|2` (allowance|attending); unknown guest still 200 (B-011); unauthenticated `/preview/1` and CSV fail closed (200 error shell without invitation data / 500) because Clerk `auth()` throws without middleware — the signed-in owner path is not exercised here.

## Entries
(newest last)

### E-001 · B-001 Catalog templates keep their preset (ADR-O01, QA-001)
- **Before (confirmed s09):** `template-sync.ts` stores `{ ...preset, art }` in `templates.default_config`; `create.ts` parsed that with the strict `detailConfigSchema`, which rejects `art` (`unrecognized_keys`), so every catalog invitation started from `{}`. The drafted registry test reproduced the strict rejection for template 0.
- **Acceptance:** for all 64 registry templates the derived config parses and equals the preset; unknown non-template keys still fail; missing defaults → `{}`.
- **Change:** `lib/invitation/template-defaults.ts` (new: `TEMPLATE_OWNED_KEYS`, `catalogDefaultConfig()`, `presetConfigFromTemplateDefaults()`); `lib/invitation/create.ts` uses it and logs a rejected default instead of silently dropping it; `lib/invitation/template-sync.ts` stores `catalogDefaultConfig(tpl)` (same stored JSON as before). Strict schema unchanged.
- **Tests:** registry-wide equality (64/64), negative key, null/array input, source assertion that both call sites use the helpers.
- **Risk / rollback:** L. No data change; existing invitations untouched; new invitations get the full preset. Revert the commit.

### E-002 · B-002 Prices on marketing pages come from `lib/pricing.ts` (ADR-O02)
- **Before (confirmed s09):** homepage and `/pricing` showed a "GRATIS / Rp0" plan card; Standard listed "Semua fitur gratis" and "1 tema premium pilihan" (premium templates are charged the premium price); prices were literals, and the English copy showed "IDR 149,000 / 299,000" while English visitors are charged USD 19 / 39 (`currencyForLocale('en')`); `/pricing` metadata said "Upgrade ke tema premium mulai Rp149.000" (149k is Standard).
- **Acceptance:** no page claims a free plan; every rendered price string equals `formatMoney(priceFor(tier, currencyForLocale(locale)), locale)`; "free" stays only for drafting / preview.
- **Change:** `lib/pricing.ts` `tierPriceLabel()`; `app/marketing-copy.ts` (price literals removed, prices injected by `getMarketingCopy`, draft-and-preview card instead of a free plan, Standard items corrected, CTAs "Mulai buat draf gratis" / "Start a free draft"); `app/page.tsx`, `app/pricing/page.tsx` (no "Rp0"; metadata from the helper); `app/layout.tsx` description from the helper.
- **Tests:** helper equality per locale (USD for `en`), no "Rp0"/free-plan badge/"All free features" in either locale, no price literal in the four source files.
- **Not changed (B-022, P1):** feature claims that do not match shipped features (e.g. "Musik latar & animasi masuk", "Ganti tema kapan saja", countdown on the homepage) — listed in the backlog, untouched here to keep the increment to prices.
- **Risk / rollback:** L (copy only). Revert.

### E-003 · B-003 No unverified religious text in presets; verified corpus scaffold (ADR-O04, QA-015)
- **Before (confirmed s09):** three base presets carried Qur'an translations (QS. Az-Zariyat 49, QS. Ibrahim 40, QS. Al-Hasyr 10) with no source, edition or permission. The new registry gate found five more religious texts in `greetings.prayer`: the basmala in two base presets (aqiqah-khitanan, tahlilan) and three template overrides (`melati-suci` basmala, `halal-bihalal` "Taqabbalallahu minna wa minkum", `kurma-oasis` "Allahumma laka shumtu wa bika amantu" — a shortened form of the iftar prayer, exactly the unverified-wording risk ADR-O04 addresses).
- **Acceptance:** no registry preset carries religious text absent from the verified corpus; existing invitations untouched; corpus with provenance fields, empty.
- **Change:** `lib/invitation/templates.ts` (3 quote blocks and 5 prayers removed, not paraphrased; comment points to the corpus rule); `content/verified-religious-texts/{README.md,corpus.json}` (new, empty, provenance fields and approval steps); `lib/invitation/religious-text.ts` (new: strict corpus schema, `isVerifiedReligiousText`, `looksReligious`, `findUnverifiedReligiousText` — prayers always count, quotes count when text or citation looks religious, so attributed literary quotes such as `midnight-gala`'s stay). The harness reuses the same gate.
- **Tests:** corpus empty + schema refusals (missing source, duplicates, approved without approver, pending entries unusable); gate behaviour (scripture citation, chapter:verse, prayer, literary quote allowed); registry-wide gate; no "QS."/"Bismillah" left in the registry source.
- **Effect:** wedding, aqiqah/khitanan, tahlilan and the three named templates now start without a quote block or prayer line; the greeting section still renders the opening copy. Customer-written content is not checked or changed.
- **Risk / rollback:** L. Revert, or re-enable a text by adding an approved corpus entry (owner-supplied text, source, licence, verifier, approver).

### E-004 · B-004 Event times in the event's own zone (QA-002)
- **Before (confirmed s09):** `components/invitation/public-renderer.tsx` formatted with `toLocaleTimeString('id-ID')` in the server's zone plus a hard-coded " WIB": on a UTC host (the Vercel default) an 08:00+07:00 event printed "01.00 WIB"; WITA/WIT events were labelled WIB.
- **Acceptance:** with `TZ=UTC`, "08.00 WIB", "19.00 WITA", "10.30 WIT"; UTC values fall back to `eventOperations.timezone` (Indonesian zones) or Asia/Jakarta; no day slip; invalid → nothing.
- **Change:** `lib/invitation/event-time.ts` (new; `Intl.DateTimeFormat` with an explicit `timeZone`, label from the same zone, other offsets shown as `UTC±hh:mm`); renderer uses it via `config.eventOperations?.timezone`.
- **Tests:** three zones, UTC fallback (default and WITA), foreign offset, both day-boundary cases, invalid input, source assertion that the renderer no longer hard-codes WIB.
- **Risk / rollback:** L. Revert.

### E-005 · B-005 Editor preview opens the real renderer; theme tab reachable (QA-011)
- **Before (confirmed s09):** "Pratinjau" linked to `/${slug}` (no such route → 404); the theme tab was gated on `config.addons.theme`, a key the strict schema rejects, so it never appeared.
- **Deviation from the backlog wording ("resolves to `/i/<slug>`"), with reason:** `/i/<slug>` refuses DRAFT invitations (the editor's main use) and would count the owner's own visits as guest views. The preview therefore opens a new owner route `/preview/<id>` that renders the same `PublicInvitationRenderer` for any status, behind the owner's session and ownership check, without view tracking and without RSVP / guestbook forms (no guest). `/i/<slug>` remains the public URL. The backlog acceptance line is updated accordingly.
- **Theme tab:** shown for every invitation; the cover image (upload) and headline are editable; template id and palette are shown read-only, because switching them in the editor would let a Standard invitation take a Premium look while checkout prices the DB template (switching within the paid tier is B-036). **New finding QA-026 (s09):** the config PATCH (`app/api/invitations/[id]/detail`) accepts any `theme.templateId` / `paletteId` from the owner without an entitlement check, so a crafted request can still do this; logged as B-041 (P1).
- **Change:** `lib/invitation/public-path.ts` (new, client-safe `guestPath`, `invitationPath`, `ownerPreviewPath`; `public-url.ts` re-exports them); `lib/invitation/public.ts` (`includeDraft` option, used only by the owner route); `app/preview/[id]/page.tsx` (new); `edit/page.tsx` passes `previewHref`; `edit/editor.tsx` (link, theme gate removed, theme tab content).
- **Tests:** path builders; source assertions (no `/${slug}` link, no `addons.theme`, theme always visible, no editable template id, preview checks ownership, passes `includeDraft`, never tracks).
- **Limit:** the owner path itself was not exercised end-to-end (needs a signed-in Clerk session; placeholder keys only); unauthenticated access was checked against the built server (E-007 run).
- **Risk / rollback:** L. Revert; the route is additive.

### E-006 · B-006 CSV export neutralises spreadsheet formulas (QA-012)
- **Before (confirmed s09):** `analytics/route.ts` quoted cells but left leading `= + - @`, so `=HYPERLINK("…")` in a guest name would run when the host opens the file.
- **Acceptance:** `=HYPERLINK("x")` exports as `"'=HYPERLINK(""x"")"`; tab / carriage-return prefixes covered.
- **Change:** `lib/csv.ts` (new `csvCell`, `csvRow`); the route rewritten readably around it (auth, ownership, columns and filename unchanged) and `attending_count` appended as the last column (E-007).
- **Tests:** hostile values, quoting, null/number, source assertion that the route uses `csvRow`.
- **Risk / rollback:** L. Consumers that parse by column position keep working (new column is last). Revert.

### E-007 · B-007 RSVP keeps the host's allowance (QA-005)
- **Before (confirmed s09, live on all three spike arms):** the RSVP action wrote the answer into `guests.guest_count`, so 300/300 allowances went 2 → 1 under the RSVP burst and a decline set it to 0.
- **Acceptance:** confirm 2 of 2 → decline → confirm 2: allowance stays 2, attending 2; migration additive and reversible.
- **Change:** `lib/db/schema.ts` (`attendingCount`, nullable); migration `lib/db/migrations/0009_guest_attending_count.sql` = `ALTER TABLE "guests" ADD COLUMN "attending_count" integer;` (+ `meta/0009_snapshot.json`, `_journal.json`, generated by `drizzle-kit generate --name guest_attending_count`); `lib/invitation/rsvp-rules.ts` (new pure rule `rsvpAttendance`, `rsvpDefaultCount`, status whitelist); `app/i/[slug]/actions.ts` writes `attendingCount` only (event meta keeps `guestCount` = people attending, as before); the renderer preselects the last positive answer, else the allowance; CSV exports both.
- **Tests:** the backlog sequence, clamping, whitelist, source assertion that the action never sets `guestCount`, exact migration text.
- **Database run:** identity checked; `pnpm db:migrate` applied 0009; `attending_count integer NULL`; all 310 existing rows null (no backfill: null = legacy or unanswered).
- **Not changed:** the spike's `next-min` and Rust arms still mirror the old rule (test equipment that reproduces the baseline).
- **Risk / rollback:** L. Revert the code; the column is harmless if left and can be dropped in a later release.

Sprint-2 check run (s09 19:24–19:31Z, after E-008, E-010, E-011): `pnpm typecheck` exit 0; `pnpm test` **85/85** (+17 in `tests/p0-guest-features.test.ts`); mutation check (five deliberate regressions: slug reaching a tokenized guest, no newline escaping in ICS, continuation lines of 75 octets, non-Latin glyphs drawn, opaque links on by default) → every one caught, restored to 0 failures; migration `0010` applied to the identity-checked disposable database (`link_token varchar NULL`, unique index, 310 rows null); `pnpm build` OK 19:30:02Z — `/i/[slug]` and `/i/[slug]/[guestSlug]` are now ƒ, the other 18 Partial-Prerender routes unchanged; new `ƒ /i/[slug]/calendar.ics`, `ƒ /i/[slug]/og.png`.

### E-008 · B-008 Countdown and add-to-calendar (G-025)
- **Before (confirmed s09):** no countdown or calendar export anywhere in the renderer (F-005, F-012).
- **Acceptance:** RFC 5545 file with the correct UTC `DTSTART` from the event zone; countdown hidden after the event; no layout shift; flag for rollback.
- **Change:** `lib/flags.ts` (new: env flags `FLAG_<NAME>=on|off`, defaults `GUEST_CALENDAR` on, `OPAQUE_GUEST_LINKS` off); `lib/invitation/calendar.ts` (new: `buildIcs` with TEXT escaping and 75-octet folding by UTF-8 octets, `calendarEventsFromConfig`, `googleCalendarUrl`, `countdownParts`); `lib/invitation/headline.ts` (renderer's name logic moved out and shared); `components/invitation/countdown.tsx` (client island, `role="timer"`, fixed-size boxes, server-rendered with the request time so hydration matches); `app/i/[slug]/calendar.ics/route.ts` (published invitations only via `loadPublishedInvitationSummary`, no guest data, `Cache-Control: public, max-age=300`); renderer shows the countdown and the two save-the-date links for a future primary event (links only when PUBLISHED).
- **Deviation:** the backlog proposed a new `app/i/[slug]/calendar/route.ts` (never created); that path would shadow a guest whose slug is `calendar`. Side routes end in a dotted segment (`calendar.ics`, `og.png`), which no slug generator can emit (`[a-z0-9-]`; asserted in the tests).
- **No invented data:** a missing or non-increasing end leaves `DTEND` out (RFC 5545 §3.6.1) instead of assuming a duration; the Google link then uses a zero-length range.
- **Live (19:25Z):** guest page renders `role="timer"` "46 hari lagi menuju Akad Nikah" and both links; `calendar.ics` 200 `text/calendar`, `DTSTART:20261220T010000Z` for 08:00 WIB, CRLF only, longest line 64 octets; unknown and draft invitations 404.
- **Risk / rollback:** L. `FLAG_GUEST_CALENDAR=off`.

### E-010 · B-010 Per-invitation link-preview image (G-011, QA-009)
- **Before (confirmed s09):** guest pages had `og:title` only; no `og:image` or `og:description` on the personal link.
- **Acceptance:** 1200×630 `og:image` with names and date for every published invitation; hostile names render as text; `og:description` from the opening copy; no guest data.
- **Change:** `lib/invitation/palettes.ts` (renderer palettes moved out unchanged, plus `paletteHex()` so the image uses the page colours); `lib/invitation/preview-image.ts` (model, FNV-1a content hash for the URL so edits bust caches, `invitationShareMetadata` → description, Open Graph, Twitter card); `app/i/[slug]/og.png/route.tsx` (`next/og` `ImageResponse`, published only, `Cache-Control: public, max-age=600`, overriding next/og's one-year immutable default); both public pages spread the share metadata; `app/layout.tsx` `metadataBase` from `NEXT_PUBLIC_APP_URL` (invalid value ignored rather than breaking every page).
- **Finding during the live check (new, s09):** for glyphs outside its bundled Latin font, `next/og` fetches fonts from `fonts.googleapis.com` with the characters in the query string and emoji from jsDelivr at render time, and draws Arabic without bidi shaping (letters reversed in our test image). Sending parts of customers' names to a third party is a data transfer we have no basis for (UU PDP), so names outside the bundled font are left out of the image (label and date remain) while `og:title` still carries them as text. Bundling licensed fonts through the harness asset gate would lift this.
- **Live (19:25Z):** `og:image` `…/og.png?v=6ix2p5` 1200×630, `og:description` = opening copy, no guest name in any Open Graph/Twitter tag; PNG 1200×630 (27 KB); hostile couple name on the disposable db rendered as literal text, page HTML escaped (0 raw `<script>`); unknown and draft 404. Images viewed: `/tmp/agent-browser/og-*.png` (not committed).
- **Risk / rollback:** L. Revert.

### E-011 · B-011 Opaque guest links behind a flag; legacy links keep working; real 404 (G-005, QA-003)
- **Before (confirmed s09):** guest slug = slugified name and the only credential; `/i/budi-sari/tamu-999` answered **200**. Cause observed in the s09 build: with `experimental.ppr: true` the route is Partial Prerender, so the shell's 200 is flushed before the page calls `notFound()`.
- **Owner decision found while implementing:** `docs/systems/guest-management.md` records "slug polos, TANPA token … (keputusan whyme)". The masterplan did not cite it. Resolution: token minting ships **off** by default (`FLAG_OPAQUE_GUEST_LINKS`), so default behaviour keeps the owner's decision; turning it on is the owner's call. The 404 fix applies regardless.
- **Acceptance:** with the flag on, new guests get `/i/<slug>/<opaque token>`; legacy slug links still render and answer; unknown guests 404.
- **Change:** `lib/invitation/guest-link.ts` (new: 128-bit base64url tokens, `guestLinkSegment`, `pickGuestForSegment` — token first, then the slug of a guest **without** a token, so a tokenized guest is never reachable by the guessable slug); `lib/db/schema.ts` + migration `0010_guest_link_token.sql` (`ADD COLUMN "link_token" varchar(32)` + unique index; generated with `drizzle-kit generate --name guest_link_token`); `findGuestByLinkSegment` in `lib/invitation/public.ts`, used by the page loader **and** `app/i/[slug]/actions.ts` (one rule); both guest-creation actions mint a token when the flag is on; renderer hidden inputs and the WhatsApp share link use `guestLinkSegment`; `next.config.ts` `ppr: 'incremental'` + `experimental_ppr = true` in `app/layout.tsx` (every other route keeps PPR, confirmed by the route table) and `= false` on the two `/i/**` pages.
- **Live (19:30Z):** known guest 200; `tamu-999` **404**; unknown invitation 404; invitation page 200; with a token set on `nama-panjang` (disposable db): token URL 200, its slug URL 404, form carries the token, RSVP posted with the slug → `rsvp=closed` and no write, RSVP with the token → `2|2|CONFIRMED`; token removed → slug URL 200 again. No server errors.
- **Limits:** the flag-on minting path in the dashboard needs a signed-in Clerk session (not exercised; source-asserted); CSV import of guests does not exist in code yet (docs mention it), so nothing to change there.
- **Risk / rollback:** M (rendering mode of two routes). Revert `next.config.ts`/layout/page exports to restore PPR; tokens are additive and only minted with the flag on.

## Session 11 (2026-11-04; baseline `e873680`)
Order and reasoning: LATEST §4 and `sessions/session-11-20261104-0420.md` (05:20Z). Checks: `pnpm typecheck`, `pnpm test`, snapshot build (`local-stack.sh sync && build`, without middleware per D-012), live requests against `local-stack.sh start` on :3100, SQL counted with `log_statement=all` on the disposable Postgres (`/vercel/share/work/tools/count-queries.sh`, sandbox-only helper).

### E-012 B-017a atomic view dedupe (DONE s11)
- **Before (confirmed):** `trackInvitationView()` ran select → insert → update as separate statements. The new DB check reproduced the race on the old sequence: 20 concurrent first opens → **19 VIEW rows, `opened_count` 19**.
- **Acceptance (backlog):** 20 concurrent first opens of one guest → exactly one VIEW row and `opened_count` + 1; an open after the window still counts; a tracking failure never blocks the page.
- **Change:** new `lib/invitation/view-tracking.ts` `recordInvitationView()`: one transaction serialised by `pg_advisory_xact_lock(<"VIEW">, guestId | -invitationId)`, then check → insert → increment. `lib/invitation/public.ts` `trackInvitationView()` delegates and stays best-effort (try / catch). Additive index `analytics_events_view_dedupe_idx (invitation_id, guest_id, event_type, created_at)` in `lib/db/schema.ts` + migration `0011_analytics_view_dedupe_index.sql` (generated with `drizzle-kit generate`; the only diff was the index).
- **Tests / checks:** `scripts/verify-view-dedupe.ts` against the disposable Postgres. All six checks pass (one row of 20 concurrent opens, exactly one call reports a write, `opened_count` 1, no write inside the window, +1 after the window, one row of 20 concurrent anonymous opens), and the old sequence produced 19 rows under the same load. Unit test for lock-key separation. Live: the first open of a guest logs one advisory lock + one VIEW insert; a repeat open inside the window logs the lock and no insert.
- **Limits:** the spike consistency re-run (`summarize-spike.py`) was not repeated; the DB check is the direct proof.
- **Risk / rollback:** L. Revert `view-tracking.ts` and the call; the index is additive (`DROP INDEX analytics_events_view_dedupe_idx`).

### E-013 B-014 step 1: one loader call per request, no locale cookie on `/i/*` (DONE s11; step 2 open)
- **Before (measured on the `e873680` build):** a guest open ran `loadPublicInvitation()` twice (metadata + page). Per request: 2 invitation lookups, 2 guest lookups, 2 media and 4 guestbook queries (13 statements with view tracking). The invitation page ran 9 statements.
- **Change:** `loadPublicInvitation` wrapped in React `cache()` with primitive arguments (`includeDraft` became the third positional argument; `app/preview/[id]/page.tsx` and the B-005 source assertion updated). `middleware.ts` no longer sets the `locale` cookie on `/i/*` (`lib/locale-cookie.ts` `mirrorsLocaleCookie()`); the locale still reaches the layout through the `x-app-locale` header.
- **After (same build method):** guest open → 1 invitation, 1 guest, 1 media, 2 guestbook queries (the loader runs once); invitation page → 1 / 0 / 1 / 2. Known guest 200, `tamu-999` 404, second fixture 200.
- **Tests:** source assertions for `cache()` and the middleware guard; `mirrorsLocaleCookie()` unit cases (`/invitations` keeps the cookie).
- **Limits:** the cookie change cannot be observed live here because measurement builds run without middleware (P-INV-010). It is unit-tested and source-asserted only. Step 2 (cacheable invitation-level shell behind a flag, the cross-guest leakage test, spike CPU target ≤ 2 × `next-min`) is not started.
- **Risk / rollback:** L. Revert the wrapper and the guard.

### E-014 Content contract, lenient read path, honest editor (DONE s11)
- **Before (confirmed, `01-codebase-audit/template-editability-s11.md`):** any schema failure in a stored config rendered an empty invitation (`safeParse` → `{}`); the editor offered 10+ inputs the guest page never shows and a guestbook "moderation" toggle that is not enforced.
- **Change:** `lib/invitation/content-contract.ts` (`CONTENT_SCHEMA_VERSION` 1, `RENDER_CAPABILITIES` per section: rendered / storedOnly / hostOnly / caveat; type-only schema import, so the client editor bundles no zod); `lib/invitation/content-read.ts` `normalizeStoredConfig()` (per-section lenient read, dropped key names logged without values); `detail-config.ts` gains optional `schemaVersion` (absent = 1); `public.ts` reads through it. Editor: an amber note under each section title lists stored-only fields, says when a whole section is not shown yet (Music, Instagram Story), and states the moderation caveat; Control Center cards for those sections carry a "Belum tampil" badge.
- **Tests:** `tests/content-contract.test.ts` (11 tests): every schema section classified and nothing else; every `rendered` field is read by the renderer / headline sources; no `storedOnly` field is; notices derived from the map; profile-tab mapping per event type; lenient read (round-trip, legacy `art` + broken `events` dropped while other sections survive, non-objects, future version). Two mutations caught (marking music rendered; rendering `guestbook.moderation`).
- **Live:** a fixture invitation given a legacy `art` key and an invalid `events` entry rendered names and RSVP. Only the events section was missing, and the server logged `config sections skipped on read: art, events`. The fixture was restored afterwards.
- **Limits:** the editor UI needs a signed-in Clerk session, so it was not viewed in a browser in this sandbox. Its logic is unit-tested and it typechecks and builds. The design families that will move fields to `rendered` are not built yet.
- **Risk / rollback:** L. Revert the three modules and the editor note; stored data is untouched (reads only).
