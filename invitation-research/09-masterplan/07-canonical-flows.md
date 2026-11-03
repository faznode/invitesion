<!-- SUMMARY (first 7 lines — greppable) -->
# 07-canonical-flows.md — proposed creator, guest, host day-of, reseller and post-event journeys
> WHAT: Our target journeys with step counts and targets, derived from current flows (`../01-codebase-audit/flows.md`) and competitor flows (dossier §2). Targets are design targets, not measured baselines.
> STATUS: FINAL v1 (s08, 2026-11-03)
> OWNER: Research agent
> DEPS: ../01-codebase-audit/flows.md, ../03-teardowns/*/dossier.md §2, 06-backlog.md, ../07-ideation/top-10.md
> GREP: flow, journey, creator, guest, host, reseller, post-event, steps
> UPDATED: 2026-11-03

Step = one screen or one deliberate action. Competitor step counts are vendor claims unless measured (ENV 4 steps to a shareable link, PLO 5 steps "under 5 minutes", IDI "5 menit").

## 1. Creator: from catalog to shared link
| # | Today (`flows.md`) | Target | Backlog |
|---|---|---|---|
| 1 | Browse catalog (filters) | same | — |
| 2 | Sign up / log in | **Type names + date on a template → instant preview** (no account yet) | B-037 |
| 3 | Create from template (preset lost, QA-001) | Save → account creation (Clerk) with the draft kept | B-001, B-037 |
| 4–6 | Form editor, manual save, preview 404 | Editor with live preview + autosave; theme switch free within tier | B-005, B-035, B-036 |
| 7 | Pay (QRIS manual confirmation / Stripe) | Pay at publish (published prices); automated confirmation once a PJP exists | B-002, B-039 |
| 8 | Publish | Publish → share screen with per-guest WhatsApp links and an OG preview | B-010, B-018 |
**Target:** ≤ 6 steps to a shareable link for a basic template (ENV claims 4, PLO 5).

## 2. Guest: open → respond
1. Tap the WhatsApp link (OG card shows names and date, B-010) → 2. cover with the guest's name and a labelled "Buka Undangan" button (B-009) → 3. music starts on the tap, pause control visible (B-009) → 4. scroll: couple and parents (B-023), events in the correct zone with add-to-calendar and countdown (B-004, B-008), gallery (B-025), gifts with copy buttons (B-026) → 5. RSVP with party size kept (B-007) → 6. wish.
**Targets:** first-load weight within the tier budget (B-012); RSVP in ≤ 2 actions after the cover; works without JavaScript for RSVP and wishes (server actions already do); elder mode and low-data mode as later options (ideas I-05, I-28).

## 3. Host before the event
Import guests (B-033) → groups → send personal links (wa.me with an editable message, B-018) → follow up the unopened / unanswered lists (idea I-06, B-034) → watch totals by group and event (B-034).
**Target:** every guest reachable in one tap; no unofficial WhatsApp gateway.

## 4. Host on the day
Ushers open the scanner on a phone (B-024; co-host / usher roles G-044) → scan the guest's QR pass or search the name (manual fallback, already present) → greeting screen shows the name (B-024) → attendance count updates.
**Target:** ≤ 3 s per guest at the desk; works with a weak signal (idea I-27 as a later option).

## 5. Reseller (later, G-052)
Buy credits → create invitations for clients or give clients edit access → own branding → resale floor. Depends on the tenant model and automated payments.

## 6. After the event
Read-only page stays up for the active period (present) → thank-you message and guest photos (idea I-21) → wishes book export (idea I-22) → deletion on request or at expiry (B-031).
