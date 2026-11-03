<!-- SUMMARY (first 7 lines — greppable) -->
# 04-current-state.md — Invitesion today: strengths, defects, debt, security, performance, architecture, constraints
> WHAT: The product as it is at `64678cf` (branch `v0/faznode-3b993736`; product code identical to `2c94140`), from the code audit, our own captures and the s09 backend spike.
> STATUS: FINAL v2 (s09, 2026-11-03; v1 s08). Implementation progress after this date: `../_handoff/IMPLEMENTATION-LOG.md`.
> OWNER: Research agent
> DEPS: ../01-codebase-audit/*, ../05-feature-matrix/assessments/invitesion.csv, ../06-gap-analysis/where-we-lead.md, C-INV-001…005
> GREP: current state, strengths, defects, debt, security, performance, architecture, constraints
> UPDATED: 2026-11-03

## 1. Architecture (summary of `../01-codebase-audit/architecture.md` and `module-map.md`)
Next.js App Router (canary) + React 19, TypeScript, Tailwind, shadcn primitives; Clerk for identity with roles in our own `users` table (M-030); Postgres via Drizzle (18 tables, pool max 10, M-035); storage local or S3-compatible with an in-house SigV4 signer (M-028); payments: QRIS EMVCo payload + Stripe adapters behind a rail interface with idempotent webhooks (M-025, M-026). Guest pages are `force-dynamic` server renders at `/i/[slug]/[guestSlug]` (M-012) through one deterministic renderer for all 64 templates (M-013).

## 2. Strengths to keep
- **Guest-page quality (lab):** Perf 94, LCP 2.53 s, TBT 184 ms, 311 KiB, accessibility 96, 0 third-party entities (C-INV-001/002/005; limits in `../06-gap-analysis/where-we-lead.md`).
- **Security basics:** React-escaped guest data (hostile names inert, H-INV-003), ownership checks on every query, upload allow-list without SVG, sandboxed `/media`, no secrets in the tree.
- **Payment engineering:** integer minor units, official QRIS test vectors, idempotent settlement.
- **Product policies:** unlimited editing after publish, 12 months active, free drafting, noindex guest pages, fictional template previews, ~90 SEO pages, filterable catalog with 27 categories, IDR + USD prices.

## 3. Defects (live at `64678cf` unless noted)
| ID | Defect | Status |
|---|---|---|
| QA-001 | catalog invitations lose their preset | re-verified s08 (ADR-O01) → B-001 |
| QA-002 | times in server zone with a hard-coded WIB | from code (renderer unchanged since `22ed99e`) → B-004 |
| QA-003 | guessable guest slugs as the only credential; unknown guests answer 200 | 200 re-verified s09 (`/i/budi-sari/tamu-999`) → B-011 |
| QA-005 | RSVP overwrites the allowance | re-verified s08 and s09 (300 / 300 allowances 2 → 1 in every spike arm) → B-007 |
| s09 spike | VIEW dedupe is read-then-insert: concurrent first views write duplicate rows and inflate `opened_count` (8 of 300 guests on the product page in round 1) | → B-017a |
| QA-006 | loader runs twice per guest-page request (`generateMetadata` + page, no `cache()`) | measured s09 (two rounds with `cache()`): costs ≈ 1/3 of Postgres CPU per page, no measurable server CPU; the ≈ 27–30 ms vs ≈ 4 ms server gap is the full render → B-014 |
| QA-011 | editor preview 404; theme tab unreachable | → B-005 |
| QA-012 | CSV formula injection | → B-006 |
| ADR-O02 | "Rp0 / GRATIS" marketing vs Rp 149k / 299k checkout | → B-002 |
| QA-015 | Qur'an translations of unknown provenance in presets | → B-003 |
| QA-026 (s09) | config PATCH accepts any `theme.templateId` / `paletteId` without an entitlement check (Standard invitation can take a Premium look) | found while doing B-005 → B-041 (P1) |
| QA-008 / 009 / 013 / 016 / 022 / 023 / 024 | contrast, no OG image, wa.me normalisation, no image pipeline, accounts visible without a guest link, undisclosed tracking, over-claiming pages | P1 / P2 (06-backlog.md) |

## 4. Debt
One renderer for all templates (F-036); config-only modules without guest UI (RSVP questions, meals, seating, ticketing, dress code, agenda: F-016…F-018, F-025, F-039…F-043); two `slugify` implementations; `any`-typed editor state; tokens named for an old brand; Next.js canary; build requires `POSTGRES_URL` (QA-020, QA-025).

## 5. Security and privacy posture
Good basics (above). Gaps: guest credential (QA-003), no rate limiting (QA-004), CSP report-only (F-094), gift accounts visible without a guest link (QA-022), per-guest tracking without notice (QA-023), no retention / deletion (F-099), residual exposure in history (ADR-O07, `../00-setup/privacy-hygiene.md` §4).

## 6. Performance posture
Lab lead today, at risk from: clerk-js on guest pages (+70.7 KB brotli, QA-007), uncacheable responses + locale cookie + double loader (QA-006), originals up to 5 MB once galleries fill (QA-016). **Server side (s09 spike, lab, no middleware):** the product page sustains ≈ 36–39 req/s per saturated core at 40 VUs (p95 ≈ 1.2–1.3 s), ≈ 27–30 ms server CPU and ≈ 141.7 KB uncompressed HTML per view; the same server with one loader call and minimal HTML ≈ 4 ms; one loader call with the full render ≈ 25–31 ms (the render is the cost). Verdict and plan: `09-backend-and-frontend-architecture.md`, ADR-A1, `../08-backend-rust-plan/README.md` §3.3–§3.4.

## 7. Constraints
No production access, analytics or real Clerk keys (P-INV-010: production middleware hangs with placeholder keys, so local measurements omit `middleware.ts`); no PJP contract (ADR-O03); no approved religious corpus (ADR-O04); no device lab for in-app browsers; owner pushes manually (brief 05).
