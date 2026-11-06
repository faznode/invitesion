<!-- SUMMARY (first 7 lines — greppable) -->
# 09-backend-and-frontend-architecture.md — target architecture, measured Rust verdict, data changes, deployment, operations, rollback
> WHAT: The architecture we keep and evolve: guest page, editor and marketing frontends; server actions, data layer and schema changes; the measured Next.js vs Rust decision (ADR-A1); deployment, observability and rollback.
> STATUS: **s25 (2026-11-06): body brought to current code.** §1 adds the outcome since s09 (B-014 step 1, D-039, E-042 / E-043: 22.2 ms per view; ADR-A1 unchanged); the §2 "today" column and the §3 data model describe the s25 code (migrations 0000–0015); §4 adds the s21 single-host measurements; §7 records DA-01. The s09 spike sets (`../08-backend-rust-plan/spike/results/s09-20261103-r{1,2}/`, `…-cache{,-r2}/`) are unchanged and not re-run. Earlier: verified s10 (v1 s09).
> OWNER: Research agent (Architect role)
> DEPS: ../08-backend-rust-plan/README.md, 04-current-state.md, 06-backlog.md, 08-template-system-and-harness.md, 10-data-privacy-security-payments.md, 12-decision-log.md (ADR-A1, ADR-O01, ADR-O06), ../01-codebase-audit/revalidation-s10.md
> GREP: architecture, frontend, backend, rsc, server action, cache, rust, axum, verdict, schema, migration, deployment, observability, rollback, D-039, use cache
> UPDATED: 2026-11-06

## 1. Decision in one paragraph
Invitesion stays a single Next.js App Router application on Postgres (Drizzle) with Clerk for identity (ADR-A1). The s09 spike shows the guest page's cost is our own render path rather than the runtime: the product page needs ≈ 27–30 ms server CPU per page in the lab, the same server doing one load and minimal HTML ≈ 4 ms, and Rust doing identical work ≈ 0.3 ms but then waits on Postgres. A fourth measurement (loader in React `cache()`, two rounds) isolates the duplicate loader call: it costs about a third of the database CPU per page and nothing measurable on the server, so ≈ 85–90 % of the server CPU is rendering the full template. The plan therefore fixes correctness first (allowance and unknown guests shipped in s09 as B-007 and B-011; view dedupe next as B-017a), then caches the invitation-level render inside Next.js (B-014), adds telemetry, and keeps a documented trigger for an incremental Rust service on a future non-React hot path.

**What happened since (s11–s21; ADR-A1 unchanged):**
- **Correctness shipped:** B-007 and B-011 (s09), then B-017a (s11; a per-guest advisory lock, because a 30-minute window is not a unique key).
- **The duplicate loader is gone** (B-014 step 1, E-013).
- **The invitation-level cache was built and measured, then not shipped (D-039).** On Next.js `15.6.0-canary.59`, `'use cache'` reuses rendered work in the guest route (45 / 45 hits). But caching the whole page saved ≈ 1 ms of ≈ 29.6 ms, because Next still replays the cached Flight stream and SSR still parses it.
- **The profile's levers shipped instead:** no Clerk on guest pages (B-015, E-042) and shared date formatters (E-043). Server CPU went from 28.5 to **22.2 ms per view** on one host.
- **Still open:** the ≤ 2 × `next-min` target is not met, and no telemetry exists yet (G-020).
- **What is left:** React's HTML render and Flight work in proportion to the page. A shell cache is revisited only with a new measured mechanism or framework capability (D-039).

## 2. Frontend
| Surface | Today (s25; `7a00a6d` state in parentheses where it changed) | Target |
|---|---|---|
| Guest page `/i/[slug]/[guestSlug]` | Dynamic RSC render with PPR opted out, and **one loader call** (E-013; was two). **No Clerk provider or chunk** (E-042). **Five layouts** over one data path (classic default, four families, B-030). Countdown island, `calendar.ics` and `og.png` side routes, and a real 404 for unknown guests (s09). RSVP depth (B-027); a child's photo through `…/photo/<slot>` with per-request checks (D-040). Census (s24, decoded): documents 38.6–72.2 KiB per family on the review fixture, of which the inline RSC payload is 30–44 KiB. Server CPU 22.2 ms per view. No cover or audio yet (B-009) | Per-guest personalization inside a cheaper render: a smaller payload, fewer client boundaries (LATEST §4; whole-page cache only per D-039). Template sections from manifests (B-030). Client islands only for cover and audio (B-009), countdown and optional lazy 3D. Budgets: harness gates exist and run by hand (B-012); CI (B-020) |
| Editor / dashboard | Client-heavy editor with five `any` types left. Preview opens the owner route `/preview/[id]` (s09). **Since s17:** the question editor (E-031), RSVP counts (E-033), answers on the host's guest page (E-036), the invite-only panel and host override (E-038), person and child photo uploads (E-039, E-047). **No theme entitlement check on save (B-041, open)** | Live preview and autosave (B-035); entitlement check on theme changes (B-041); typed editor state as debt work |
| Marketing / catalog | Static pages; prices rendered from `lib/pricing.ts` (s09). The roadmap section lists unbuilt features as roadmap items (s25 spot check) | Template previews from manifests; claims audited against shipped features (B-022) |
| Styling | Tailwind 4 and shadcn; brand tokens in `app/globals.css`. Template palettes in `lib/invitation/palettes.ts` are **contrast-safe token pairs with a photo bound** (B-016, E-015). Family layouts use the shared tokens and fonts | Template tokens from manifests |

