<!-- SUMMARY (first 7 lines — greppable) -->
# gapura.md — design brief (as built): Gapura, symmetric and ceremonial
> WHAT: As-built brief for the Gapura family (B-030 slice 1, code s14), written in s15 from `components/invitation/families/gapura.tsx` and the s15 rendered review.
> STATUS: reviewed (s15). Verdict in §Review.
> OWNER: template-system workstream
> DEPS: README.md, ../../components/invitation/families/gapura.tsx, ../../lib/invitation/families.ts, ../../invitation-research/_handoff/family-review-20261104-s15.md
> GREP: Gapura, gate, arch, ceremonial, wedding, symmetric
> UPDATED: 2026-11-04

## Identity
`gapura` · Gapura · status **reviewed** (s15).

## Use case
Weddings with a ceremonial tone (akad, pemberkatan, resepsi). Renders every event type.

## Problem
Every invitation used one centred layout; choosing a template changed the palette only, so templates looked alike to guests (`01-codebase-audit/style-observations.md` §7, "Palette-only templates").

## Principles (sources)
1. **Frame, then name.** A threshold shape around the couple's names gives the cover a sense of entering, using only CSS (style-observations §8: ornament as code, authored in-repo).
2. **Repeat one motif.** The same arch carries events, gifts and forms, so sections belong together without extra ornament (to be judged on renders).
3. **Names paint first.** No entrance animation on the names; ornaments and date rise in once (manifest motion level 1, `inv-rise`).

## Recipe
- **Cover:** ≥ 90 vh, centred. Double gate arch (outer line border, inner accent border, both `rounded-t-full`); optional cover photo inside the inner arch at 20 % opacity; diamond, headline, names (serif 4xl / 5xl, ampersand between two short rules), date. Guest greeting below the arch on `soft`.
- **Sections:** centred, max-w-lg; each opens with a diamond and a serif title in accent. Events, gifts and forms sit in arch-topped cards (`rounded-t-[3rem]`); the story is a centred vertical sequence; gallery images are arch-topped (3 : 4).
- **Type:** serif for names and titles, sans for facts and forms.
- **Palette:** tokens only; accent for titles, ornaments and small labels; cover text over a photo through `coverText()`.
- **Motion:** level 1 (`inv-rise` on diamond, headline, date, guest block), off under reduced motion.

## Controlled variation
Palette, cover photo, which sections are on, name length, event count. Fixed: symmetry, the arch motif, centred alignment.

## Assets
None (CSS ornament only).

## Validation
`pnpm test` (rendered tests over every family), `page-review.ts` (360 / 390 / 412 / 1280 + reduced motion), stress guests, `rendered-contrast.ts`, text-over-photo bound in `tests/palette-contrast.test.ts`.

## Review
See `../../invitation-research/_handoff/family-review-20261104-s15.md` § Gapura.

## Open
See the review record.
