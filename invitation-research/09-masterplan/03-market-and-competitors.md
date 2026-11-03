<!-- SUMMARY (first 7 lines — greppable) -->
# 03-market-and-competitors.md — landscape and compact Tier-A profiles
> WHAT: Archetypes in the Indonesian digital-invitation market and one compact profile per Tier-A competitor (positioning, pricing, features, technology, strengths, weaknesses, lessons). Detail: `../03-teardowns/<vendor>/dossier.md`.
> STATUS: FINAL v1 (s08, 2026-11-03)
> OWNER: Research agent
> DEPS: ../02-competitor-discovery/{shortlist.md,competitor-longlist.csv}, ../03-teardowns/*/dossier.md, ../05-feature-matrix/, ../06-gap-analysis/pricing-packaging.md
> GREP: market, competitor, archetype, profile, positioning, lessons
> UPDATED: 2026-11-03

## 1. Landscape (52-candidate longlist, weighted rubric, `../02-competitor-discovery/shortlist.md`)
| Archetype | Vendors | What they sell | Price band (IDR) |
|---|---|---|---|
| Mass-market DIY + app | Indoinvite, PALEO, Wevitation | cheap invitations, apps, huge catalogs or ecosystems | 39k–129k |
| DIY → custom ladder | Satu Momen, (Sitemu) | self-edit to custom design and corporate | 79k–850k |
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
| **Viding** (VID) | wedding digitalization platform | 300k–850k; services 2.1–6.25M | split invitations, AutoBlast, staffed E-Guest Book, livestream, Studio canvas | jQuery, GSAP, Bootstrap | operations bundle | zoom blocked, 3,285 KiB, English-first | split invitations via guest groups |
| **Enviory** (ENV) | premium art-directed weddings, instant | 75k / 125k (anchored); reseller quota; 35 % referral | reverse trial, try-with-your-names, QR check-in, variants, click-to-load map | first-party scripts only, a11y 100 | craft + accessibility | 13.9 s LCP behind long intros, weddings only | reverse trial; accessible but rich motion |
| **Invitato** (IVT) | done-for-you + RSVP assistance + guestbook staff | from 400k; services from 1M / 2M | opaque guest codes, one-time QR pass, strict / flexi check-in, envelope labels | heavy video, 7,192 KiB | end-to-end operations | weight, no self-serve, demos tied to real couples | opaque guest links; desk workflows |
| **INVI.ID** (INV) | cheap website invitations + reseller business | 198k / 298k list (149k with a public coupon); packs 13–45k | multi-niche themes (khitan, aqiqah, walimatussafar), exports, white label | WordPress + Elementor, GTM | niche themes, reseller economics | 760 KB JS, TBT 3.7 s, commercial fonts unverified | Islamic family-event themes; exports |
| **Katsudoto** (KAT) | invitation + guestbook + planner | Lite 100k; 300k–700k + 24 add-ons; WA Rp 1k/message | selfie check-in, auto thank-you, tables, souvenirs, planner | jQuery, AOS, Video.js; zoom blocked | wedding ops suite | 5,984 KiB, TBT 4.2 s | ops features inside the price; Lite fighter tier |
| **Sitemu** (STM) | DIY → custom, "jadi 5 menit" (claimed) | — | — | — | — | — | addendum (no dossier) |
| **Barunson** (BRN) | Korean mobile invitations from a paper brand | free for members; licensed 9,900 KRW | per-side card gift money with automatic payout, paper ↔ QR, per-area editing | jQuery, Kakao SDK; TBT 0 | closest foreign format | 4,461 KiB fonts, no OG | per-side gifts; printed QR to the live page |
| **Paperless Post** (PPO) | designer digital stationery | coins; Plus unlock; Pro subscription | multi-channel sends, reminders per channel, co-hosts, surveys, password | unmeasured | craft, delivery | opaque coin pricing | channel-aware reminders; co-hosts |
| **RSVPify** (RSV) | event operations | free ≤ 100; plans [UNKNOWN] | forms, ticketing, seating, QR check-in with badges, MCP | unmeasured | ops depth, trust signals | pricing behind bot protection | check-in as a first-class app |
| **Joy** (JOY) | free wedding website + registry | free core | magic-link address collection, cash funds, hotel blocks | unmeasured | whole journey free | US-centric | self-registration link |
| **Partiful** (PTF) | casual mobile-first events | free | RSVP without an app, text blasts, comments | unmeasured | lowest friction | casual events | one-link RSVP stays account-free |

## 3. Top-10 competitor insights
1. **Every measured competitor guest page is heavy and slow in the lab** (perf medians 28–55; LCP 13.9–23.1 s; 2.4–7.2 MB), so speed is an open positioning space (FM-156…160).
2. **Day-of operations, not the page, carry the high prices** (VID, IVT, WEV, KAT services 1M–6.25M).
3. **Table stakes are uniform:** cover gate, music, countdown, calendar, gallery, RSVP, wishes, gifts appear at 8–9 of 9 Indonesian vendors.
4. **Price floor is low:** one-time entry tiers at 39k–100k; our 149k entry is above all of them.
5. **Resellers are a real channel** (SMO, WEV, ENV, INV credits and white label).
6. **Privacy is weak:** three vendors expose real customers' events as public samples (IDI, SMO, IVT).
7. **Honesty gaps are common:** permanent strikethrough anchors (VID, ENV, WEV), public coupons (INV), contradictory claims (KAT, SMO).
8. **Accessibility is mediocre except ENV (100):** zoom blocked at VID and KAT; `lang="en"` on Indonesian pages at WEV, VID, KAT.
9. **Niche depth exists only where vendors built real themes** (INV Islamic family events); faith and regional coverage elsewhere is SEO pages or a filter tag.
10. **Conversion patterns worth testing:** charge at sharing (IDI), reverse trial after publish (ENV), try-with-your-names (ENV), free theme switching (IDI, WEV, ENV).
