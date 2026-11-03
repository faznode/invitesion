<!-- SUMMARY (first 7 lines — greppable) -->
# 09-backend-and-frontend-architecture.md — target architecture, measured Rust verdict, data changes, deployment, operations, rollback
> WHAT: The architecture we keep and evolve: guest page, editor and marketing frontends; server actions, data layer and schema changes; the measured Next.js vs Rust decision (ADR-A1); deployment, observability and rollback.
> STATUS: FINAL v1 (session 09, 2026-11-03) on the s09 spike (`../08-backend-rust-plan/spike/results/s09-20261103-r{1,2}/` matched comparison; `…-cache{,-r2}/` loader-in-`cache()` variant).
> OWNER: Research agent (Architect role)
> DEPS: ../08-backend-rust-plan/README.md, 04-current-state.md, 06-backlog.md, 08-template-system-and-harness.md, 10-data-privacy-security-payments.md, 12-decision-log.md (ADR-A1, ADR-O01, ADR-O06)
> GREP: architecture, frontend, backend, rsc, server action, cache, rust, axum, verdict, schema, migration, deployment, observability, rollback
> UPDATED: 2026-11-03

## 1. Decision in one paragraph
Invitesion stays a single Next.js App Router application on Postgres (Drizzle) with Clerk for identity (ADR-A1). The s09 spike shows the guest page's cost is our own render path rather than the runtime: the product page needs ≈ 27–30 ms server CPU per page in the lab, the same server doing one load and minimal HTML ≈ 4 ms, and Rust doing identical work ≈ 0.3 ms but then waits on Postgres. A fourth measurement (loader in React `cache()`, two rounds) isolates the duplicate loader call: it costs about a third of the database CPU per page and nothing measurable on the server, so ≈ 85–90 % of the server CPU is rendering the full template. The plan therefore fixes correctness (allowance, view dedupe, unknown guests), then caches the invitation-level render inside Next.js, adds telemetry, and keeps a documented trigger for an incremental Rust service on a future non-React hot path.

## 2. Frontend
| Surface | Today (`64678cf`) | Target |
|---|---|---|
| Guest page `/i/[slug]/[guestSlug]` | `force-dynamic` RSC render; loader runs twice (metadata + page); one palette-only renderer for 64 templates; ≈ 140 KB HTML uncompressed; no cover, audio, countdown | per-invitation cached data + per-guest personalization; template sections from the manifest (B-030); client islands only for cover + audio (B-009), countdown (B-008) and optional lazy 3D; budgets enforced by the harness (B-012); 404 for unknown guests (B-011) |
| Editor / dashboard | client-heavy editor, `any`-typed state, preview link 404 (QA-011) | preview to the real guest URL (B-005); live preview + autosave later (B-035); typed editor state as debt work |
| Marketing / catalog | static pages, price copy contradicts checkout | prices rendered from `lib/pricing.ts` (B-002); template previews from manifests |
| Styling | Tailwind 4 + shadcn; brand tokens in `app/globals.css`; template palettes hand-synced in two files | template tokens from manifests; contrast-checked palettes (B-016) |

Rules carried into the custom skills: no client JavaScript on the guest page unless the island is declared in the manifest; images through a resize pipeline (B-019); fonts self-hosted, two families maximum; `prefers-reduced-motion` honoured wherever motion exists.

## 3. Backend
- **Writes from guests** are server actions (`app/i/[slug]/actions.ts`) authorised by the guest link. Rules kept; fixes: attending count stored separately from the allowance (B-007), opaque links (B-011), rate limits and moderation (B-013).
- **Reads** go through `lib/invitation/public.ts`. Changes: React `cache()` per request (database CPU per page ≈ −1/3, measured); the invitation-level render (guest-independent template sections) cached per invitation with tag invalidation on publish / edit / wish / moderation, guest-specific parts rendered per request, tested for cross-guest leakage (B-014); the view tracker becomes one atomic statement (B-017a).
- **Data model changes (all additive, each in its own migration):** `guests.attending_count` (nullable; null = legacy rows), `guests.link_token` (nullable, unique when set), a uniqueness rule or single-statement upsert for VIEW dedupe, indexes on `guest_messages` and `analytics_events` (B-017). No column is dropped or rewritten; old code keeps working against the new schema.
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
Round 2 (reversed order) stayed within 2–24 % of round 1. Product page with the loader in `cache()` (two rounds): server CPU per page 25–31 ms (unchanged), Postgres CPU per page ≈ 2.0–2.2 ms (≈ −1/3). Write consistency held on every arm; the view-dedupe race and the allowance overwrite reproduced on every arm (stack-independent defects). A minimal Rust page is not the product page; the product page needs the React template system wherever it runs.

## 5. Deployment and operations
Vercel functions in `sin1` with the database in the same region (ADR-O06); a connection pooler in front of Postgres before raising concurrency; telemetry for `/i/*`, RSVP and wishes before any further performance claim; no guest personal data in logs. Detail and runbook seeds: `../08-backend-rust-plan/README.md` §4–§6.

## 6. Rollback strategy
Code changes revert with the deploy; schema changes are additive and stay in place when code is reverted; caching and new guest-link tokens sit behind flags; the template system v2 keeps today's renderer as the fallback for templates without section components. No component of this plan requires a one-way migration.

## 7. Open dependencies (not invented here)
Hosting and database regions and plans, real Clerk keys (production middleware behaviour, P-INV-010), traffic history or analytics access, PJP contract, legal review of retention and gift money.
