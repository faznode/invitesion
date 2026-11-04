<!-- SUMMARY (first 7 lines — greppable) -->
# 03-market-and-competitors.md — landscape and compact Tier-A profiles
> WHAT: Archetypes in the Indonesian digital-invitation market, one compact profile per Tier-A competitor (positioning, pricing, features, technology, strengths, weaknesses, lessons) and the Tier-B summary. Detail: `../03-teardowns/<vendor>/dossier.md`, `../03-teardowns/tier-b-profiles.md`.
> STATUS: Verified s10 (2026-11-04; v1 s08). Added the Tier-B summary (§4) and the Sitemu status (§5); Viding figures now cover six themes (C-VID-107…109); speed ranges recomputed theme-first from the benchmark pack. **Open:** Sitemu dossier BLOCKED (RQ-COMP-02), Tier-B 11 / 21 substantive (RQ-COMP-04), public complaints researched for one vendor only (RQ-COMP-05); see `../_handoff/acceptance-matrix.md`.
> OWNER: Research agent
> DEPS: ../02-competitor-discovery/{shortlist.md,competitor-longlist.csv}, ../03-teardowns/*/dossier.md, ../03-teardowns/tier-b-profiles.md, ../04-template-benchmarks/benchmark-pack.md, ../05-feature-matrix/, ../06-gap-analysis/pricing-packaging.md
> GREP: market, competitor, archetype, profile, positioning, lessons, tier b, sitemu
> UPDATED: 2026-11-04

## 1. Landscape (52-candidate longlist, weighted rubric, `../02-competitor-discovery/shortlist.md`)
| Archetype | Vendors | What they sell | Price band (IDR) |
|---|---|---|---|
| Mass-market DIY + app | Indoinvite, PALEO, Wevitation | cheap invitations, apps, huge catalogs or ecosystems | 39k–129k |
| DIY → custom ladder | Satu Momen (Sitemu blocked, §5) | self-edit to custom design and corporate | 79k–850k |
| Platform + guest operations | Viding, Invitato, Katsudoto | invitation + check-in, WhatsApp, seating, staff | 100k–6.25M |
| Premium design / motion | Enviory, Katsudoto | art-directed themes, motion | 75k–700k |
| Website-as-a-service + resellers | INVI.ID | cheap packs under resellers' brands | 13k–45k per invitation to resellers |
| International lessons | Paperless Post (craft), RSVPify (operations), Joy (free all-in-one), Partiful (virality), Barunson (Korean format twin) | — | — |

## 2. Compact Tier-A profiles
| Vendor | Positioning | Pricing | Notable features | Technology (guest page) | Strengths | Weaknesses | Lesson for us |
|---|---|---|---|---|---|---|---|
| **Indoinvite** (IDI) | everything for every life event, built for you | 39k–119k one-time, no expiry; 400k/month subscription | 50 event SEO pages, 493 themes, QR check-in, gift commerce, paid stickers, AI copy, video | jQuery, AOS, GSAP (one real page) | price, breadth, payments, app (500K+) | real customers' events as samples; 2.36 MB catalog page | charge at sharing; free theme switching; never use real events as samples |
| **PALEO** (PLO) | app-first web invitations | [UNKNOWN] | 5-step wizard, prewedding video, guest book | app (500K+, 4.5★), no web catalog | shortest guided creation | no web presence, stale app | wizard into our editor |
| **Satu Momen** (SMO) | same features on every tier, pay for service and time | 79k (7 days) … 850k corporate; reseller credits | page-based editor, Check In System with greeting screen and head count, prints, 3D video | [UNKNOWN] | reseller packaging, day-of ops | previews show personal data; 7-day Basic | greeting screen + head count; published reseller prices |
| **Wevitation** (WEV) | ecosystem: invitation + registry + planner + AI + reception service | 69k forever; packs; reception 1.69–4.99M | QR pass on the page, IG story template, Android scanner, Wegiftry registry | Laravel Livewire, jQuery, AOS; GTM on guest pages | breadth on a cheap invitation | Perf 40, 3,448 KiB, `lang="en"` | guest-side take-aways (QR pass, story asset) |
| **Viding** (VID) | wedding digitalization platform | 300k–850k; services 2.1–6.25M | split invitations, AutoBlast, staffed E-Guest Book, livestream, Studio canvas | jQuery, GSAP, Bootstrap | operations bundle | zoom blocked, 3,084 KiB (six-theme median), English-first | split invitations via guest groups |
| **Enviory** (ENV) | premium art-directed weddings, instant | 75k / 125k (anchored); reseller quota; 35 % referral | reverse trial, try-with-your-names, QR check-in, variants, click-to-load map | first-party scripts only, a11y 100 | craft + accessibility | 13.9 s LCP behind long intros, weddings only | reverse trial; accessible but rich motion |
| **Invitato** (IVT) | done-for-you + RSVP assistance + guestbook staff | from 400k; services from 1M / 2M | opaque guest codes, one-time QR pass, strict / flexi check-in, envelope labels | heavy video, 7,192 KiB | end-to-end operations | weight, no self-serve, demos tied to real couples | opaque guest links; desk workflows |
| **INVI.ID** (INV) | cheap website invitations + reseller business | 198k / 298k list (149k with a public coupon); packs 13–45k | multi-niche themes (khitan, aqiqah, walimatussafar), exports, white label | WordPress + Elementor, GTM | niche themes, reseller economics | 760 KB JS, TBT 3.7 s, commercial fonts unverified | Islamic family-event themes; exports |
| **Katsudoto** (KAT) | invitation + guestbook + planner | Lite 100k; 300k–700k + 24 add-ons; WA Rp 1k/message | selfie check-in, auto thank-you, tables, souvenirs, planner | jQuery, AOS, Video.js; zoom blocked | wedding ops suite | 5,984 KiB, TBT 4.2 s | ops features inside the price; Lite fighter tier |
| **Sitemu** (STM) | DIY elegant invitations, "jadi 5 menit" (historical longlist claim, 2026-10-29, not re-verified) | [UNKNOWN] | [UNKNOWN] | [UNKNOWN] | [UNKNOWN] | [UNKNOWN] | **BLOCKED** (§5): no profile, no conclusions drawn |
| **Barunson** (BRN) | Korean mobile invitations from a paper brand | free for members; licensed 9,900 KRW | per-side card gift money with automatic payout, paper ↔ QR, per-area editing | jQuery, Kakao SDK; TBT 0 | closest foreign format | 4,461 KiB fonts, no OG | per-side gifts; printed QR to the live page |
| **Paperless Post** (PPO) | designer digital stationery | coins; Plus unlock; Pro subscription | multi-channel sends, reminders per channel, co-hosts, surveys, password | unmeasured | craft, delivery | opaque coin pricing | channel-aware reminders; co-hosts |
| **RSVPify** (RSV) | event operations | free ≤ 100; plans [UNKNOWN] | forms, ticketing, seating, QR check-in with badges, MCP | unmeasured | ops depth, trust signals | pricing behind bot protection | check-in as a first-class app |
| **Joy** (JOY) | free wedding website + registry | free core | magic-link address collection, cash funds, hotel blocks | unmeasured | whole journey free | US-centric | self-registration link |
| **Partiful** (PTF) | casual mobile-first events | free | RSVP without an app, text blasts, comments | unmeasured | lowest friction | casual events | one-link RSVP stays account-free |

## 3. Top-10 competitor insights
1. **Every measured competitor guest page is heavy and slow in the lab** (per-vendor medians over unique cold-load themes, 7 vendors: Lighthouse performance 27.5–55, LCP 12.6–23.1 s, transfer 2,404–7,192 KiB; Lighthouse 12.8.2 mobile, simulated Slow 4G + 4× CPU, 412×915; `../04-template-benchmarks/benchmark-pack.md`), so speed is an open positioning space (FM-156…160). Our own figures (C-INV-001…005) predate the P0 changes and are not re-measured yet (RQ-OWN-02).
2. **Day-of operations, not the page, carry the high prices** (VID, IVT, WEV, KAT services 1M–6.25M).
3. **Table stakes are uniform:** cover gate, music, countdown, calendar, gallery, RSVP, wishes, gifts appear at 8–9 of 9 Indonesian vendors.
4. **Price floor is low:** one-time entry tiers at 39k–100k; our 149k entry is above all of them.
5. **Resellers are a real channel** (SMO, WEV, ENV, INV credits and white label).
6. **Privacy is weak:** three vendors expose real customers' events as public samples (IDI, SMO, IVT).
7. **Honesty gaps are common:** permanent strikethrough anchors (VID, ENV, WEV), public coupons (INV), contradictory claims (KAT, SMO).
8. **Accessibility is mediocre except ENV (100):** zoom blocked at VID and KAT; `lang="en"` on Indonesian pages at WEV, VID, KAT.
9. **Niche depth exists only where vendors built real themes** (INV Islamic family events); faith and regional coverage elsewhere is SEO pages or a filter tag.
10. **Conversion patterns worth testing:** charge at sharing (IDI), reverse trial after publish (ENV), try-with-your-names (ENV), free theme switching (IDI, WEV, ENV).

## 4. Tier-B summary (`../03-teardowns/tier-b-profiles.md`, session 10, evidence level C)
Public marketing and pricing pages only (robots first, ≥ 3 s per origin, no demos, forms or logins); no guest page was measured, so nothing here changes the speed findings in §3.

| Coverage | Vendors |
|---|---|
| Substantive, Indonesia (6) | Undangan Virtual (UVR), Janiva (JNV), Sannubari (SAN), sangmempelai.id (SMP), PunyaAcara (PAC), Wedew (WDW) |
| Substantive, international (5) | Invitee (INE, MY), Zola (ZOL, US), The Knot (TKN, US), Evite (EVT, US), Biihappy (BHP, VN) |
| Thin (3) | WebNikah (WNK, homepage only), Bridestory (BRS, marketplace homepage), MEMO Wedding (MMO, "Coming Soon") |
| Blocked or unreadable (7) | Harikita (HRK) and Sonett (SNT): robots.txt AI-agent opt-out (D-026); WedMeGood (WMG), Greenvelope (GRV), Minted (MTD), Canva (CNV): HTTP 403 and / or opt-out; Eqxiu (EQX): undecodable body, not re-requested |

**What Tier B adds to the Tier-A picture**
1. **Free publishing is common at the bottom of the market** (Wedew free forever, Invitee RM 0, Biihappy free, Zola and The Knot free websites); paid value moves to messaging, check-in devices, events / languages or services. Our "free drafting, paid publish" stance (ADR-O02) is a deliberate choice, not the market default.
2. **Packaging axes differ by vendor:** guest quota with identical features (UVR 79k / 99k / 149k), art direction (JNV 79k / 149k / 249k), turnaround time (SAN), number of events and languages (INE), metered messages and reception devices (WDW). Only Invitee withholds RSVP below a paid tier.
3. **QR check-in already sells at low prices** (SMP at 49k, INE Plus, WDW packages), which supports pulling B-024 forward once B-011 is decided.
4. **National QR gifts** (Malaysia's DuitNow, Vietnamese bank QR) mirror the QRIS gift opportunity (idea I-03, B-026).
5. **Honesty and privacy gaps recur:** 78–86 % strikethrough anchors (SMP), customers' couple names and dates on a homepage (WNK), wrong `lang` (SMP); these are patterns to avoid (B-002, B-016).

## 5. Sitemu status (`../03-teardowns/sitemu/dossier.md`)
- **BLOCKED, not profiled.** `sitemu.id/robots.txt` allows `User-agent: *` but disallows the legacy Anthropic agent tokens `Claude-Web` and `anthropic-ai`; under D-026 this research treats that as an explicit AI-agent opt-out. Pages fetched before the check existed were deleted unused; no Sitemu fact from them appears anywhere.
- **What remains:** the historical longlist row (probe 2026-10-29: claimed 120 themes, Rp 50k–300k, free trial, "jadi 5 menit") and `D-STM` (0 demo links on `/product`), neither re-verified.
- **Effect:** Tier-A coverage is 14 / 15 and the Indonesian Tier-A requirement is 9 / 10 (RQ-COMP-02 BLOCKED). The DIY → custom ladder archetype is represented by Satu Momen; no conclusion in this masterplan rests on Sitemu.
- **Resolves with:** owner answer to Q-O08 (`../_open-questions.md`), a human researcher's public read, or a robots.txt change on Sitemu's side.
