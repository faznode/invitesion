<!-- SUMMARY (first 7 lines — greppable) -->
# 06-backlog.md — prioritized backlog B-001… (P0 / P1 / P2)
> WHAT: Every item with problem, evidence, module/path mapping, solution, acceptance criteria, tests, impact, effort, risk, dependencies, rollback. P0 is capped at 12 (brief 03 §19).
> STATUS: Verified s10 (2026-11-04; v2 s09, v1 s08). The 12 P0 items and the four next-phase P1 items (B-014, B-015, B-016, B-017a) carry the full chain: problem, evidence, modules / paths, solution, acceptance, tests, impact / effort / risk, dependencies, rollback. **Open:** the other P1 / P2 items have evidence, modules / paths, effort / risk and dependencies (through `../06-gap-analysis/upgrade-map.csv`) but no acceptance, verification or rollback yet; write them before an item enters a sprint (RQ-MP-06 in `../_handoff/acceptance-matrix.md`). Implementation status per item: `../_handoff/IMPLEMENTATION-LOG.md`.
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
- **Evidence:** lab lead Perf 94 / LCP 2.53 s / 311 KiB vs eligible competitor medians Perf 28–55, LCP 12.6–23.1 s, 2,404–7,192 KiB (C-INV-005 limits; FM-156/157/160); no license or byte record for any template asset (template-system audit §5).
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

### B-015 ClerkProvider scoped to authenticated route groups (G-009, QA-007)
- **Problem:** `ClerkProvider` wraps the root layout, so anonymous guests on `/i/*` download clerk-js they never use (+70.7 KB brotli, 325 KB parsed), on the cheap phones and in-app browsers where guests open invitations.
- **Evidence:** QA-007 (H-INV-004); `app/layout.tsx` imports `ClerkProvider` and is the only file outside the route groups that imports `@clerk/nextjs`; ENV guest pages carry no third-party scripts besides fonts (C-ENV-111). C-INV-005 omitted middleware and real keys, so this cost is **not** in our lab numbers.
- **Modules / paths:** M-030, M-032 · `app/layout.tsx` → layouts of `app/(customer)/`, `app/(admin)/`, `app/(login)/`.
- **Solution:** move `ClerkProvider` (appearance + localization) into the three authenticated route-group layouts; guest pages, marketing pages and `/preview/[id]` keep server-side `auth()` through `middleware.ts`, which does not need the client provider.
- **Acceptance:** the HTML and JS of `/i/<slug>/<guest>` contain no clerk-js and no Clerk bootstrap; sign-in, sign-up, dashboard and admin still work with real keys; `/preview/[id]` stays ownership-checked.
- **Tests:** build-output assertion that guest-route chunks exclude `@clerk/*`; HTML check on the local stack; signed-in smoke on a preview deployment with real Clerk keys (EXT: owner, P-INV-010).
- **Impact 4 · Effort S · Risk M** (a page that silently relied on the root provider breaks) · **Depends:** — · **Rollback:** revert the layout move.

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
G-016 licensed self-hosted art · G-018 guest UI i18n · G-020 observability · G-029 map facade · G-035 share button + story image · G-036 elder mode (idea I-05; promote if the B-030 tokens make it S) · G-038 WhatsApp API blast · G-041 section order / font / colour · G-044 co-hosts and ushers · G-045 seating / souvenir / gift logging · G-046 version history UI · G-047 passcode · G-048 custom slug / domain · G-050 receipts · G-052 reseller workspace · G-053 coupons / affiliate · G-054 assisted setup · G-055 print / e-card export · G-056 AI copy with safeguards · G-057 video invitations · G-061 help centre · G-062 admin CMS via manifests · G-063 audience variants · G-064 host PWA.
