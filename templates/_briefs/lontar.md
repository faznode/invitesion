<!-- SUMMARY (first 7 lines — greppable) -->
# lontar.md — design brief: Lontar, a programme-led family for formal and corporate events
> WHAT: New brief (s15) written to show the brief → prototype → review loop repeats beyond the first three families. Not built yet.
> STATUS: brief (2026-11-04). Depends on B-029 (render agenda, speakers, dress code, contact for every layout through shared blocks).
> OWNER: template-system workstream
> DEPS: README.md, ../../invitation-research/01-codebase-audit/niche-coverage.md, ../../invitation-research/09-masterplan/06-backlog.md (B-029, B-030), ../../lib/invitation/content-contract.ts
> GREP: Lontar, corporate, seminar, agenda, programme, speakers, dress code, B-029
> UPDATED: 2026-11-04

## Identity
`lontar` · Lontar · status **brief**.

## Use case
Seminars, conferences, company anniversaries, launches, inaugurations, gala and award nights, RUPS, trainings; also formal family events whose invitation is mainly a programme. Guests open it twice: once to decide, once on the day to find the session, the room and the dress code.

## Problem
- 16 registry templates use the corporate form, but corporate configs capture organisation, agenda, speakers, dress code and contact that no layout renders (`niche-coverage.md` rows "corporate…", §"Render what is already captured"; G-033 / B-029; `content-contract.ts` lists `agenda`, `speakers`, `dressCode`, `contact*` as `storedOnly`).
- The three current families compose around a couple or a celebrant (Gapura, Kartu) or play (Riang). None leads with a schedule.

## Principles (sources)
1. **Show what the host already typed.** The cheapest parity gain is rendering captured fields (`niche-coverage.md` §5 item 2, G-033).
2. **The programme is the hero.** On the day, the time and title of the next item matter more than ornament. Our own families put event facts below the cover, so a programme-first order is a genuinely different composition, not a re-skin (to be judged on renders).
3. **Legible at 360 px under stress.** Organisation names, session titles and speaker roles are long; up to 50 agenda rows are allowed by the schema. Rows must wrap, never truncate meaning or overflow (stress fixtures, `page-review.ts`).
4. **Local material as structure, not decoration.** The palm-leaf manuscript's long horizontal leaf, punched holes and binding cord give a band-and-cord grid drawn in CSS. No imitation of script, and no text from manuscripts or scripture (the verified corpus is empty, B-003).
5. **Calm.** Motion level 0; formal events read as trustworthy when nothing moves.

No competitor's page is a source for this brief. RSVPify, the owner's preferred reference for a modern, elegant frontend, has no rendered observation in the evidence (S-RSV-002: non-browser clients answered 403; no guest page identified), so no RSVPify specific is claimed.

## Recipe
- **Cover:** organisation name in muted small caps; event name in the display serif at the largest size that fits two lines at 360 px; one "leaf" band (soft surface, full width, two punched holes and a cord line in CSS, `aria-hidden`) carrying date, time with zone label and venue. Logo only when `logoUrl` is set, in a fixed-ratio frame with the organisation name as alt text.
- **Programme:** time | title + speaker rows; at ≥ 640 px a two-column grid, at 360 px time above title. Accent only for the time labels (accent on soft and on bg are verified token pairs); speakers muted.
- **Then:** speakers (name, role, organisation), practical information (dress code, contact as `tel:` / `mailto:` links, map link from the event), RSVP and guestbook through the shared blocks, footer.
- **Type:** the two self-hosted fonts; serif for event name and section titles, sans for everything a guest scans.
- **Palette:** tokens only (B-016); bands on `soft`, cards on `card`; no translucent surfaces.
- **Imagery:** none required. A cover photo, if set, is framed beside the leaf band and never under text.
- **Motion:** level 0.

## Controlled variation
Hosts vary palette, logo (present or absent), agenda length (0–50), speakers (0–50), one or several events, and which sections are on. Fixed: programme-first order, the leaf band, no motion, left alignment.

## Assets
None (CSS ornament only).

## Validation
B-029 first: shared agenda / speakers / dress-code / contact blocks with contract and renderer tests (long, hostile, RTL, empty renders nothing). Then the family: registry entry, layout file, `pnpm test` (rendered tests iterate every family), `page-review.ts` at 360 / 390 / 412 / 1280 + reduced motion with a corporate stress fixture (long organisation, 30 agenda rows, missing logo, expired), `rendered-contrast.ts`, legacy output unchanged.

## Review
Not built; nothing reviewed. Technical PASS: n/a. Visual approval: n/a.

## Open
- Build B-029 shared blocks, then Lontar, then review with renders. If the renders do not read as clearly programme-led, revise the brief before polishing the code.
