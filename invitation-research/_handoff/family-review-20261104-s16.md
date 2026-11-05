<!-- SUMMARY (first 7 lines — greppable) -->
# family-review-20261104-s16.md — rendered review of the guest-page layouts (legacy, Gapura, Kartu, Riang, Lontar)
> WHAT: The written visual review of the four design families and the legacy fallback at checkpoint `e983700`, from renders produced and inspected in session 16: method, measurement environment, technical gates, findings with the render each comes from, separate technical and visual verdicts, asset provenance and taste candidates.
> STATUS: done (s16, 2026-11-04). Technical: 0 px overflow in 175 / 175 shots. Visual: Gapura keep (revise photo treatment and rhythm), Kartu keep, Riang keep for celebrations, Lontar keep for formal / corporate events. Rendered contrast: `contrast-sweep-20261104-s16.md`.
> OWNER: template-system workstream; owner-authorized self-review (ADR-O09), not an independent review
> DEPS: ../../templates/_briefs/, ../../.agents/skills/invitesion-template-harness/SKILL.md, sessions/session-16-20261104-1751.md, sessions/session-15-20261104-1556.md
> GREP: family review, Lontar, Gapura, Kartu, Riang, legacy, overflow, binding, cord, programme, photo, verdict, taste
> UPDATED: 2026-11-04

## 1. Provenance: what this record is and is not
- The s15 briefs, the briefs index and the harness skill cited `family-review-20261104-s15.md`. That file was never written to the repository: the external s15 log shows it being drafted in the sandbox while the second render pass ran, and the session ended before it was saved. The s15 screenshots lived in that sandbox's `/tmp` and were lost with it.
- This record does **not** reconstruct the s15 file. Every observation below comes from renders produced and inspected in s16 (§2). s15 findings are referred to by their IDs from `sessions/session-15-20261104-1556.md` (F1–F9). Two s15 events appear only in the external log and are quoted as reports, not as observations of this record: a second pass (155 shots, 0 px overflow) and the Lontar binding change (s15 "L2": a hairline cord across the band read as a range slider at 1280 px, so it became two separate cords). The binding change itself is in the code at `e983700` (`components/invitation/families/lontar.tsx`, `Binding`), and §4 S16-L1 is its first recorded render.
- References in the briefs, the briefs index and the harness skill now point to this file.

## 2. Method
| Item | Value |
|---|---|
| Build | Local production build of the s16 worktree, whose product code equals checkpoint `e983700` (s16 changed no product file before this review). `local-stack.sh up` → `start` on 127.0.0.1:3100, `middleware.ts` set aside per D-012 (placeholder Clerk keys); Postgres 16.15 on 127.0.0.1:5433 |
| Fixture | `invitation-research/_tools/setup/seed-family-review.ts --cover-url http://127.0.0.1:3100/review/cover.png --palettes` → 121 invitations: 31 review variants (legacy full / photo / corporate; each family full / photo / corporate / birthday / sparse / expired / dark) and 90 palette pages. All people, numbers and places fictional; no religious text |
| Browser | `tools/template-harness/page-review.ts`, Chrome for Testing 156.0.8078.4, headless, device scale 1 |
| Main pass | 31 pages × 360×800, 390×844, 412×915, 1280×800 and 390×844 with `prefers-reduced-motion: reduce` = **155 shots** (18:00:42–18:06:30Z). Guests per variant: full → `nama-panjang` (long names), birthday → `emoji-name`, sparse → `rtl-name`, dark → `hostile-name`, others → `budi-hartono` |
| Stress pass | `--mobile-only` (360×800): `hostile-name`, `rtl-name`, `emoji-name` and the opaque-link guest (token from the seed output) on each layout's full variant = **20 shots** |
| Inspection | Full-page shots cut into contact sheets (scratch, `/tmp/sheets`); the renders behind each finding are named in §4 |
| Concurrent load | None measured: no capture batch or performance run during the pass. The rendered-contrast sweep started after the pass ended |

