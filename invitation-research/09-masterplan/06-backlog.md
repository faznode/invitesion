<!-- SUMMARY (first 7 lines — greppable) -->
# 06-backlog.md — prioritized backlog B-001… (P0 / P1 / P2)
> WHAT: Every item with problem, evidence, module/path mapping, solution, acceptance criteria, tests, impact, effort, risk, dependencies, rollback. P0 is capped at 12 (brief 03 §19).
> STATUS: s12 (2026-11-04; verified s10, v2 s09, v1 s08). The 12 P0 items and the four next-phase P1 items (B-014, B-015, B-016, B-017a) carry the full chain inline. **s12:** the other 26 P1 items and the 26 P2 gaps now have proposed behaviour, acceptance, verification and rollback in "Chains for the remaining P1 and P2 items" below, which completes their chain together with `upgrade-map.csv` (RQ-MP-06 / RQ-MP-15). Checks needing real Clerk keys, a PJP sandbox or legal review are marked EXT. (Earlier status text follows.) The other P1 / P2 items have evidence, modules / paths, effort / risk and dependencies (through `../06-gap-analysis/upgrade-map.csv`) but no acceptance, verification or rollback yet; write them before an item enters a sprint (RQ-MP-06 in `../_handoff/acceptance-matrix.md`). Implementation status per item: `../_handoff/IMPLEMENTATION-LOG.md`.
> OWNER: Research agent (autonomous, brief 05 §16)
> DEPS: ../06-gap-analysis/{upgrade-map.csv,must-have-p0.md}, ../05-feature-matrix/feature-matrix.csv, 12-decision-log.md, ../01-codebase-audit/{quality-audit.md,revalidation-s10.md}, ../08-backend-rust-plan/spike/results/s09-20261103-r1/summary.md
> GREP: backlog, B-0, P0, P1, P2, acceptance, rollback
> UPDATED: 2026-11-04

Scales: impact 1–5; effort S ≤ 2 dev-days, M ≤ 2 weeks, L > 2 weeks; risk L/M/H (breakage of published invitations, payments, authorization, or irreversible data change). Every P0 is **revalidated against current code before coding**. Product code at `64678cf` is identical to `2c94140` and, for the renderer, editor, analytics route, `lib/invitation/` and `app/i/`, to the audited `22ed99e` (s09 git diff). Re-verified live in s09: QA-005 (allowance 2 → 1 on every spike arm), QA-003's 200 for unknown guests, B-002's "Rp0", B-003's three quotes, B-005's `/${slug}` link and `addons.theme` gate.

## P0 (dependency order)
**Status at `7a00a6d` (IMPLEMENTATION-LOG):** done s09: B-001…B-008, B-010, B-011 (entries E-001…E-011). Open: B-009 (builds on B-012) and B-012 (partly delivered, see its status line). The remaining P0 work is the first implementation-phase step.

### B-001 Catalog templates keep their preset (G-001, QA-001, ADR-O01)
- **Problem:** `template-sync.ts` stores `{ ...preset, art }`; the strict schema rejects `art`; `create.ts` falls back to `{}` → every catalog invitation starts empty.
- **Evidence:** runtime check `unrecognized_keys: ["art"]` (ADR-O01); probe 64/64 (QA-001).
- **Modules / paths:** M-008, M-009, M-010, M-023 · `lib/invitation/create.ts`, `lib/invitation/templates.ts`, `lib/invitation/template-sync.ts`.
- **Solution:** a pure `presetConfigFromTemplateDefaults()` that drops template-owned keys (`art`) before validation; `create.ts` and the `templates.ts` parse use it. Strict schema unchanged.
- **Acceptance:** for all 64 registry templates, the derived config parses and keeps the preset's sections; unknown non-template keys still fail validation.
- **Tests:** unit test over the whole registry + a negative case.
- **Impact 5 · Effort S · Risk L · Depends: — · Rollback:** revert the commit (no data change; existing invitations untouched).

### B-002 Prices on marketing pages come from `lib/pricing.ts` (G-003, ADR-O02)
- **Problem:** homepage and `/pricing` advertise "Rp0 / GRATIS"; checkout charges Rp 149k / 299k.
- **Evidence:** ADR-O02 code facts; FM-122.
- **Modules / paths:** M-001, M-003 · `app/page.tsx`, `app/pricing/page.tsx`, `app/marketing-copy.ts`, `lib/pricing.ts`.
- **Solution:** a shared price-label helper built on `priceFor()`; copy keeps "free" only for drafting / preview.
- **Acceptance:** no page claims a free plan; every rendered price string equals `formatMoney(priceFor(tier, currency))`.
- **Tests:** unit test on the helper; text assertions on the copy module (no "Rp0" / "GRATIS" plan).
- **Impact 5 · Effort S · Risk L · Depends: — · Rollback:** revert.

### B-003 No unverified religious text in presets; verified corpus scaffold (G-004, QA-015, ADR-O04)
- **Problem:** three presets ship Qur'an translations of unknown provenance into new invitations.
- **Evidence:** `lib/invitation/templates.ts` quote blocks attributed to QS. Az-Zariyat 49, QS. Ibrahim 40, QS. Al-Hasyr 10 (re-verified at `64678cf`, s09); no source, edition or permission recorded anywhere (QA-015, F-029, ADR-O04).
- **Modules / paths:** M-006 · `lib/invitation/templates.ts`, new `content/verified-religious-texts/{README.md,corpus.json}`, `lib/invitation/religious-text.ts`.
- **Solution:** presets carry a `quote` block only when its text is in the verified corpus (empty today → omitted, not paraphrased); corpus README defines provenance fields; harness check rejects unverified religious text.
- **Acceptance:** no registry preset contains a quote absent from the corpus; existing invitations untouched.
- **Tests:** registry-wide unit test; corpus schema test.
- **Impact 4 · Effort S · Risk L · Depends: — · Rollback:** revert; re-enable entries once verified.

