<!-- SUMMARY (first 7 lines — greppable) -->
# 04-current-state.md — Invitesion today: strengths, defects, debt, security, performance, architecture, constraints
> WHAT: The product at `7a00a6d` (branch `v0/faznode-3b993736`): the Phase-1 audit baseline (product code of `22ed99e` = `64678cf`) plus the P0 changes shipped in s09, from the code audit, our own captures, the s09 backend spike and the s10 revalidation.
> STATUS: Verified s10 (2026-11-04; v2 s09, v1 s08). Baseline and shipped P0 are kept apart in every section (`../01-codebase-audit/revalidation-s10.md`). **Every own lab number below is pre-P0** (C-INV-001…005 on `22ed99e`) until the current page is re-measured (RQ-OWN-02 in `../_handoff/acceptance-matrix.md`). Implementation progress: `../_handoff/IMPLEMENTATION-LOG.md`.
> OWNER: Research agent
> DEPS: ../01-codebase-audit/*, ../01-codebase-audit/revalidation-s10.md, ../_handoff/IMPLEMENTATION-LOG.md, ../05-feature-matrix/assessments/invitesion.csv, ../06-gap-analysis/where-we-lead.md, C-INV-001…005
> GREP: current state, strengths, defects, debt, security, performance, architecture, constraints, p0, baseline
> UPDATED: 2026-11-04

## 1. Architecture (summary of `../01-codebase-audit/architecture.md` and `module-map.md`)
Next.js App Router (canary) + React 19, TypeScript, Tailwind, shadcn primitives; Clerk for identity with roles in our own `users` table (M-030); Postgres via Drizzle (18 tables, pool max 10, M-035); storage local or S3-compatible with an in-house SigV4 signer (M-028); payments: QRIS EMVCo payload + Stripe adapters behind a rail interface with idempotent webhooks (M-025, M-026). Guest pages are `force-dynamic` server renders at `/i/[slug]/[guestSlug]` (M-012) through one deterministic renderer for all 64 templates (M-013).

**Shipped by P0 (s09, inside existing modules; `../01-codebase-audit/revalidation-s10.md` §2):** vendor-free feature flags (`lib/flags.ts`); PPR `incremental` in `next.config.ts` with the `/i/[slug]/**` pages opted out (`experimental_ppr = false`); side routes `app/i/[slug]/calendar.ics/route.ts` and `app/i/[slug]/og.png/route.tsx`; owner preview route `/preview/[id]`; additive migrations 0009 (`guests.attending_count`) and 0010 (`guests.link_token`). Next.js is `15.6.0-canary.59`; `middleware.ts` is unchanged since the baseline.

## 2. Strengths to keep
- **Guest-page quality (lab, pre-P0 build `22ed99e`):** Perf 94, LCP 2.53 s, TBT 184 ms, 311 KiB, accessibility 96, 0 third-party entities (C-INV-001/002/005; limits in `../06-gap-analysis/where-we-lead.md`). Not re-measured after P0, which added a countdown client island and the calendar / link-preview side routes (RQ-OWN-02).
- **Shipped in s09 (P0, `../_handoff/IMPLEMENTATION-LOG.md` E-001…E-011):** catalog art preserved, marketing prices from `lib/pricing.ts`, event times in the event's own zone, a working editor preview, CSV formula neutralisation, RSVP that keeps the host's allowance, countdown + add-to-calendar, a per-invitation link-preview image, a real 404 for unknown guests, and opaque guest links behind a default-off flag. Tests: 49 at the baseline → 92 at `7a00a6d` (94 with the two s10 harness-report tests).
- **Security basics:** React-escaped guest data (hostile names inert, H-INV-003), ownership checks on every query, upload allow-list without SVG, sandboxed `/media`, no secrets in the tree.
- **Payment engineering:** integer minor units, official QRIS test vectors, idempotent settlement.
- **Product policies:** unlimited editing after publish, 12 months active, free drafting, noindex guest pages, fictional template previews, ~90 SEO pages, filterable catalog with 27 categories, IDR + USD prices.

## 3. Defects (found at the baseline `64678cf`; state at `7a00a6d` from `../01-codebase-audit/revalidation-s10.md` §4)
| ID | Defect | Baseline evidence | State at `7a00a6d` |
|---|---|---|---|
| QA-001 | catalog invitations lose their preset | re-verified s08 (ADR-O01) | **fixed** s09 (B-001, E-001) |
| QA-002 | times in server zone with a hard-coded WIB | from code (renderer unchanged since `22ed99e`) | **fixed** s09: WIB / WITA / WIT from the event zone (B-004, E-004) |
| QA-003 | guessable guest slugs as the only credential; unknown guests answer 200 | 200 re-verified s09 (`/i/budi-sari/tamu-999`) | **mitigated** s09 (B-011, E-011): unknown guests get a real 404; opaque tokens exist behind `FLAG_OPAQUE_GUEST_LINKS`, default **off** (owner decision), so guessable slugs stay the default credential |
| QA-005 | RSVP overwrites the allowance | re-verified s08 and s09 (300 / 300 allowances 2 → 1 in every spike arm) | **fixed** s09 (B-007, E-007, migration 0009) |
| s09 spike | VIEW dedupe is read-then-insert: concurrent first views write duplicate rows and inflate `opened_count` (8 of 300 guests on the product page in round 1) | spike result set `s09-20261103-r1` | open → B-017a |
| QA-006 | loader runs twice per guest-page request (`generateMetadata` + page, no `cache()`) | measured s09 (two rounds with `cache()`): costs ≈ 1/3 of Postgres CPU per page, no measurable server CPU; the ≈ 27–30 ms vs ≈ 4 ms server gap is the full render | open → B-014 |
| QA-011 | editor preview 404; theme tab unreachable | code (editor `Pratinjau` link, strict-schema gate) | **fixed** s09: owner route `/preview/[id]` (B-005, E-005) |
| QA-012 | CSV formula injection | code (guest CSV export) | **fixed** s09 (B-006, E-006) |
| ADR-O02 | "Rp0 / GRATIS" marketing vs Rp 149k / 299k checkout | marketing copy vs `lib/pricing.ts` (Q-O02) | **fixed** s09: prices from `lib/pricing.ts` (B-002, E-002) |
| QA-015 | Qur'an translations of unknown provenance in presets | code (template presets) | **fixed** s09: removed, verified corpus empty (B-003, E-003) |
| QA-009 | no per-invitation link-preview image | C-INV-001 (`og:image` absent) + curl | **fixed** s09 for Latin-script names (B-010, E-010) |
| QA-026 (s09) | config PATCH accepts any `theme.templateId` / `paletteId` without an entitlement check (Standard invitation can take a Premium look) | found while doing B-005 | open → B-041 (P1) |
| QA-008 / 013 / 016 / 022 / 023 / 024 | contrast, wa.me normalisation, no image pipeline, accounts visible without a guest link, undisclosed tracking, over-claiming pages | `../01-codebase-audit/quality-audit.md` | open, P1 / P2 (`06-backlog.md`) |

## 4. Debt
One renderer for all templates (F-036); config-only modules without guest UI (RSVP questions, meals, seating, ticketing, dress code, agenda: F-016…F-018, F-025, F-039…F-043); three `slugify` definitions (`lib/invitation/slug.ts` plus local copies in two guest `actions.ts` files); `any`-typed editor state; a deprecated `orange-*` colour alias that renders rose (`app/globals.css`; the old "Vienne" token file is archived and was never imported); Next.js canary; build requires `POSTGRES_URL` (QA-020, QA-025).

## 5. Security and privacy posture
Good basics (above). Gaps: guest credential (QA-003: mitigated by the real 404, opaque links default off), no rate limiting (QA-004), CSP report-only (F-094), gift accounts visible without a guest link (QA-022), per-guest tracking without notice (QA-023), no retention / deletion (F-099), residual exposure in history (ADR-O07, `../00-setup/privacy-hygiene.md` §4).

## 6. Performance posture
Lab lead on the pre-P0 build (the current build `0b5eb1b` was measured in s13 on a slower, variable host, so those figures are a separate population and not comparable: RQ-OWN-02, D-033), at risk from: clerk-js on guest pages (+70.7 KB brotli, QA-007), uncacheable responses + locale cookie + double loader (QA-006), originals up to 5 MB once galleries fill (QA-016). **Server side (s09 spike, lab, no middleware):** the product page sustains ≈ 36–39 req/s per saturated core at 40 VUs (p95 ≈ 1.2–1.3 s), ≈ 27–30 ms server CPU and ≈ 141.7 KB uncompressed HTML per view; the same server with one loader call and minimal HTML ≈ 4 ms; one loader call with the full render ≈ 25–31 ms (the render is the cost). Verdict and plan: `09-backend-and-frontend-architecture.md`, ADR-A1, `../08-backend-rust-plan/README.md` §3.3–§3.4.

## 7. Constraints
No production access, analytics or real Clerk keys (P-INV-010: production middleware hangs with placeholder keys, so local measurements omit `middleware.ts`); no PJP contract (ADR-O03); no approved religious corpus (ADR-O04); no device lab for in-app browsers; owner pushes manually (brief 05).
