<!-- SUMMARY (first 7 lines — greppable) -->
# style-observations.md — Invitesion's actual visual identity today (seed for style DNA)
> WHAT: Tokens, type, palette logic, motion, Indonesian copy tone — with file and screenshot evidence. Feeds the `invitesion-style-dna` skill.
> STATUS: DONE (Phase 1)
> OWNER: Oracle (research)
> DEPS: archive/tokens.vienne-old-brand.css (old root tokens.css: never imported, archived 2026-10-29; re-verify the palette against app/globals.css), app/layout.tsx, lib/invitation/templates.ts, components/invitation/public-renderer.tsx, raw/invitesion/*/viewport-412.webp
> GREP: style, identity, tokens, typography, palette, motion, copy tone, dna
> UPDATED: 2026-10-29

## 1. Two identities in one repo
| Surface | Identity | Evidence |
|---|---|---|
| Platform (marketing, auth) | **Rose editorial**: warm blush paper (`--v-paper: oklch(97% .012 355)`), plum ink, saturated rose accent (`--v-accent: oklch(51% .23 8)` ≈ theme colour `#e80053`), hairline rules, generous spacing scale (`--space-*` to 9 rem), display clamp 3–5.5 rem | `tokens.css`, `app/layout.tsx` (`themeColor '#e80053'`), `app/home.module.css` |
| Invitations (guest pages) | **Quiet centered stationery**: one column (max-w-xl), Instrument Serif names, Manrope body, palette background, translucent white cards with soft shadow, uppercase tracked eyebrows | `public-renderer.tsx`; `raw/invitesion/C-INV-001/viewport-412.webp`, `C-INV-002/viewport-412.webp` |
| Template marketing preview | **Stationery with ornament**: thin double frame, arch motif, "Buka Undangan" cover button, "Kepada Yth. Bpk/Ibu/Saudara/i — Nama Tamu — di tempat" | `raw/invitesion/C-INV-003/viewport-412.webp`, `preview-client.tsx` |
The preview promises a richer invitation than the renderer delivers — the single biggest brand inconsistency.

## 2. Typography
- **Pair:** Instrument Serif 400 (normal + italic) for display; Manrope for body — both SIL OFL 1.1, self-hosted via `next/font` [OBSERVED layout.tsx].
- Display fallback stack in tokens names "Iowan Old Style / Palatino" (unused once the webfont loads).
- Guest page scale: names `text-4xl → sm:text-5xl` (36→48 px), section headings `text-2xl` serif in accent colour, eyebrow `text-xs` uppercase `tracking-[0.3em]`, body `text-sm leading-7`.
- Long names wrap cleanly (80-char couple-style guest name → 2 balanced lines at 412 px) [OBSERVED C-INV-002].
- Not used: italics, numerals styling (old-style figures), Arabic script face (an Arabic guest name falls back to system fonts).

## 3. Palette logic
- 18 palettes, each exactly four roles: `bg` (paper), `ink` (text), `accent` (eyebrows, headings, icons, outline buttons), `soft` (name chip). 16 light papers with warm undertones; 2 dark (midnight `#101526`, gold-noir `#171310`) with metallic accents.
- Accents are mid-tone (L≈45–55 %): good for large display text, **too light for small text** on light paper (ivory 3.86:1) [OBSERVED C-INV-001 contrast].
- Cards are hard-coded `bg-white/70` regardless of palette → dark palettes break (1.64:1) [OBSERVED C-INV-002].
- Status colours (emerald/red/amber Tailwind) ignore the palette.

## 4. Layout and components
Cover (80 vh, centered) → greeting/prayer → quote → events (cards with icon rows) → story (cards) → gallery (2-col square grid) → livestream → gift (cards, monospace number) → RSVP (form card) → wishes (form + list) → footer credit. Single column, 24 px gutters, 48–64 px section padding. Icons: lucide (CalendarDays, Clock3, MapPin, Gift, Radio, Quote). Touch targets ≥ 44 px (`min-h-11`).

## 5. Motion
- Guest page: **none** (no transitions beyond button hover colour).
- Platform tokens define a motion vocabulary that the guest page never uses: `--ease-out: cubic-bezier(.16,1,.3,1)`, `--ease-in-out: cubic-bezier(.65,0,.35,1)`, durations 120 / 220 / 420 ms.
- Marketing/catalog CSS: ~56 keyframe/animation declarations (hero rotator, catalog cards).
- Template preview honours `prefers-reduced-motion` (C-INV-003 `reducedMotionCss=true`); the guest page has nothing to reduce.

## 6. Indonesian copy tone [OBSERVED presets + renderer]
- Register: polite-formal for family/religious events ("Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i…"), warm-casual for birthdays/reunions ("Yuk, rayakan…", "Sudah lama tidak bertemu — mari kumpul lagi."), playful for team building ("jangan cuma jadi wacana!").
- Guest address form: "Kepada Yth." + name (renderer); preview adds the full convention "Bpk/Ibu/Saudara/i … di tempat".
- Section names: "Rangkaian Acara", "Cerita Kami", "Galeri", "Hadiah", "Konfirmasi Kehadiran", "Ucapan & Doa", "Siaran Langsung".
- Button voice: first person, gentle ("Ya, saya hadir" / "Maaf, belum bisa", "Kirim ucapan", "Lihat lokasi").
- Religious content: Basmalah transliteration and Qur'an translations embedded as defaults (provenance unverified — QA-015).

## 7. Do / don't (current evidence → keep or fix)
| Keep (works today) | Fix (evidence of failure) |
|---|---|
| Instrument Serif + Manrope pairing; restrained centered composition | Palette-only templates — every theme looks the same to guests |
| Four-role palette model (simple, token-friendly) | Accent used for small text on light paper (contrast) |
| Polite, warm Indonesian microcopy in first person | Hard-coded white cards on dark palettes |
| 44 px touch targets, `lang` from locale, pinch-zoom allowed | No cover gate/ornament on the real page while the preview shows one |
| Rose editorial platform identity (distinctive among local players [INFERRED, verified in Phase 3]) | Platform motion tokens unused on invitations |

## 8. Target direction (seed for ADR-STYLE-001, decided in Phase 7)
"Modern Indonesian stationery that moves": keep the serif/sans pair and four-role palettes, add per-template layout systems and ornament as code (CSS/SVG authored in-repo), a shared motion vocabulary based on the existing easing tokens, and optional 3D/cinematic covers as lazy islands with static fallbacks.