**Measurement environment (disclosed; same as s15's second pass, not the product).** The host has one system font family (Noto Sans), which has no Arabic or emoji glyphs. The review Chrome alone ran with `FONTCONFIG_FILE=/tmp/review-fonts/fonts.conf`, adding DejaVu Sans (Arabic) and Noto Color Emoji from the distro packages `dejavu-sans-fonts-2.37-16.amzn2023.0.2` (sha256 `32da9f6f…318b0`) and `google-noto-emoji-color-fonts-20200916-2.amzn2023.0.2` (sha256 `e3a330a9…709ca`), downloaded with `dnf --downloadonly` and unpacked with `rpm2archive` without installing. **These fonts do not ship with Invitesion**: the guest page self-hosts its two fonts, and Arabic and emoji fall back to the guest device's own fonts. System fonts and every other browser on the host are unchanged.

## 3. Technical results (gates)
- **Horizontal overflow: 0 px in 155 / 155 main shots and 20 / 20 stress shots.**
- Page height at 360×800 (px): legacy full 4,652 / corporate 5,819 · Gapura 5,304 / 6,289 · Kartu 4,578 / 5,833 · Riang 4,905 / 6,164 · Lontar 4,184 / 5,727. The corporate heights equal the values the s15 log reports for its second pass (e.g. legacy 5,819, Gapura 6,289, Lontar 5,727), so the renders are reproducible across sandboxes; the binding change is absolutely positioned and does not change height. s15 recorded the legacy corporate page at 6,378 px before the F1 fix.
- Reduced motion: 390×844 and 390×844-reduced heights are identical on all 31 pages (motion never moves layout).
- Product checks at review time: `pnpm typecheck` 0; `pnpm test` 135 / 135 at the checkpoint.
- Rendered colour contrast is a separate gate with its own record: `contrast-sweep-20261104-s16.md`.

## 4. Findings (each names the render it comes from)
| ID | Render(s) | Observation | Status |
|---|---|---|---|
| S16-L1 | lontar-corporate-1280x800, lontar-photo-1280x800, lontar-full-360x800, lontar-photo-360x800 / -412x915, lontar-dark-360x800 | **Final Lontar binding.** Two short hairline cords drop from the band's top edge to hollow holes at 20 % and 80 %. Nothing crosses the band, so the slider reading reported for the previous version (s15 L2) does not occur at 1280 px. On the dark palette the holes stay visible (page-colour fill, line-colour ring) | Resolved |
| S16-L2 | lontar-corporate-360x800 (all 5,727 px) | **Programme-led.** Cover → Tentang Acara → Susunan Acara (one divided card, 30 rows, accent time labels, speakers muted) → Pembicara → Informasi Tamu → Waktu & Tempat → RSVP. Lontar is the only layout where the programme precedes the event facts; the brief's promise holds | Verified |
| S16-L3 | lontar-photo-1280x800, -360x800, -412x915 | Cover photo framed beside the band at 1280 px (13 rem column) and below it at 360 / 412 px, never under text | Verified |
| S16-L4 | lontar-sparse-360x800, lontar-birthday-360x800, lontar-dark-360x800, lontar-corporate-360x800 | Stress: the RTL guest name and RTL speaker render right-aligned with Arabic glyphs; emoji render (review fonts); the hostile name renders as literal text; the long organisation name wraps to two small-caps lines; long speaker names and roles wrap; sparse content (no headline, no end time, no venue) leaves no empty frames | Verified |
| S16-L5 | lontar-birthday-360x800, lontar-full-360x800 | **Tone outside formal events.** A child's seventh birthday in Lontar's calm letter reads stiff; a wedding reads as a formal letter, spare but coherent. Not a defect: `FAMILIES.lontar.intendedFor` is `formal` and the editor shows it | Curation note |
| S16-L6 | code + lontar-corporate renders | The brief's recipe renders a logo when `logoUrl` is set; the layout never renders one, and the content contract keeps `logoUrl` stored-only | Deviation, recorded in the brief |
| S16-L7 | lontar-corporate-360x800 (Informasi Tamu) | Phone and email links sit far apart because each is a 44 px block target | Keep (target size wins) |
| F1 (s15) | every corporate page at 360 | Agenda as one divided card on all five layouts | Fixed, verified |
| F2 (s15) | legacy / Gapura / Kartu / Riang / Lontar corporate covers at 360 | Organisation shown under the event name in every layout | Fixed, verified |
| F3 (s15) | kartu-corporate-360x800 | Kartu programme sections carry its eyebrow line ("SEKILAS", "JADWAL") | Fixed, verified |
| F4 (s15) | gapura-full-1280x800 | Gapura stacks the pin above the venue and wrapping address | Fixed, verified |
| F5 (s15) | riang-full / -birthday / -corporate-360x800 | Riang's time and venue chips centred under the date tile | Fixed, verified |
| F6 (s15) | legacy-photo-360x800 | With a photo, the legacy date chip sits on its own line above the guest card | Fixed, verified |
| F7 (s15) | lontar-full-360x800 (RSVP) | The read-only RSVP name input still clips a long name ("Muhammad Fadhlurrahman Al-Ghifari &…"); shared form, all layouts | **Open** → B-027. *Follow-up 18:43Z: fixed by E-020 (name as wrapping text); verified at 360 px in all five layouts, long and Arabic names* |
| F8 (s15) | riang-corporate-1280x800 | A single Riang event card spans the full width | Fixed, verified |
| F9 (s15) | all RTL / emoji shots | Glyph coverage is a lab-environment issue, solved for review only by the review fonts (§2) | Lab only |
| S16-X1 | legacy-photo, gapura-photo, kartu-photo, lontar-photo (360) | **Photo treatment across families.** Legacy (25 % opacity) and Gapura (20 %) lay the photo behind the cover; with this high-contrast photo it becomes a grey veil whose content barely reads, and the small text needs chips. Kartu and Lontar frame the photo at full strength with nothing over it, and it reads as a photograph | Candidate T1 (§7) |
| S16-X2 | legacy-rtl, gapura-rtl, kartu-rtl, lontar-token (360) | **Vertical rhythm on phones.** Legacy and Gapura leave about 180 px of empty page between the guest card and the opening copy; Kartu and Lontar about 40–60 px. On a 360 px phone the large gap reads like the end of the page | Revise Gapura (legacy stays verbatim) |
| S16-X3 | riang-corporate-360x800, lontar-birthday-360x800 | **Tone fit.** Riang's bunting on a corporate conference and Lontar on a child's party are off-tone; both families render correctly. Hosts choose the family; the editor names each family's intended use but does not warn on a mismatch | Product follow-up (curation) |
| S16-E1 | gapura / kartu / riang / lontar-expired (360) | Read-only: "RSVP untuk undangan ini sudah ditutup.", no RSVP or guestbook form; existing guestbook messages still listed, hostile markup in a message shown as text (kartu-expired) | Verified |
| S16-T1 | stress *-token-360x800 | The opaque-link guest ("Tamu Bertoken") resolves by token in all five layouts | Verified |
| R1 (s15) | legacy-rtl-360x800 | Legacy does not isolate bidirectional names. The pure-Arabic fixture name renders correctly when centred, so this fixture cannot show the gap; a mixed-direction name would | **Open**, code-level |

## 5. Verdicts (technical and visual kept apart)
**Technical (gates):** PASS for layout: 0 px overflow in 175 / 175 shots; every state renders (full, photo, corporate programme, birthday, sparse, expired / read-only, dark, opaque link) on every layout. Rendered contrast: see `contrast-sweep-20261104-s16.md`. Open technical items: F7 (B-027), R1 (legacy bidi).

**Visual (keep / revise / retire), from the renders in §4:**
| Family | Verdict | Why |
|---|---|---|
| Gapura | **Keep, revise** | The arch composition reads strongly ceremonial for weddings. Revise the photo treatment (X1: frame inside the arch instead of fading behind text) and the phone rhythm (X2). Reads ceremonial rather than business-formal on the corporate fixture |
| Kartu | **Keep** | The most consistent across event types in this review: stationery card, full-strength framed photo, date stamp, clear eyebrow → title hierarchy; the corporate fixture reads like a formal card |
| Riang | **Keep for celebrations** | Bunting, date tile and centred chips read playful for birthdays and thanksgivings; off-tone for a formal conference (X3) |
| Lontar | **Keep for formal and corporate events** | Programme-led promise verified (L2), binding fixed (L1), calm at every width; spare on weddings, stiff for children's parties (L5) |
| Legacy | No visual verdict | Compatibility fallback, kept verbatim by design (byte-identical for missing or retired family ids) |

## 6. Asset provenance (review only; nothing here is committed)
- **Cover photo:** generated in s16 with the image tool (prompt: full-bleed portrait photograph, white jasmine and frangipani against near-black foliage, harsh sun, pale stone wall; no people, text, logos or watermark). Fictional; 1024 × 1024 PNG, sha256 `2512ccff7e74a648720d4a57a586c24dec58d63a99ae23f8cda6ae20b8183e37`; stored git-ignored at `tools/template-harness/.out/review-assets/cover-photo.png` and copied into the app snapshot's `public/review/cover.png`. The s15 cover was not recovered and not reused.
- **Review fonts:** DejaVu Sans (Bitstream Vera-derived free licence) and Noto Color Emoji (SIL OFL 1.1) from the distro repositories, used only by the review Chrome (§2). Not shipped.

## 7. Taste candidates
Rule (`invitesion-template-harness`): only a principle that survived a written review on more than one family is listed as emerging taste.
| ID | Candidate | Evidence | Decision |
|---|---|---|---|
| T1 | Frame the photo at full strength; never fade it behind text | X1: Kartu and Lontar vs legacy and Gapura, one high-contrast photo | Candidate. Needs a low-contrast photo before promotion |
| T2 | Repeated rows live in one divided container; cards only for distinct entities | s15 F1 (30 agenda cards ≈ 3,100 px of a 6,378 px page) and §3 / §4 here: one divided card on all five layouts, every corporate page 5,727–6,289 px at 360 | **Promoted** to the skill's emerging taste |
| T3 | Keep vertical gaps on phones within one section rhythm (no screen-high gaps) | X2: two layouts each way | Candidate |
| T4 | Recommend a family by event type | X3 | Product rule, not taste |

## 8. Limits
One cover photo; one review font environment; headless Chrome at device scale 1, not physical devices or in-app browsers; motion judged only as static frames plus the identical reduced-motion heights; hover and focus states not reviewed; RSVP saved and error notices not rendered (they need a form submission); no independent reviewer (ADR-O09).

## 9. Follow-up, session 17 (appended; §1–§8 describe the s16 build and stay as written)
- **Build:** the unmodified checkpoint `f2fd128` (s16 code incl. E-021 / E-022), production snapshot on :3100, review fonts as in §2 (same two packages). Fixture `seed-family-review.ts --cover-url … --palettes --mark-variants --logo-files …`: 141 invitations; 15 fictional logos stored through `saveImage` keyed to their invitations (the upload route's storage call), 5 upload paths without a stored file.
- **Organiser mark (E-021, S16-L6), measured:** 5 layouts × {corporate (square logo, long organisation), corp-wide (2.91 logo, cover photo), corp-rtl (0.21 logo, Arabic organisation), corp-nologo, corp-broken} × 360 / 1280 = 50 pages, **554 / 554 checks**: HTTP 200, no horizontal overflow, logo from `/media/<id>/<hex>.png` loaded, alt "Logo <organisation>", intrinsic and rendered 160 × 64 frame with the image inside it, mark before and above the headline, category shown, category on the opaque chip over the photo in legacy and Gapura, Arabic organisation `rtl` and not clipped, broken logo reported as not loaded with the frame intact.
- **Organiser mark, inspected (contact sheets of every page):** placement is consistent across the five layouts at both widths. M1: a 0.21 logo reads as a 13 px sliver in the 64 px frame; legible as a mark only, so the editor could say which logo shapes work. M2: a broken upload path shows the browser's broken-image glyph and the wrapped alt text inside the frame (no shift, no overflow); a media deletion that leaves the config pointing at a missing file would produce this. M3: in Kartu and Lontar an Arabic organisation name aligns right under the left-aligned mark and headline (bidi-correct; open design decision, see the Lontar brief).
- **S17-L1 (code reading while testing E-023):** Lontar draws the cover photo only inside the date band, so a Lontar invitation without date, time and venue hides a saved photo.
- **Not re-reviewed:** the s16 visual verdicts (§5) stand; no family layout changed in s17 apart from E-023 / E-024, whose rendered effect is checked in the session 17 record.
- **Asset provenance (s17, review only, git-ignored `tools/template-harness/.out/review-assets/`, never committed):** generated with the image tool. Cover, high contrast, s16 prompt (white jasmine and frangipani against near-black foliage, harsh sun, pale stone wall; no people, text, logos or watermark): 1024², the generator added white side bars, trimmed to the photo `cover-photo-trim.png` 646 × 993, sha256 `a6de7c9e…5dfbc`, grey mean 51.2 / stdev 78.0, served as `public/review/cover.png` in the snapshot only. Cover, low contrast (misty terraced rice fields at dawn, thick fog, muted mid-tones): `cover-photo-low.png` 1024², sha256 `d9a256e2…fee62`, grey stdev 61.8, for the Gapura photo follow-up (S16-X1). Logos (flat fictional marks, no letters): `logo-mark-trim.png` 367², sha256 `c60b49eb…ef92b`; `logo-wordmark-trim.png` 775 × 266, sha256 `8c40cd39…97215`; `logo-emblem-trim.png` 108 × 516, sha256 `91289821…a7865a`. The s16 cover and logo were not recovered and not reused.