### B-004 Event times in the event's own time zone (G-002, QA-002)
- **Problem:** times formatted in the server zone with a hard-coded "WIB": 08:00 WIB renders "01.00 WIB" on UTC servers; WITA events shown as WIB.
- **Evidence:** QA-002 (code audit at `22ed99e`); `components/invitation/public-renderer.tsx` is byte-identical at `64678cf` (s09 `git diff 22ed99e 64678cf` empty for the renderer, editor, analytics route, `lib/invitation/` and `app/i/`); server-side rendering on a UTC host (the Vercel function default, ADR-O06) turns the hard-coded label into a wrong time.
- **Modules / paths:** M-013 · `components/invitation/public-renderer.tsx` (`formatTime` and date helpers) → new `lib/invitation/event-time.ts`.
- **Solution:** format with `Intl.DateTimeFormat('id-ID', { timeZone })` from the event's zone (`Asia/Jakarta` / `Asia/Makassar` / `Asia/Jayapura`), label WIB / WITA / WIT from the same zone; fall back to Asia/Jakarta when unset.
- **Acceptance:** with `TZ=UTC`, an 08:00 WIB event renders "08.00 WIB" and a 19:00 WITA event "19.00 WITA".
- **Tests:** unit tests for the three zones and DST-free offsets, run under `TZ=UTC`.
- **Impact 5 · Effort S · Risk L · Depends: — · Rollback:** revert.