Rules carried into the custom skills: no client JavaScript on the guest page unless the island is declared in the manifest; images through a resize pipeline (B-019); fonts self-hosted, two families maximum; `prefers-reduced-motion` honoured wherever motion exists.

## 3. Backend
- **Writes from guests** are server actions (`app/i/[slug]/actions.ts`) authorised by the guest link. Rules kept; fixes: attending count stored separately from the allowance (B-007, shipped s09), opaque links (B-011, shipped s09 behind a default-off flag; slug links stay compatible), rate limits and moderation (B-013).
- **Reads** go through `lib/invitation/public.ts`. Changes: React `cache()` per request (database CPU per page ≈ −1/3, measured); the invitation-level render (guest-independent template sections) cached per invitation with tag invalidation on publish / edit / wish / moderation, guest-specific parts rendered per request, tested for cross-guest leakage (B-014); the view tracker becomes one atomic statement (B-017a).
- **Data model changes (all additive, each in its own migration):** No column is dropped or rewritten; old code keeps working against the new schema.

  **Shipped:**
  - 0009 `guests.attending_count` (nullable; null = legacy rows).
  - 0010 `guests.link_token` (nullable; unique when set).
  - 0011 a view-dedupe index. A per-guest advisory lock is used instead of a uniqueness rule (B-017a).
  - 0012 RSVP answers.
  - 0013 durable event ids.
  - 0014 answers per event.
  - 0015 `guests.invited_event_ids` (D-037).
  
  **Still open:** an index on `guest_messages` (B-017; analytics lookups are served by 0011's index).
- **s25 state of the read and write fixes above:**
  - `cache()` shipped (E-013); the invitation-level cache was not shipped (D-039).
  - The view tracker is atomic (E-012).
  - Rate limits and moderation are still open (B-013, B-028).
  - Children's photos follow D-040's access contract: ownership is checked at save, render and delivery, and `/media/protected/*` is owner-only.
- **Template-owned data** (`art`, later section components) stays out of the strict per-invitation `DetailConfig` (ADR-O01).
- **Payments** keep the rail interface and manual confirmation until a PJP contract exists (ADR-O03).
- **Background work** (WhatsApp blasts, OG image generation at scale) is not built; when needed it goes to the platform's queue/workflow primitives before any self-managed Redis.

## 4. Measured comparison (summary; full data in `../08-backend-rust-plan/README.md` §3)
| Lab measure (round 1) | Product page | Next.js minimal route | Rust minimal route |
|---|---|---|---|
| Read spike throughput, 40 VUs | 36 req/s | 242 req/s | 1,156 req/s (Postgres-bound) |
| Server CPU per page | ≈ 30 ms | ≈ 4 ms | ≈ 0.3 ms |
| Postgres CPU per page | ≈ 3.2 ms | ≈ 1.4 ms | ≈ 1.0 ms |
| p95 at 10 req/s | 35.5 ms | 6.8 ms | 2.3 ms |
| RSVP burst throughput | 261 req/s | 359 req/s | 1,439 req/s |
| Server RSS | ≈ 0.7 GB | ≈ 0.7 GB | 6 MB |
Round 2 (reversed order) stayed within 2–24 % of round 1. Product page with the loader in `cache()` (two rounds): server CPU per page 25–31 ms (unchanged), Postgres CPU per page ≈ 2.0–2.2 ms (≈ −1/3). Write consistency held on every arm; the view-dedupe race and the allowance overwrite reproduced on every arm (stack-independent defects; the allowance overwrite was fixed in s09 by B-007, the view-dedupe race is B-017a). A minimal Rust page is not the product page; the product page needs the React template system wherever it runs.

**Since s09** (one host, same data, before vs after interleaved; IMPLEMENTATION-LOG E-042 / E-043, D-039; not the spike harness):
- The guest route's server CPU per view went 28.5 → 24.9 ms with E-042, then → 22.2 ms with E-043.
- A `'use cache'` whole page saved ≈ 1 ms of ≈ 29.6 ms.
- These figures compare our own builds. They do not change the round-1 table above, and they are not a Rust comparison.

## 4a. Client-side measurements of our own builds (s23r, RQ-OWN-02)
Three builds on one host, interleaved, 6 Lighthouse runs each (`../04-template-benchmarks/own-builds/own-build-comparison-s23r.md`):
- The s23r page paints ≈ 0.67–0.82 s earlier than `22ed99e` and `9bbd813`.
- It transfers ≈ 67–69 KB less than either.
- LCP, TBT and score are not established.

This is a separate population from the competitor captures and is never pooled with them.

## 5. Deployment and operations
Vercel functions in `sin1` with the database in the same region (ADR-O06); a connection pooler in front of Postgres before raising concurrency; telemetry for `/i/*`, RSVP and wishes before any further performance claim; no guest personal data in logs. Detail and runbook seeds: `../08-backend-rust-plan/README.md` §4–§6.

## 6. Rollback strategy
Code changes revert with the deploy; schema changes are additive and stay in place when code is reverted; caching and new guest-link tokens sit behind flags; the template system v2 keeps today's renderer as the fallback for templates without section components. No component of this plan requires a one-way migration.

## 7. Open dependencies (not invented here)
Hosting and database regions and plans, real Clerk keys (production middleware behaviour, P-INV-010), traffic history or analytics access, PJP contract, legal review of retention and gift money.

- **Real Clerk keys (s25):** the owner deferred real-Clerk signed-in acceptance out of this rebuild phase (DA-01, `../_handoff/deferred-acceptance.md`). Builds with middleware compile with placeholder keys and are never served; measurement builds omit middleware (D-012).
- **Children's-photo migration:** running it in real environments is a deployment step (DA-02).
