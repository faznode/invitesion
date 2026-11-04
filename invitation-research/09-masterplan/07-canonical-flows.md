<!-- SUMMARY (first 7 lines — greppable) -->
# 07-canonical-flows.md — proposed creator, guest, host day-of, reseller and post-event journeys
> WHAT: Our target journeys with step counts and targets, derived from current flows (`../01-codebase-audit/flows.md`) and the comparative flow library (`../03-teardowns/_flows/`). Every target here is **PROPOSED**: a design target, not a measured baseline.
> STATUS: Verified s10 (2026-11-04; v1 s08). Linked to the s10 flow library, which holds the competitor steps with their evidence level (OBSERVED / CLAIMED / UNKNOWN); the "today" column now describes `7a00a6d` with the s09 P0 changes marked. Host day-of, reseller and post-event comparisons rest mostly on CLAIMED evidence because those steps sit behind signups.
> OWNER: Research agent
> DEPS: ../01-codebase-audit/flows.md, ../03-teardowns/_flows/, ../03-teardowns/*/dossier.md §2, 06-backlog.md, ../07-ideation/top-10.md
> GREP: flow, journey, creator, guest, host, reseller, post-event, steps, observed, claimed, proposed
> UPDATED: 2026-11-04

Step = one screen or one deliberate action. Vocabulary as in `../03-teardowns/_flows/README.md`: OBSERVED (seen on a public page or capture), CLAIMED (vendor's own description), PROPOSED (our target), UNKNOWN. Competitor step counts are CLAIMED unless a capture ID is given (ENV 4 steps to a shareable link, PLO 5 steps "under 5 minutes", IDI "5 menit").

## 1. Creator: from catalog to shared link (comparison: `../03-teardowns/_flows/creator.md`)
| # | Today at `7a00a6d` (`flows.md` + s09 changes) | Target (PROPOSED) | Backlog |
|---|---|---|---|
| 1 | Browse catalog (filters) | same | — |
| 2 | Sign up / log in | **Type names + date on a template → instant preview** (no account yet) | B-037 |
| 3 | Create from template (preset kept since s09; baseline lost it, QA-001) | Save → account creation (Clerk) with the draft kept | B-001 (done), B-037 |
| 4–6 | Form editor, manual save, preview via the owner route `/preview/[id]` (baseline: 404, QA-011) | Editor with live preview + autosave; theme switch free within tier (after the entitlement check B-041) | B-005 (done), B-035, B-036, B-041 |
| 7 | Pay (QRIS manual confirmation / Stripe) at the prices in `lib/pricing.ts` | Pay at publish (published prices); automated confirmation once a PJP exists | B-002 (done), B-039 |
| 8 | Publish; the link preview shows names and date (s09) | Publish → share screen with per-guest WhatsApp links and an OG preview | B-010 (done), B-018 |
**Target:** ≤ 6 steps to a shareable link for a basic template (ENV claims 4, PLO 5; both CLAIMED).

## 2. Guest: open → respond (comparison: `../03-teardowns/_flows/guest.md`, OBSERVED on measured demos)
1. Tap the WhatsApp link (OG card shows names and date, B-010, shipped s09) → 2. cover with the guest's name and a labelled "Buka Undangan" button (B-009) → 3. music starts on the tap, pause control visible (B-009) → 4. scroll: couple and parents (B-023), events in the correct zone with add-to-calendar and countdown (B-004, B-008, shipped s09), gallery (B-025), gifts with copy buttons (B-026) → 5. RSVP with party size kept (B-007, shipped s09) → 6. wish.
**Targets:** first-load weight within the tier budget (B-012); RSVP in ≤ 2 actions after the cover; works without JavaScript for RSVP and wishes (server actions already do); elder mode and low-data mode as later options (ideas I-05, I-28).

## 3. Host before the event
Import guests (B-033) → groups → send personal links (wa.me with an editable message, B-018) → follow up the unopened / unanswered lists (idea I-06, B-034) → watch totals by group and event (B-034).
**Target:** every guest reachable in one tap; no unofficial WhatsApp gateway.

## 4. Host on the day (comparison: `../03-teardowns/_flows/host-day-of.md`, CLAIMED only)
Ushers open the scanner on a phone (B-024; co-host / usher roles G-044) → scan the guest's QR pass or search the name (manual fallback, already present) → greeting screen shows the name (B-024) → attendance count updates.
**Target:** ≤ 3 s per guest at the desk; works with a weak signal (idea I-27 as a later option).

## 5. Reseller (later, G-052; comparison: `../03-teardowns/_flows/reseller.md`, CLAIMED)
Buy credits → create invitations for clients or give clients edit access → own branding → resale floor. Depends on the tenant model and automated payments.

## 6. After the event (comparison: `../03-teardowns/_flows/post-event.md`, CLAIMED)
Read-only page stays up for the active period (present) → thank-you message and guest photos (idea I-21) → wishes book export (idea I-22) → deletion on request or at expiry (B-031).
