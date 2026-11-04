# Rendered contrast sweep, session 16 (B-016)

Rendered half of B-016's acceptance ("passes on a rendered sample of every palette"), complementing the token arithmetic in `tests/palette-contrast.test.ts` and the photo bound `worstContrastOverImage` (`lib/invitation/contrast.ts`). Neither half alone proves every interaction state accessible.

## 1. Method (both runs)
- **Tool:** `tools/template-harness/rendered-contrast.ts` with the s16 verdict rules of `contrast-gate.ts` (E-019): PASS only on positive evidence (requested page measured, score 1, no failing node, artifacts collected, no `color-contrast` needs-review node); FAIL on any failing node; anything else INCOMPLETE, which never completes the gate.
- **Browser:** Lighthouse 12.8.2, Chrome for Testing 156.0.8078.4 (headless), `--only-audits=color-contrast` plus artifacts, mobile emulation (Lighthouse default), provided throttling, `--force-prefers-reduced-motion` so entrance animations cannot leave text mid-fade. One sequential run per page; system fonts only (the review-only fonts of the visual review are **not** used here).
- **Server:** production snapshot (`local-stack.sh`, `next start` on 127.0.0.1:3100, middleware set aside per D-012) and the s16 review fixture (`invitation-research/_tools/setup/seed-family-review.ts --cover-url … --palettes`, 121 fictional invitations).
- **Pages:** palette pages `/i/review-<layout>-p-<palette>/budi-hartono` for 18 palettes (blossom, confetti, dusk, emerald, gold-noir, ivory, lavender, midnight, mint, mocha, ocean, orchid, rose-gold, sage, sand, slate, sunshine, terracotta) × 5 layouts (legacy, gapura, kartu, riang, lontar) = 90; state pages = 31 (legacy full, photo, corporate; per family full, photo, corporate, birthday, sparse, expired, dark), each opened through a stress guest (`nama-panjang`, `emoji-name`, `rtl-name`, `hostile-name` or `budi-hartono`).
- **Not covered by either run:** hover and focus states; desktop preset; text over a photo (axe cannot measure it; such nodes end INCOMPLETE and are bounded by the token-side photo test instead); real devices.

## 2. Run 1: checkpoint layouts (18:09:47Z → 18:41:14Z)
- **Product code:** `e983700` (s16 had changed tools and records only).
- **Palette pages: PASS, 90 / 90** (fail 0, incomplete 0; report `/tmp/contrast-s16-palettes/contrast.json`, scratch).
- **State pages: not run.** The background shell that chained the palette and state invocations was cut off at the tool's 10-minute limit; its palette child finished alone and the state invocation never started (no report, no log). No state result is claimed for this build.
- **Measurement gap found while reading the results:** on these layouts the RSVP guest name was a `disabled` input, and axe excludes disabled controls from `color-contrast`, so that text was never measured. B-027 (E-020) turns it into text, which run 2 measures.

## 3. Run 2: final layouts (B-027 build, started 18:43:40Z)
- **Product code:** `64701bb` + B-027 slice 1 (E-020), snapshot rebuilt 18:42:36Z.
- **Pages:** the same 90 palette and 31 state pages, in one invocation (report `/tmp/contrast-s16b`, scratch).
- **Result:** pending at the time of the B-027 commit; appended below when the run has ended and its stored results are counted. Nothing is claimed before that.