### B-005 Editor preview opens the real guest page; theme tab reachable (G-013, QA-011)
- **Problem:** "Pratinjau" links to `/${slug}` (404); the theme tab is gated on `config.addons.theme`, a key the strict schema forbids.
- **Evidence:** QA-011 (code audit; route table has no `/[slug]` page, guest pages live under `/i/`); `detailConfigSchema` top level is `.strict()` without `addons.theme` (ADR-O01 context).
- **Modules / paths:** M-018 · `app/(customer)/dashboard/invitations/[id]/edit/editor.tsx`, `lib/invitation/public-url.ts`.
- **Solution:** preview opens an owner route rendering the guest renderer for any status (s09: `/i/<slug>` refuses drafts and would count the owner's visits as guest views); theme tab gated on a schema-valid condition, template switching kept out of the editor (B-036, B-041).
- **Acceptance:** the preview link resolves to the owner preview `/preview/<id>` (ownership-checked, drafts included, no view tracking; `/i/<slug>` stays the public URL); the theme tab renders for every invitation. **Done s09 (E-005).**
- **Tests:** unit test of the link builder; source assertion that the editor no longer builds `/${slug}`.
- **Impact 4 · Effort S · Risk L · Depends: B-001 · Rollback:** revert.

### B-006 CSV export neutralises spreadsheet formulas (G-014, QA-012)
- **Problem:** the guest/RSVP CSV export quotes values but leaves leading `= + - @` intact, so a guest name or wish can run as a formula when the host opens the file (CSV injection); guest names come from hosts' imports and wishes from anyone with a link.
- **Evidence:** QA-012 (code audit, `analytics/route.ts`); FM-068; competitors export spreadsheets too (S-ENV-001, S-INV-002), so hosts will open these files in Excel / Sheets.
- **Modules / paths:** M-020 · `app/(customer)/dashboard/invitations/[id]/analytics/route.ts` → `lib/csv.ts`.
- **Solution:** prefix cells starting with `= + - @`, tab or carriage return with `'`, then quote.
- **Acceptance:** a guest named `=HYPERLINK("x")` exports as `"'=HYPERLINK(""x"")"`.
- **Tests:** unit tests with hostile names.
- **Impact 3 · Effort S · Risk L · Depends: — · Rollback:** revert.

### B-007 RSVP keeps the host's allowance (G-006, QA-005)
- **Problem:** the answer overwrites `guest_count`, so decline → 0 → re-confirm caps at 1 (re-verified s08).
- **Modules / paths:** M-014, M-035 · `app/i/[slug]/actions.ts`, `lib/db/schema.ts`, new additive migration.
- **Solution:** additive nullable column `attending_count`; RSVP writes it and leaves `guest_count` (allowance) alone; readers use `attending_count ?? guest_count` for totals; backfill not needed (null = legacy).
- **Acceptance:** confirm 2 of 2, decline, confirm 2 again → allowance stays 2 and attending is 2.
- **Tests:** pure rule test (`rsvpAttendance()`), migration file reviewed as additive.
- **Impact 4 · Effort S · Risk L · Depends: — · Rollback:** revert code; the extra column is harmless and can be dropped later.

### B-008 Countdown and add-to-calendar (G-025)
- **Problem:** guests cannot save the date or see time remaining; both are table stakes on Indonesian guest pages.
- **Evidence:** neither exists in the renderer (F-005, F-012); present on 8 of 9 Indonesian vendors per the upgrade map (G-025: C-WEV-104, C-VID-103, C-IVT-104; FM-008 countdown, FM-021 add-to-calendar).
- **Modules / paths:** M-013 · renderer + `app/i/[slug]/calendar.ics/route.ts` (ICS, built on `lib/invitation/calendar.ts`) + client island `components/invitation/countdown.tsx` (paths as shipped in E-008; the s08 plan named a `calendar` route without the `.ics` segment).
- **Acceptance:** ICS validates (RFC 5545 fields, correct `DTSTART` in UTC from the event zone); countdown hides after the event; no layout shift. **Done s09 (E-008)**; route is `app/i/[slug]/calendar.ics/route.ts` (a dotted segment cannot shadow a guest slug).
- **Tests:** ICS builder unit tests; CLS gate in the harness.
- **Impact 4 · Effort S · Risk L · Depends: B-004 · Rollback:** feature flag off.

### B-009 Cover gate, background music, pause control (G-024)
- **Problem:** no cover / "Buka Undangan" moment and `config.music` is never rendered, so the most expected Indonesian guest-page ritual (open → music) is missing.
- **Evidence:** renderer has no cover or `<audio>` (F-003, F-004, F-072; C-INV-001 `musicControl=false`); cover + music on 8–9 of 9 Indonesian vendors (C-ENV-122, C-INV-111, C-WEV-104, S-IDI-006). Opening ≠ playback (D-016), so playback is verified only on devices.
- **Modules / paths:** M-013, M-009, M-027 · `components/invitation/public-renderer.tsx`, new client island `components/invitation/cover-audio.tsx`, `lib/invitation/detail-config.ts` (existing `music` block).
- **Acceptance:** cover dialog with a visible Indonesian label and accessible name, operable from first paint; one `<audio>` with `preload="none"` that starts only on the tap; pause/mute control with `aria-pressed`; `prefers-reduced-motion` skips intros; tier budgets hold (B-012).
- **Tests:** renderer test; harness gates (a11y, reduced motion, weight); manual in-app-browser check recorded as a limitation until a device is available.
- **Impact 5 · Effort M · Risk M · Depends: B-012 · Rollback:** flag off.

### B-010 Per-invitation OG image (G-011, QA-009)
- **Problem:** WhatsApp link previews show no image (only `og:title`), on the channel through which every invitation is distributed.
- **Evidence:** QA-009, F-032; og:image present on WEV / VID / ENV / IVT / INV / KAT demos (C-WEV-104, C-VID-101, C-ENV-111; FM-047).
- **Modules / paths:** M-012 · `app/i/[slug]/[guestSlug]/page.tsx` (metadata), `app/i/[slug]/og.png/route.tsx` with `lib/invitation/preview-image.ts` (paths as shipped in E-010; the s08 plan named `opengraph-image.tsx`).
- **Acceptance:** `og:image` (1200×630) with names and date for every published invitation; hostile names render as text; `og:description` from the opening copy. **Done s09 (E-010)** as `app/i/[slug]/og.png/route.tsx`; names outside the bundled Latin font stay out of the image because `next/og` would fetch their glyphs from Google Fonts with the characters in the URL.
- **Tests:** route test; metadata test.
- **Impact 4 · Effort M · Risk L · Depends: — · Rollback:** revert.

### B-011 Opaque guest links behind a flag; legacy links keep working (G-005, QA-003)
- **Problem:** the guest slug (slugified name) is the only credential, so anyone with one link can guess another guest's link and answer or post as them; unknown guests get a 200 page.
- **Evidence:** QA-003; s09 smoke test at `64678cf`: `/i/budi-sari/tamu-999` answers **200** on the product page (the spike's minimal routes answer 404); IVT uses an opaque code (C-IVT-101), INV / IDI put names in clear text (S-INV-001, S-IDI-002).
- **Modules / paths:** M-014, M-015, M-019 · `lib/invitation/slug.ts`, `app/i/[slug]/[guestSlug]/page.tsx`, `app/i/[slug]/actions.ts`, `lib/db/schema.ts` (additive `guests.link_token`), new migration.
- **Acceptance:** with the flag on, new guests get `/i/<slug>/<opaque token>`; legacy slug links still render and answer; unknown guests return 404 (not 200 + "tidak ditemukan"). **Done s09 (E-011)**: flag default **off** because `docs/systems/guest-management.md` records the owner's "slug without token" decision; the 404 comes from opting `/i/**` out of PPR (`ppr: 'incremental'`).
- **Tests:** token generation (entropy, URL-safe), lookup precedence, 404 status.
- **Impact 4 · Effort M · Risk M · Depends: B-007 (same table) · Rollback:** flag off; tokens are additive.

### B-012 Guest-page budgets enforced by the template harness (G-065)
- **Problem:** our one measured advantage (guest-page speed and weight) has no guard; motion, music and 3D (B-009, B-030) can erase it, and nothing records asset licenses.
- **Evidence:** lab lead Perf 94 / LCP 2.53 s / 311 KiB vs eligible competitor medians Perf 28–55, LCP 12.6–23.1 s, 3,084–7,192 KiB (unconditional population, s13; 2,404–7,192 KiB with the provisional Enviory themes, D-031) (C-INV-005 limits; FM-156/157/160); no license or byte record for any template asset (template-system audit §5).
- **Modules / paths:** new `tools/template-harness/`, `templates/_harness-samples/`, `content/verified-religious-texts/`, `tests/template-harness.test.ts`; contract in `08-template-system-and-harness.md`.
- **Acceptance:** `harness bench` fails a template that exceeds its tier budget (weight, image, font, JS) and `check` fails missing reduced-motion support, unlicensed fonts and unsafe personalization; budgets are **internal**, anchored on our own pre-P0 page (C-INV-005) with headroom per tier, and are not competitor-parity thresholds (`../04-template-benchmarks/benchmark-pack.md` §5, `08-template-system-and-harness.md`); a report says PASS only when every static gate, proof, Lighthouse result and planned snapshot is valid (INCOMPLETE otherwise).
- **Tests:** harness self-tests with deliberate failures (oversized asset, unlicensed font, missing reduced motion, hostile name, invalid Lighthouse result).
- **Status (s10):** partly delivered. `tools/template-harness/` CLI, self-tests (`tests/template-harness.test.ts`, 9 / 9 after the s10 report-validity fix) and three sample reports with valid Lighthouse results (`templates/_harness-samples/*/GENERATION-REPORT.md`, all PASS) exist. Open: the product renderer is not a harness template, so no product guest page is gated yet, and no CI runs the gates (RQ-ORIG-02).
- **Impact 5 · Effort M · Risk L · Depends: — · Rollback:** not product code.

## P1 for the next phase: full chain (s10)
These four items are the next implementation step after B-009 / B-012 (`11-pricing-growth-roadmap.md` §4). Paths were checked against `7a00a6d`.

### B-014 Cached invitation-level render, single loader call, no locale cookie on `/i/*` (G-008, QA-006, ADR-A1)
- **Problem:** every guest open is a full uncached server render (`force-dynamic`, `private, no-store`, a `Set-Cookie: locale` on each response) and the loader runs twice (in `generateMetadata` and in the page), so server cost grows linearly with guests opening links at the same moment (wedding-day bursts).
- **Evidence:** s09 spike, lab, no middleware: the product page costs ≈ 27–30 ms server CPU per view vs ≈ 4 ms for the same server with one loader call and minimal HTML; one loader call with the full render still costs ≈ 25–31 ms, so the render is the cost; wrapping the loader in `cache()` leaves server CPU unchanged and cuts Postgres CPU by ≈ 1/3 (`../08-backend-rust-plan/spike/results/s09-20261103-r1/`, `…-cache/`, `…-cache-r2/`; ADR-A1). Code: `generateMetadata` and the page both call `loadPublicInvitation()` in `app/i/[slug]/[guestSlug]/page.tsx` and `app/i/[slug]/page.tsx`; `middleware.ts` sets the `locale` cookie on every matched response.
- **Modules / paths:** M-012, M-032 · `app/i/[slug]/page.tsx`, `app/i/[slug]/[guestSlug]/page.tsx`, `lib/invitation/public.ts`, `middleware.ts`, `lib/flags.ts` (new flag).
- **Solution:** wrap `loadPublicInvitation()` in React `cache()`; skip the locale cookie on `/i/*`; render an invitation-level shell that is cacheable and invalidated on publish / edit, with per-guest parts (name, RSVP state, guest-only gift details) rendered per request; behind a new flag in `lib/flags.ts`, default off until the leakage test passes.
- **Acceptance:** one loader call per request (metadata + page); no `Set-Cookie` on `/i/*` responses; with two guests of one invitation opened interleaved under load, no response ever contains the other guest's name or RSVP state; an edit or publish is visible on the next open; legacy slug links and token links (B-011 flag) both keep working; on the spike harness, product-page server CPU per view ≤ 2 × the `next-min` arm on the same machine and workload.
- **Tests:** unit test that the loader runs once per request; integration test for cross-guest leakage on the disposable Postgres; spike re-run with `summarize-spike.py --check`; guest-route regression tests (`tests/`).
- **Impact 4 · Effort M · Risk M** (cross-guest leakage, stale pages after edits) · **Depends:** ADR-A1 (done); pairs with B-015 · **Rollback:** flag off returns to the current per-request render; no data change.
- **Status: step 1 DONE s11 (E-013):** loader in `cache()` (one load per request, measured: 2 → 1 invitation lookups per guest open) and no `locale` cookie on `/i/*` (unit-tested; not observable in middleware-less measurement builds). **Step 2 open:** cacheable invitation-level shell behind a flag, the cross-guest leakage test and the spike CPU target. **s21 (D-039): step 2 evaluated, no shell cache shipped.** On Next.js 15.6.0-canary.59, `'use cache'` reuses rendered work in the guest route (45 / 45 hits), but caching the whole page saved ≈ 1 ms of ≈ 29.6 ms server CPU per view, because Next still replays and SSR still parses the cached Flight stream; the profile's levers shipped instead (E-042 = B-015, E-043 shared formatters): 28.5 → 22.2 ms per view, same host. The CPU target (≤ 2 × `next-min`) is still not met.

### B-015 ClerkProvider scoped to authenticated route groups (G-009, QA-007)
- **Problem:** `ClerkProvider` wraps the root layout, so anonymous guests on `/i/*` download clerk-js they never use (+70.7 KB brotli, 325 KB parsed), on the cheap phones and in-app browsers where guests open invitations.
- **Evidence:** QA-007 (H-INV-004); `app/layout.tsx` imports `ClerkProvider` and is the only file outside the route groups that imports `@clerk/nextjs`; ENV guest pages carry no third-party scripts besides fonts (C-ENV-111). C-INV-005 omitted middleware and real keys, so this cost is **not** in our lab numbers.
- **Modules / paths:** M-030, M-032 · `app/layout.tsx` → layouts of `app/(customer)/`, `app/(admin)/`, `app/(login)/`.
- **Solution:** move `ClerkProvider` (appearance + localization) into the three authenticated route-group layouts; guest pages, marketing pages and `/preview/[id]` keep server-side `auth()` through `middleware.ts`, which does not need the client provider.
- **Acceptance:** the HTML and JS of `/i/<slug>/<guest>` contain no clerk-js and no Clerk bootstrap; sign-in, sign-up, dashboard and admin still work with real keys; `/preview/[id]` stays ownership-checked.
- **Tests:** build-output assertion that guest-route chunks exclude `@clerk/*`; HTML check on the local stack; signed-in smoke on a preview deployment with real Clerk keys (EXT: owner, P-INV-010).
- **Impact 4 · Effort S · Risk M** (a page that silently relied on the root provider breaks) · **Depends:** — · **Rollback:** revert the layout move.
- **Status: DONE s21 (E-042) except the EXT smoke.** Provider in the three group layouts; scan test `tests/b015-clerk-scope.test.ts`; guest, public and home pages carry no Clerk bootstrap and load no Clerk chunk (50 / 50, before vs after on the same data); guest page 125 → 50 KB; server CPU per view 28.5 → 24.9 ms. Signed-in pages with real keys remain unverified (P-INV-010).

### B-016 Contrast-safe palette tokens (G-010, G-066, QA-008)
- **Problem:** guest-page text fails WCAG AA contrast on several palettes, which hurts older relatives and outdoor reading and erodes our accessibility lead.
- **Evidence:** QA-008 (C-INV-001/002 Lighthouse `color-contrast`): 11 nodes at 3.86:1 (ivory accent `#a1743c` on `#faf7f2`) and 16 nodes at 1.64:1 (light ink on `bg-white/70` cards on dark palettes); FM-163: our 96 vs competitor medians 77–86, ENV 100.
- **Modules / paths:** M-013, M-036 · `lib/invitation/palettes.ts` (palettes moved here in E-010), `components/invitation/public-renderer.tsx`.
- **Solution:** per-palette token pairs (text, accent and muted on each surface) that meet WCAG 2.x AA; dark palettes get solid card surfaces instead of translucent white under light ink; hues kept so each palette stays recognisable.
- **Acceptance:** every text pair used by the renderer meets ≥ 4.5:1 (≥ 3:1 for large text and UI glyphs); Lighthouse `color-contrast` passes on a rendered sample of every palette; stored invitations keep their palette IDs (no data change).
- **Tests:** unit test computing WCAG contrast for every palette pair; harness accessibility gate on samples.
- **Impact 3 · Effort S · Risk L** · **Depends:** — · **Rollback:** revert the palette values.

### B-017a Atomic view dedupe (G-012, s09 spike)
- **Problem:** `trackInvitationView()` reads for a recent VIEW and then inserts; two near-simultaneous first opens both pass the check, so hosts see inflated "opened" counts and duplicate events.
- **Evidence:** s09 spike round 1, 300 guests, 30-minute window: duplicate VIEW events for 8 guests on the product page and 1 each on the minimal and Rust arms, with `opened_count` inflated to match (`../08-backend-rust-plan/spike/results/s09-20261103-r1/summary.md`); code `lib/invitation/public.ts` (`trackInvitationView`, select-then-insert-then-update); QA-010 (no index for the dedupe scan).
- **Modules / paths:** M-012, M-035 · `lib/invitation/public.ts`, `lib/db/schema.ts`, new additive migration after `lib/db/migrations/0010_guest_link_token.sql`.
- **Solution:** make insert-and-count atomic (one statement guarded by a uniqueness rule with `ON CONFLICT DO NOTHING … RETURNING`, or a row lock on the guest) and increment `opened_count` only when a VIEW row was written; additive index on `analytics_events (invitation_id, guest_id, event_type, created_at)`.
- **Acceptance:** 20 concurrent first opens of one guest yield exactly one VIEW row and `opened_count` + 1; an open after the window still counts; a tracking failure still never blocks the page.
- **Tests:** DB-backed concurrency test on the disposable Postgres (`local-stack.sh`); spike consistency re-run shows 0 duplicates of 300 on every arm.
- **Impact 3 · Effort S · Risk L** · **Depends:** — (the index overlaps B-017) · **Rollback:** revert the code; index and constraint are additive and can be dropped.
- **Status: DONE s11 (E-012).** A per-guest advisory transaction lock was used instead of a uniqueness rule, because a 30-minute window cannot be expressed as a unique key. Migration `0011`; `scripts/verify-view-dedupe.ts` passes, while the old sequence wrote 19 rows for 20 concurrent opens.

## P1 (next; one line each, full mapping in `../06-gap-analysis/upgrade-map.csv`)
| ID | Item | Gap | Effort / risk | Depends |
|---|---|---|---|---|
| B-013 | Rate limits + moderation flag honoured on RSVP / wishes | G-007 | M / L | B-011 |
| B-014 | (full chain above) Cached invitation-level render with per-guest parts per request; loader `cache()`; no locale cookie / Clerk on `/i/*` — the measured performance lever (ADR-A1, s09 spike: page ≈ 27–30 ms vs ≈ 4 ms server CPU for minimal HTML; `cache()` alone: server CPU unchanged, Postgres CPU ≈ −1/3; target ≤ 2 × `next-min`, no cross-guest leakage) | G-008 | M / M | ADR-A1 (done) |
| B-015 | (full chain above) ClerkProvider scoped to authenticated route groups | G-009 | S / M | — |
| B-016 | (full chain above) Contrast-safe palette tokens | G-010, G-066 | S / L | — |
| B-017 | Indexes on guest_messages / analytics_events | G-012 | S / L | — |
| B-017a | (full chain above) Atomic view dedupe (one statement + uniqueness rule): duplicate VIEW rows and inflated `opened_count` under concurrency on every spike arm (8 / 1 / 1 of 300 in s09 round 1) | G-012 | S / L | — |
| B-018 | wa.me normalisation + editable message everywhere | G-015 | S / L | — |
| B-019 | Image pipeline (resize, AVIF/WebP, srcset) | G-017 | M / M | — |
| B-020 | Tests for renderer / guest actions + CI workflow | G-019 | M / L | — |
| B-021 | Guest privacy notice + host disclosure | G-022 | S / L | B-031 |
| B-022 | Marketing claims match shipped features | G-023 | S / L | — |
| B-023 | Render full couple profiles (names, parents, photos) | G-026 | S / L | — |
| B-024 | QR pass + browser scanner + greeting screen | G-027 | L / M | B-011 |
| B-025 | Gallery lightbox / layouts / video facade | G-028 | M / L | B-019 |
| B-026 | Gift block: copy buttons, host QRIS image, accounts on personal links only | G-030, G-021 | S / L | — |
| B-027 | RSVP depth: maybe, deadline, custom questions, per-event | G-031 | M / L | B-007 |
| B-028 | Wish moderation, host reply, visibility | G-032 | M / L | B-013 |
| B-029 | Render dress code, agenda, ceremony blocks, hashtag | G-033 | S / L | — |
| B-030 | Template system v2 (manifest, section contract, layouts, motion tiers) | G-034 | L / M | B-012 |
| B-031 | Retention / deletion + reviewed privacy policy | G-059 | M / M | legal review |
| B-032 | Memorial preset with sober defaults | G-060 | S / L | B-001, B-003 |
| B-033 | Bulk import + self-registration link | G-037 | M / L | — |
| B-034 | RSVP / open analytics + WhatsApp follow-up lists (idea I-06) | G-039, G-038 | M / L | B-018 |
| B-035 | Live preview + autosave | G-040 | M / M | B-005 |
| B-036 | Free theme switching within the tier | G-042 | S / M | B-001 |
| B-037 | Wizard + try-with-your-names | G-043 | M / L | B-001 |
| B-038 | Enforced CSP on guest pages | G-058 | M / M | B-015 |
| B-039 | Local payments through a licensed PJP | G-049 | L / M | owner contract (ADR-O03) |
| B-040 | Entry-tier / reverse-trial experiment | G-051 | S / M | owner decision, B-013 |
| B-041 | Server-side entitlement check on theme changes: the config PATCH accepts any `theme.templateId` / `paletteId` from the owner, so a Standard invitation can take a Premium look while checkout prices the DB template (QA-026, found s09 while doing B-005) | G-042 | S / M | — (precedes B-036) |

## P2 (later)
G-016 licensed self-hosted art · G-018 guest UI i18n · G-020 observability · G-029 map facade · G-035 share button + story image · G-036 elder mode (idea I-05; promote if the B-030 tokens make it S) · G-038 WhatsApp API blast · G-041 section order / font / colour · G-044 co-hosts and ushers · G-045 seating / souvenir / gift logging · G-046 version history UI · G-047 passcode · G-048 custom slug / domain · G-050 receipts · G-052 reseller workspace · G-053 coupons / affiliate · G-054 assisted setup · G-055 print / e-card export · G-056 AI copy with safeguards · G-057 video invitations · G-061 help centre · G-062 admin CMS via manifests · G-063 audience variants · G-064 host PWA · G-021 accounts only on personal links (delivered with B-026) · G-068 PROTECT unlimited editing, 12-month period, free drafting (keep; no code change). *(s13: G-021 and G-068 were missing from this list although `upgrade-map.csv` marks them P2 and the chain table below covers them; 26 P2 items in total.)*

## Chains for the remaining P1 and P2 items (s12, RQ-MP-06 / RQ-MP-15)
Each row completes the chain for an item that had evidence, problem, modules and paths, effort, risk and dependencies, but no acceptance, verification or rollback:
- **Evidence and problem:** `../06-gap-analysis/upgrade-map.csv` columns `competitor_evidence`, `qa_ids`, `current_behavior`, under the same gap ID.
- **Modules / paths:** `module_ids`, `paths` in the same file; all 99 cited paths resolved in s10.
- **Priority, effort / risk, dependencies:** the P1 table above, or `upgrade-map.csv` for P2.

Rules that apply to every row:
- **Compatibility:** existing invitations and shared links keep working; any stored-config change is additive and versioned (`CONTENT_SCHEMA_VERSION`).
- **Content contract:** a field moves from stored-only to `rendered` in `lib/invitation/content-contract.ts` in the same change that renders it (enforced by `tests/content-contract.test.ts`).
- **Scoping and scripture:** every dashboard query is scoped to the session owner. No religious text is generated or hardcoded (ADR-O04: approved corpus only).
- **Verification here:** "Verification" names checks runnable in this sandbox. Checks needing real Clerk keys, a PJP sandbox or legal review are marked **EXT**.

**Rollout (added s13).** The s12 rows give rollback but state rollout only where a flag is named (14 of 52), and the owner's chain definition requires both. Rollout classes:
- **Dark behind a flag** (`lib/flags.ts`, default off): enable on the disposable fixture invitation, run the row's verification, then the owner enables it.
- **Render-when-filled**: ships directly after verification. Existing invitations look unchanged until the host fills the new fields, because empty fields render nothing.
- **Per-invitation opt-in or new-only default**: existing invitations keep today's behaviour.
- **Direct after verification**: additive, read-only, copy or security changes with no behaviour change for existing invitations.
- **Gated by an external step** (EXT): legal text, PJP contract, staffing, hosting or real-key checks before any exposure.

| Item | Rollout |
|---|---|
| B-013 | Flag; limits first, moderation enforcement for new wishes only (existing wishes keep their visibility) |
| B-017 | Direct; additive migration. On a large production table use `CREATE INDEX CONCURRENTLY` in a hand-written migration so writes are not blocked |
| B-018 | Direct; one call site at a time, the old builder deleted last |
| B-019 | Flag for new uploads; a resumable backfill job for existing media later; the renderer falls back to originals throughout |
| B-020 | Tests land first; the owner enables the workflow by pushing (EXT) |
| B-021 | Flag; enabled after the owner approves the text (depends on B-031) |
| B-022 | Direct copy change |
| B-023 | Render-when-filled |
| B-024 | Flag, then per-invitation opt-in |
| B-025 | Direct for the lightbox; layouts only where `gallery.layout` is set |
| B-026 | New-only default: new invitations default on, existing ones keep today's visibility |
| B-027 | Per-feature flags |
| B-028 | Flag; the moderation toggle is enforced or removed in the same release |
| B-029 | Render-when-filled |
| B-030 | Per-invitation opt-in: a family is chosen explicitly; invitations without one keep the legacy layout |
| B-031 | Soft-delete window first, hard delete after it; policy published after professional review (EXT) |
| B-032 | New memorial invitations only |
| B-033 | Flag |
| B-034 | Direct (read-only) |
| B-035 | Flag, after the signed-in check with real keys (EXT) |
| B-036 | After B-041; rule change behind the same entitlement check |
| B-037 | Flag |
| B-038 | Report-only period first, then the enforced header |
| B-039 | Rail flag; PJP sandbox first; contract EXT |
| B-040 | Flag, after the owner's decision (EXT) |
| B-041 | Direct (security fix) |
| G-016 | Per template; old URLs remain the fallback until every asset ships |
| G-018 | Dictionary first; the invitation language defaults to Indonesian |
| G-020 | Instrumentation in a non-production environment first; vendor EXT |
| G-021 | With B-026 |
| G-029 | Direct; the static map link stays |
| G-035 | Direct; hideable |
| G-036 | Per-device opt-in toggle |
| G-038 | Provider flag after the owner's decision (EXT) |
| G-041 | Per family; only contract-declared options are offered |
| G-044 | Per-invitation role grants (opt-in) |
| G-045 | Flag |
| G-046 | Direct (UI); restore touches config only |
| G-047 | Per-invitation opt-in |
| G-048 | Opt-in; the old slug keeps redirecting; domains need hosting (EXT) |
| G-050 | Direct for new payments; earlier payments on request |
| G-052 | Workspace flag |
| G-053 | Admin-created coupons only; none active by default |
| G-054 | Operational pilot after staffing and an owner-consent flow (EXT) |
| G-055 | Per-invitation export link (opt-in) |
| G-056 | Flag, off by default |
| G-057 | Only after B-030 families exist; offered as a separate product |
| G-061 | Each article published only after the B-022 claim check |
| G-062 | Read-only manifests first; publishing gated by review |
| G-063 | Per-invitation opt-in; single variant by default |
| G-064 | After web-dashboard parity; same APIs and authorisation |
| G-068 | Not applicable (protects existing behaviour; no change ships) |

**s13 chain verification (RQ-MP-06 / RQ-MP-15).** Programmatic check against `../06-gap-analysis/upgrade-map.csv`:
- P1: 26 chain rows = the 26 P1 items that lacked a full chain.
- P2: 26 rows = the 26 P2 gaps in the map.
- No empty cell in either table.
- Every referenced gap carries `competitor_evidence` and `current_behavior`.
- Four P2 gaps (G-054, G-055, G-057, G-064) lacked `module_ids` / `paths`; s13 filled them with existing modules and explicitly proposed paths marked "(new)".
- Rollout was missing for 38 rows; the table above adds it.

Content was not rewritten: acceptance, verification and rollback cells are s12's text.

### P1
| Item (gap) | Proposed behaviour | Acceptance | Verification | Rollback |
|---|---|---|---|---|
| B-013 (G-007, QA-004) | Per-guest and per-IP limits on RSVP and wishes; `guestbook.moderation` honoured | Within the window, the N+1th write returns a typed "too many requests" result and writes nothing. With moderation on, a new wish is stored hidden and absent from the guest payload until approved; off, behaviour unchanged | Limiter unit tests with an injected clock; action tests; DB check that hidden wishes never reach the guest page payload | Flag in `lib/flags.ts` off; enforcement per invitation can be disabled; uses the existing `is_hidden`, no schema change |
| B-017 (G-012, QA-010) | Additive indexes `guest_messages (invitation_id, created_at)`, `analytics_events (invitation_id, type, created_at)` | Guest-page and dashboard queries use index scans on a seeded ≥ 10k-row table; results identical | Migration on the disposable DB; `EXPLAIN ANALYZE` before / after recorded; suite unchanged | `DROP INDEX` migration (no data change) |
| B-018 (G-015, QA-013) | Every `wa.me` link built by `toWhatsAppNumber()` with the editable message and personal link | `08…`, `+62…`, `62…` normalise identically; an invalid number yields no link plus a visible hint; no second builder remains | Helper unit tests with Indonesian formats; grep for other `wa.me` builders; guest-list render test | Revert (helper and UI only) |
| B-019 (G-017, QA-016) | Resize + AVIF / WebP variants at upload; `srcset` / `sizes` in the renderer | A 5 MB JPEG yields variants within the per-tier image budget; the guest page requests the variant for its viewport; originals kept; media without variants still render | Variant-planner unit test; storage-driver integration test with a fixture image; CDP bytes before / after on the fixture invitation at 360 and 412 px | Renderer falls back to originals; generation behind a flag; variants deletable without touching originals |
| B-020 (G-019, QA-018) | Renderer, guest-action and editor tests + CI (typecheck, tests, build, throwaway Postgres) | CI runs on every push; a deliberately broken renderer or action change fails it; the build needs no secrets | Tests run here; the workflow on GitHub is **EXT** (owner pushes); deliberate-failure commit on a branch | Disable the workflow; tests are additive |
| B-021 (G-022, QA-023) | Short guest-facing notice (opens, RSVP, wishes are recorded) + host disclosure + policy link | Notice on every guest page in ID / EN, keyboard-reachable, never blocks content; dashboard discloses tracking; owner-approved text | Render test; axe on the guest page; copy review; final policy text **EXT** (B-031) | Flag off hides the notice; no data change |
| B-022 (G-023, QA-024) | Marketing claims only for shipped capabilities; future ones labelled or removed | Every claim in `app/marketing-registry.ts` maps to a shipped capability; none for ticketing, seating, check-in or reminders while config-only | Unit test cross-checking registry claims against the render-capability map and flags; copy review | Revert copy |
| B-023 (G-026) | Render full couple profiles (full names, parents, child order, photos) when filled | Filled fields render in their own section; empty fields render nothing (no empty headings); contract moves them to `rendered` | Renderer tests: filled, empty, long, hostile, RTL, emoji; browser check at 360 / 412 px; contract test | Revert the section; data already stored |
| B-024 (G-027) | Signed per-guest QR, browser scanner for hosts, full-screen greeting | QR carries an HMAC token, not the guest id; check-in is idempotent; forged, expired or replayed tokens rejected; scanner has a manual fallback; greeting shows the display name only | Token sign / verify / replay unit tests; DB idempotency test; browser test without a camera | Flag off hides QR and scanner; records kept; tokens inert |
| B-025 (G-028) | Lightbox island, `gallery.layout` honoured, video facade (poster + tap) | Keyboard lightbox (focus trap, Esc, arrows); layouts visibly distinct; video loads only after a tap; CLS and JS budget held; reduced motion respected | Interaction tests; axe; CDP bytes and CLS before / after at 360 px | Revert to the grid |
| B-026 (G-030, G-021) | Copy buttons; host-uploaded static QRIS image (no custody); accounts only on personal links | Copy writes the exact number; QRIS image only when uploaded (type / size validated). With the setting on, a slug-only request has no account digits in HTML or the RSC payload. **New** invitations default on; existing ones keep today's visibility until the host changes it | Payload assertion test; upload validation test; clipboard test | Setting off restores today's behaviour; additive config key; images deletable |
| B-027 (G-031, QA-027) | Render the existing RSVP config: maybe, deadline, custom questions, per-event answers | After the deadline (event time zone, B-004) the form shows a closed state and the action rejects writes; "maybe" counted separately; answers stored and exported (CSV neutralised, B-006); errors announced accessibly | Action tests around the deadline; DB checks; export test; browser test | Per-feature flags; config untouched; answers retained |
| B-028 (G-032, QA-004) | Hide / restore wishes, host reply, visibility (public / hosts only); settles the moderation toggle (s11 finding) | Hidden wishes never in the guest payload; replies render under the wish; "hosts only" removes the wall; the toggle is either enforced or removed: no saved-but-ignored setting | Payload tests; owner-scoped dashboard action tests; contract test | Flag; un-hide all; replies kept hidden |
| B-029 (G-033) | Render dress code, agenda, ceremony blocks, hashtag when filled | Filled blocks render in contract order; empty ones render nothing; contract updated; no generated religious text | Renderer tests (long, hostile, RTL); browser check; contract test | Revert the blocks |
| B-030 (G-034) | Template system v2: manifest, section contract, design-family layouts, motion tiers (harness workstream) | ≥ 3 families with distinct composition (one non-wedding) render the same data through the contract; each passes harness budgets and a recorded visual review; invitations without a family render the legacy layout unchanged | Harness check per family at 360 / 390 / 412 / wide + stress fixtures; contract tests; legacy fixture render comparison | Family field ignored → legacy renderer; manifests additive |
| B-031 (G-059) | Host-triggered deletion; retention after expiry; reviewed privacy policy | Deletion removes or anonymises guests, messages, analytics and media for the invitation; deleted links answer 404 / 410; the retention job is documented | Disposable-DB test (no rows remain); storage-driver deletion test; job dry run; policy text **EXT** (professional review) | Soft-delete window before hard delete; policy versioned |
| B-032 (G-060) | Memorial (tahlilan) preset with sober defaults, host-written text only | Memorial templates create configs with music, gift and countdown off; no celebratory copy; no religious text unless from the approved corpus (empty → none) | Registry test over memorial templates; renderer check; copy review | Revert the preset; existing invitations unaffected |
| B-033 (G-037) | CSV / XLSX import with preview and dedupe; self-registration link | Preview flags duplicates and invalid numbers; import is atomic and within plan limits; self-registration creates a pending guest, rate-limited | Parser tests (BOM, `;` delimiter, 08 / 62 numbers); transaction test; rate-limit test | Delete by import batch id (additive column); flag off |
| B-034 (G-039, G-038) | Analytics by group and event, opens over time, export; follow-up lists (not opened, not answered) | Numbers equal DB counts under the B-017a dedupe; follow-up links come from B-018; owner-scoped | Query tests on seeded data; dedupe consistency check; export test | Read-only feature; revert the UI |
| B-035 (G-040) | Debounced autosave via the detail API; side-by-side preview with the public renderer | Edits persist ≤ 2 s after idle with a version check and visible saved / failed state; the preview equals the published render for the same data; no lost update across two tabs | Version-conflict action tests; preview-equality test; signed-in browser check **EXT** (real Clerk keys, P-INV-010) | Flag → manual save |
| B-036 (G-042) | Free theme switching within the paid tier | Same-tier switch keeps content and never invokes checkout; a higher tier requires an upgrade | Entitlement tests (after B-041) | Revert the entitlement rule |
| B-037 (G-043) | Wizard (names + date + theme → draft) and try-with-your-names preview | Typed names render without persistence; save requires sign-in and creates the draft; hostile input escaped; nothing stored before save | Renderer test with typed props; catalog preview check; XSS fixtures | Flag off |
| B-038 (G-058) | Enforced CSP on guest pages after the report-only period | Report-only period with no unexplained violations; enforced policy with nonces; media, maps and music still load | Header tests; browser check with the enforced policy; violation-log review | Header back to report-only |
| B-039 (G-049) | PJP adapter (QRIS, VA, e-wallet) behind the rail interface | Sandbox payments create, confirm via signed webhook, stay idempotent on retries; totals recomputed server-side; no real charge | Adapter tests with recorded sandbox payloads; signature tests; `scripts/verify-payment.ts` extended; contract **EXT** | Rail flag off → manual QRIS confirmation |
| B-040 (G-051) | Entry tier / reverse trial (owner decision) | Only the owner-approved option, behind a flag, prices from `lib/pricing.ts`; events defined before launch; existing paid invitations untouched | Pricing tests; copy from `priceFor()`; off by default; decision **EXT** | Flag off |
| B-041 (G-042, QA-026) | Server-side entitlement check on theme changes in the config PATCH | Changing `theme.templateId` / `paletteId` beyond the paid tier is rejected for paid invitations; checkout price matches the stored template | API tests: owner, non-owner, tier up / down; QA-026 regression test | Revert only if it blocks legitimate edits (security fix) |

### P2
| Gap | Proposed behaviour | Acceptance | Verification | Rollback |
|---|---|---|---|---|
| G-016 | Licensed, self-hosted theme art | No runtime request to third-party image endpoints; every asset has a licence record | Grep + CDP request list on fixture pages; licence register check | Keep old URLs as fallback until assets ship |
| G-018 | Guest UI language (ID / EN, regional later) | Guest strings come from the dictionary; the language follows the invitation setting; `lang` attribute correct | Dictionary completeness test; render test per language | Default to Indonesian |
| G-020 | Observability and status page | Errors and slow requests visible without personal data; status page for outages | Synthetic error test; log redaction test; vendor **EXT** | Remove the instrumentation hook |
| G-021 | Accounts only on personal links | Covered by B-026 | B-026 | B-026 |
| G-029 | Map facade | Map iframe loads only after a tap; the static link always works | CDP request count before / after | Revert to the iframe |
| G-035 | Share button + story image | Native share or copy link; the story image uses OG data (B-010), never guest data | Render test; image generation test | Hide the button |
| G-036 | Elder-friendly reading mode | Larger type and contrast within the B-016 tokens; persists per guest device | Contrast tests; browser check at 360 px | Toggle removed |
| G-038 | WhatsApp workflow (official API, reminders) | Only through an official provider after the owner's decision; opt-out honoured; no gateway scraping | Adapter tests with a sandbox; provider **EXT** | Provider flag off → `wa.me` |
| G-041 | Section order, font and colour choice inside the contract | Choices limited to contract-declared options per family; invalid choices rejected | Contract tests; render per option | Ignore the choice keys (legacy look) |
| G-044 | Co-hosts and ushers | Role-scoped access; ushers see check-in only | Authorisation tests per role; signed-in check **EXT** | Revoke roles; owner-only access |
| G-045 | Seating, souvenir and gift logging | Host-only logs; never shown to guests | Owner-scoped tests; export test | Feature flag off; data kept |
| G-046 | Version history UI | Restoring a version restores config only, never payments or guests | Restore test on the disposable DB | Hide the UI |
| G-047 | Passcode-protected invitation | Without the passcode nothing beyond the cover renders; the passcode is rate-limited | Payload test; rate-limit test | Passcode off |
| G-048 | Custom slug and domain | Slugs follow `lib/invitation/slug.ts`; old links redirect; domains verified | Slug tests; redirect test; domain check **EXT** (hosting) | Keep the old slug as a redirect |
| G-050 | Receipts | Receipts carry only the payment record's data; numbering monotonic | Receipt generation test | Disable the receipt link |
| G-052 | Reseller workspace and credits | Tenant isolation proven by tests; credits deducted atomically | Isolation and concurrency tests | Workspace flag off |
| G-053 | Coupons and affiliate | Discounts computed server-side; one use per rule; no stacking unless allowed | Pricing tests with coupons | Disable coupons |
| G-054 | Assisted setup service | Operational process with consent to handle guest data | Process review **EXT** (staffing) | Stop offering |
| G-055 | Print / e-card export with QR | Export uses invitation data only; QR resolves to the right guest link | Export render test; QR decode test | Hide export |
| G-056 | AI copy assist with safeguards | Suggestions only, edited by the host; no religious text (corpus rule); no guest data sent | Prompt-safety tests; no-PII payload test | Feature off |
| G-057 | Video invitation product | Rendered from the same content; within budgets | Harness check on the video family | Not offered |
| G-061 | Help centre and tutorials | Every article matches shipped behaviour (B-022 rule) | Claim cross-check test | Unpublish articles |
| G-062 | Admin template CMS via manifests | Only reviewed manifests can be published; no arbitrary HTML / JS | Manifest validation tests; review gate | Manifests read-only |
| G-063 | Audience variants of one invitation | Variants differ only in contract fields; personal links pick the variant | Variant render tests | Single variant |
| G-064 | Host app / PWA | Same APIs and authorisation as the web dashboard | Authorisation tests; device check **EXT** | Web dashboard only |
| G-068 | PROTECT: unlimited editing, 12-month period, free drafting | Any change to these rules is an explicit owner decision; regression tests pin the current rules | `lib/invitation/publish-rules.ts` tests | n/a (protective) |
