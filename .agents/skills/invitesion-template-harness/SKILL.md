---
name: invitesion-template-harness
description: >-
  Invitesion's own workflow for guest-page design: design families (B-030), palette tokens (B-016), the template
  harness, rendered review and the emerging house taste. Use before creating, changing or reviewing a design family,
  a palette, the guest-page renderer (components/invitation/), a harness sample or a template manifest, and before
  writing any claim about how a guest page looks.
---

# invitesion-template-harness

Precedence: `AGENTS.md` > this skill > third-party skills. Third-party design skills (`design-taste-frontend`,
`frontend-design`, …) may inform craft; they never override the rules below.

## Hard rules
- **Invitesion has no established taste yet.** Gapura, Kartu and Riang are experiments. Keep, revise or retire a
  family on rendered evidence, never because it exists or because a brief says so.
- **No copying.** Extract principles, structure and measurements only. Never a competitor's layout, component
  combination, asset, font, audio, illustration, branding or wording.
- **Observed or not claimed.** Every visual statement names the render it comes from (file, viewport, fixture,
  date). RSVPify is the owner's preferred reference for a modern, elegant frontend, but the evidence holds no rendered
  observation of it (S-RSV-002: 403 to non-browser clients; no guest page identified). Do not describe its look.
- **Technical PASS ≠ visual approval.** Tests, overflow and contrast checks are gates; taste is a separate,
  written review. Never invent a score ("AI-slop score", "taste score") as proof of quality or originality.
- **Religious text** only from `content/verified-religious-texts/` (empty today → no quotation, no prayer text).
- **Fake data only** in fixtures and screenshots (UU PDP); stress guests come from the fixtures below.

## The loop
| Step | Do | Where |
|---|---|---|
| 1 Reference research | Read dossiers and captures for principles, not looks | `invitation-research/03-teardowns/`, `raw/` |
| 2 Principles | 3–5 transferable principles with evidence IDs | the brief |
| 3 Directions | One structured brief per direction (format in `templates/_briefs/README.md`) | `templates/_briefs/<id>.md` |
| 4 Prototype | Family layout on the shared guest view (contract below) | `components/invitation/families/<id>.tsx` |
| 5 Render | Real routes on the local stack with the review fixture; screenshots at 4 widths + reduced motion | commands below |
| 6 Critique | Look at the actual screenshots; write findings with IDs against the brief | `invitation-research/_handoff/family-review-*.md` |
| 7 Curate and refine | Fix, re-render, re-review; or revise the brief; or retire the family | code + brief |
| 8 Document taste | Only principles that survived step 6 on more than one family go into "Emerging taste" below | this file |

## Family contract (enforced by tests unless marked)
- Register the id in `FAMILY_IDS` / `FAMILIES` (`lib/invitation/families.ts`) and the layout in `FAMILY_LAYOUTS`
  (`components/invitation/public-renderer.tsx`). A missing or retired id renders the legacy layout byte-identically.
- Take every derived value from `buildGuestView()` (`guest-view.ts`): dates and times in the event zone, countdown and
  calendar rules, `canRespond`, `coverText()`. Never call `isFlagOn`, `calendarEventsFromConfig` or read
  `invitation.status` in a layout.
- Compose every guest-facing section of the legacy page through the shared blocks (`guest-blocks.tsx`: `EventFacts`,
  `MapLink`, `CalendarLinks`, `RsvpBlock`, `GuestbookBlock`, `ReadOnlyNotice`). Never build a guest form.
- Colour only through palette tokens (`tone.*`); opacity only on images; text never straight over a photo except
  names in ink, and small text over a photo goes through `coverText()` (bounded by `worstContrastOverImage()`).
- Host-typed names: `dir="auto"` or `<bdi>`, and `[overflow-wrap:anywhere]`.
- Declare `motionLevel`; level 1 uses `inv-rise` only (off under `prefers-reduced-motion`), never on the names.
- Two self-hosted fonts only (`font-serif`, `font-sans`). Touch targets ≥ 44 px (`min-h-11`). (review)

## Commands
```bash
pnpm typecheck && pnpm test                     # rendered tests iterate legacy + every family automatically
bash invitation-research/_tools/ops/bootstrap-sandbox.sh tools   # Chrome for Testing, Lighthouse (background)
bash invitation-research/_tools/ops/local-stack.sh up            # Postgres + snapshot build without middleware
bash invitation-research/_tools/ops/local-stack.sh start         # background; :3100
(cd /vercel/share/work/app && npx tsx invitation-research/_tools/setup/seed-family-review.ts \
   --cover-url http://127.0.0.1:3100/review/cover.png --palettes)   # copy a fictional cover into $APP/public/review/
source /vercel/share/work/tools/env.sh
npx tsx tools/template-harness/page-review.ts --out /tmp/review --url gapura=http://127.0.0.1:3100/i/review-gapura-full/nama-panjang
npx tsx tools/template-harness/page-review.ts --out /tmp/review-m --mobile-only --url …   # stress guests at 360 × 800
npx tsx tools/template-harness/rendered-contrast.ts --out /tmp/contrast --url legacy-ivory=…/i/review-legacy-p-ivory/budi-hartono
```
Fixture pages: `/i/review-<legacy|gapura|kartu|riang>-<full|photo|sparse|birthday|expired|dark>/<guest>`; guests
`budi-hartono`, `nama-panjang`, `hostile-name`, `rtl-name`, `emoji-name`; palette sweep `/i/review-<layout>-p-<paletteId>/budi-hartono`.
Never run screenshots, builds or tests while a capture batch runs (shared CPU skews its measurements).

## Review checklist (per family, per render)
1. 360 × 800, 390 × 844, 412 × 915, 1280 × 800, 390 × 844 reduced motion; overflow 0 px everywhere.
2. Stress: long names, RTL, emoji, hostile text; sparse content; no photo and a high-contrast photo; dark palette;
   expired (read-only notices, no forms); non-wedding event; token guest link.
3. Hierarchy (what reads first, second, third), spacing rhythm between sections, type scale at 360 px, alignment.
4. Imagery and ornament: does ornament support the composition or only fill space? Remove what is only decoration.
5. Emotional tone and cultural fit for the event type; Indonesian copy reads naturally.
6. Forms: labels, hints, error and saved notices, keyboard order and visible focus, 44 px targets.
7. Contrast in context: rendered sweep per palette; text over photos; interaction states (not automated).
8. Verdict: technical PASS / FAIL (gates) and visual verdict (keep / revise / retire) on separate lines.

## Current families and review state
See `templates/_briefs/` (one brief each) and the latest `invitation-research/_handoff/family-review-*.md`.

## Emerging taste
Nothing is listed here until a principle has survived a written review on more than one family. Candidates and their
evidence live in the review records.
