<!-- SUMMARY (first 7 lines — greppable) -->
# kartu.md — design brief (as built): Kartu, an asymmetric stack of printed cards
> WHAT: As-built brief for the Kartu family (B-030 slice 1, code s14), written in s15 from `components/invitation/families/kartu.tsx` and the s15 rendered review.
> STATUS: reviewed (s15). Verdict in §Review.
> OWNER: template-system workstream
> DEPS: README.md, ../../components/invitation/families/kartu.tsx, ../../lib/invitation/families.ts, ../../invitation-research/_handoff/family-review-20261104-s15.md
> GREP: Kartu, card, ticket, stationery, perforation, asymmetric, wedding
> UPDATED: 2026-11-04

## Identity
`kartu` · Kartu · status **reviewed** (s15).

## Use case
Weddings with a modern-stationery tone; works for any event with one or more dated sessions.

## Problem
As Gapura: palette-only templates (style-observations §7). Kartu tests the opposite composition: left-aligned, asymmetric, paper objects instead of a frame.

## Principles (sources)
1. **Printed matter as the metaphor.** Invitations in Indonesia are still printed cards; a page built from card, stamp and ticket shapes reads as an invitation without imagery (style-observations §8, "Modern Indonesian stationery").
2. **Facts as objects.** Each event is a ticket whose date stub is torn along a perforation, so the date is found by shape, not by reading.
3. **Stillness.** Motion level 0: paper does not animate.

## Recipe
- **Cover:** a card on an offset backing card (`soft`, shifted 12 px); headline left, dashed date stamp right; names serif 5xl, left, tight leading; date · venue in muted; guest greeting under a dashed rule.
- **Sections:** left-aligned, max-w-xl, a muted small-caps label above a serif title. Events as tickets (80 px date stub on `soft` with a dashed perforation, body on `card`); story items as cards with a date tab on the top edge; first gallery image wide (4 : 3), then squares; gift accounts on dashed cards; the RSVP card has an accent top edge.
- **Type:** serif for names and titles, sans for facts and forms.
- **Palette:** tokens only; the photo, if any, is a framed block above the names, never behind text.
- **Motion:** level 0.

## Controlled variation
Palette, cover photo, sections on / off, name length, event count. Fixed: left alignment, card / ticket shapes, no motion.

## Assets
None (CSS ornament only).

## Validation
As Gapura; no text-over-photo case by construction.

## Review
See `../../invitation-research/_handoff/family-review-20261104-s15.md` § Kartu.

## Open
See the review record.
