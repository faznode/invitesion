<!-- SUMMARY (first 7 lines — greppable) -->
# tier-b-profiles.md — one-page profiles of the 21 Tier-B competitors (shortlist §4)
> WHAT: Positioning, pricing, product, technology, strengths, weaknesses and lessons per Tier-B vendor from public pages read on 2026-11-03, plus the vendors that could not be profiled and why.
> STATUS: v1, session 10 (2026-11-03). 11 substantive profiles (6 Indonesian, 5 international), 3 thin, 7 blocked or unreadable. Facts: `../raw/_discovery/profile-reads-2026-11-03.jsonl`; targets: `../raw/_discovery/profile-targets-2026-11-03{,-pass2}.tsv`.
> OWNER: Oracle (research)
> DEPS: ../02-competitor-discovery/{shortlist.md,competitor-longlist.csv}, ../_tools/discovery/profile-reads.py, ../_evidence-index.md (session 10), ../01-codebase-audit/feature-inventory.csv
> GREP: tier b, profile, harikita, undangan virtual, janiva, sannubari, sangmempelai, punyaacara, wedew, zola, the knot, evite, invitee, biihappy
> UPDATED: 2026-11-03

**Method.** `_tools/discovery/profile-reads.py`: Android UA, plain GET, robots.txt first (RFC 9309 + D-022; D-026 AI-agent opt-outs), ≥ 3 s between requests to one origin, homepage plus at most two linked pricing / features / catalog pages, never demo, preview or customer pages, no forms, no login. A 401/403/429/503 or a challenge stops the origin with no fallback. Page text stayed private; only facts are committed. Evidence level of every profile below: **C** (public marketing and pricing pages; no guest-page measurement). Prices are IDR unless marked and were read once (permanence of discounts [UNKNOWN]).

**Privacy.** No customer, testimonial or demo-couple name is recorded. WebNikah's homepage lists customers' couple names with event dates; that page text was deleted after the non-identifying facts below were taken.

## Coverage
| Code | Vendor | Country | Status | Evidence |
|---|---|---|---|---|
| UVR | Undangan Virtual | ID | substantive | S-UVR-001 |
| JNV | Janiva | ID | substantive | S-JNV-001 |
| SAN | Sannubari | ID | substantive | S-SAN-001 |
| SMP | sangmempelai.id | ID | substantive | S-SMP-001 |
| PAC | PunyaAcara | ID | substantive | S-PAC-001 |
| WDW | Wedew | ID | substantive | S-WDW-001 |
| WNK | WebNikah | ID | thin (homepage only) | S-WNK-001 |
| BRS | Bridestory | ID | thin (marketplace homepage only) | S-BRS-001 |
| MMO | MEMO Wedding | ID | thin (site "Coming Soon", app id only) | S-MMO-001 |
| HRK | Harikita | ID | **blocked** (robots.txt AI-agent opt-out, D-026; content discarded) | S-HRK-001 |
| INE | Invitee | MY | substantive | S-INE-001 |
| ZOL | Zola | US | substantive | S-ZOL-001, S-ZOL-002 |
| TKN | The Knot | US | substantive | S-TKN-001, S-TKN-002 |
| EVT | Evite | US | substantive | S-EVT-001, S-EVT-002 |
| BHP | Biihappy | VN | substantive | S-BHP-001, S-BHP-002 |
| SNT | Sonett | KR | **blocked** (AI-agent opt-out, D-026; content discarded) | S-SNT-001 |
| WMG | WedMeGood | IN | **blocked** (HTTP 403 + AI-agent opt-out) | S-WMG-001 |
| GRV | Greenvelope | US | **blocked** (HTTP 403 on robots.txt and homepage) | S-GRV-001 |
| MTD | Minted | US | **blocked** (HTTP 403) | S-MTD-001 |
| CNV | Canva invitations | AU | **blocked** (HTTP 403 + AI-agent opt-out) | S-CNV-001 |
| EQX | Eqxiu 易企秀 | CN | **unreadable** (compressed body without content negotiation; not re-requested) | S-EQX-001 |

**Counts toward RQ-COMP-01 (`../_handoff/acceptance-matrix.md`):** Indonesian substantive profiles = 9 Tier-A dossiers + 6 here = **15** (≥ 12 met; Sitemu is blocked and not counted). International = 5 Tier-A dossiers + 5 here = **10** (≥ 10 met). Required Tier-B one-pagers: **11 / 21 substantive**; the 10 others are thin or blocked for the reasons above (RQ-COMP-04 PARTIAL).

---

## Indonesia

### UVR — Undangan Virtual (undanganvirtual.com)
- **Positioning:** syar'i and modern invitations "untuk semua acara", filled in by the customer from a phone. [OBSERVED S-UVR-001]
- **Pricing:** the package sets the **guest-link quota**, never the features: 500 guests **79,000**, 1,000 guests **99,000** ("Terlaris"), up to 100,000 guests **149,000**; all themes on every package, no monthly fee. [OBSERVED]
- **Funnel:** pick theme → choose a quota package and pay (QRIS, virtual account, e-wallet) → a **6-character token** appears after payment and creates the account → fill in from the phone → send personal links. Pay-first, account-second. [OBSERVED]
- **Catalog:** 56 themes (wedding & engagement 39, aqiqah & tasyakuran 3, khitanan 2, birthday 4, office & business 3, general 5); wedding styles syar'i, minimalist, floral, modern, elegant & luxury, rustic, adat; theme codes such as `RST-…`, `LUX-…`. Events include school and campus activities and an optional **donation section** with a target amount, QRIS and account. [OBSERVED]
- **Features:** music, RSVP, guest book of wishes, countdown, calendar, gallery, gifts, maps; reseller programme. [OBSERVED keywords + nav]
- **Tech:** Nuxt, GA4/GTM, WhatsApp CTA. [OBSERVED]
- **Lesson:** quota-based pricing with identical features is the clearest packaging in the set; the token step removes signup before payment. **Counter:** our per-invitation price already includes unlimited guests (F-085); publish the "no guest limit" fact next to the price (B-002 copy).

### JNV — Janiva (janiva.id)
- **Positioning:** "build first, pay when you like the result": create and edit yourself, **7-day free trial without a card**, fill once and **switch themes freely**. [OBSERVED S-JNV-001]
- **Pricing (one-time, 6 months active, all features in every theme):** Klasik **79,000** (7 themes), Istimewa **149,000** (4), Sinematik **249,000** (3); lifetime activation **+100,000**. [OBSERVED]
- **Catalog:** 14 themes, story-led regional adat themes (Minangkabau, Javanese) with scene-by-scene cinematic openers, a khitan theme, and one theme labelled "Ala Ghibli". [OBSERVED]
- **Features:** guest name on the opening, photos, countdown with save-to-calendar, maps per event, love story, digital envelope, RSVP, wishes; livestream, QR check-in and custom-domain keywords. [OBSERVED/keywords]
- **Tech:** Next.js, Cloudflare, GTM, Midtrans marker on the theme page. [OBSERVED]
- **Strength / weakness:** the most generous try-before-pay in the set; a theme named after a film studio's style is an IP risk we must not repeat. [OBSERVED] / risk [INFERRED, medium]
- **Lesson:** pricing by art direction (motion depth) instead of features matches our tier model. **Counter:** B-040 (reverse trial) and B-036 (theme switching within a tier); originality gate in the harness (`../09-masterplan/08-template-system-and-harness.md` §4).

### SAN — Sannubari (sannubari.com)
- **Positioning:** done-for-you invitation and greeting-video studio. [OBSERVED S-SAN-001]
- **Pricing (price page dated 2026-10-23):** Reguler **100,000** and Premium **200,000** (RSVP, maps, gallery, up to 2 revisions, ≤ 3×24 h after complete data); Express 1×24 h **+100,000**; wedding + express bundle **300,000**; video greeting **100,000** (≤ 30 s MP4); custom colour and font **+50,000**; custom `.com` domain **+300,000**. [OBSERVED]
- **Product lines:** wedding, aqiqah, baby shower, digital birth card, digital guest book, romantic and birthday video greetings. [OBSERVED nav]
- **Tech:** WordPress + Elementor, jQuery, Lottie, Swiper, Microsoft Clarity, GA4/GTM, Meta Pixel. robots.txt explicitly **allows** AI search and citation crawlers and blocks training-only crawlers. [OBSERVED]
- **Lesson:** turnaround time is the product (3×24 h vs express 1×24 h). **Counter:** our self-serve publish is immediate; assisted setup stays P2 (G-054).

### SMP — sangmempelai.id
- **Positioning:** "Partner Undangan Pernikahan Digital"; web, video and Instagram-filter invitations sold with heavy anchors. [OBSERVED S-SMP-001]
- **Pricing:** web invitation **49,000** shown against 350,000 ("Hemat 86 %"); video invitation **75,000** (±60 s) against 100,000; web + video **99,000** against 450,000; two web invitations **77,000**; web + `.id` domain 309,000; Instagram filter 25,000; `.my.id` domain upgrade **30,000**. [OBSERVED]
- **Inclusions:** digital guest book, unlimited guest names, RSVP, **QR check-in**, website active "selamanya (selama website kami aktif)" (forever, as long as the vendor's site runs). [OBSERVED]
- **Catalog:** 51 video themes (art and regional adat series). [OBSERVED]
- **Tech:** jQuery + Bootstrap on a purchased multipurpose HTML template (leftover demo menu items for agencies and SaaS), Tawk chat, GA4/GTM, Meta Pixel; `lang="zxx"` on Indonesian pages. [OBSERVED] / template origin [INFERRED, high]
- **Lesson / avoid:** forever activation and QR check-in at 49k set the floor for "value"; 78–86 % anchors and a wrong `lang` are what we avoid (B-002, B-016 a11y).

### PAC — PunyaAcara (punyaacara.id)
- **Positioning:** self-serve from a phone for weddings, khitanan, aqiqah and birthdays; free start, "revisi sepuasnya". [OBSERVED S-PAC-001]
- **Pricing:** per template, one-time, **from 25,000** (a photo-free Islamic minimal theme); several templates show **50,000** next to **279,000** (direction of the strikethrough not determinable from text); RSVP included. [OBSERVED]
- **Catalog:** 18 wedding templates with regional tags (Aceh, Bali, Batak, Jawa, Sunda), Islam, minimalist, social-media-styled, photo-free. A free "Wedding Planner" was announced as new. [OBSERVED]
- **Tech:** Alpine.js, Midtrans, GA4/GTM, Meta Pixel (Laravel per the 2026-10-29 probe). [OBSERVED]
- **Lesson:** regional and photo-free themes at the lowest price point address modest and conservative families. **Counter:** niche roadmap (`../06-gap-analysis/template-catalog-roadmap.md`) already lists adat and photo-free variants.

### WDW — Wedew (wedew.id)
- **Positioning:** "Platform Pernikahan Digital": e-invitations **sent automatically** (WhatsApp, e-mail) plus a guest-reception app. [OBSERVED S-WDW-001]
- **Pricing:** **Starter free forever** with every core feature (instant creation, unlimited edits, guest management, RSVP and comments, countdown, gallery, love story, maps, digital guest book, autoplay music, active forever); Lite **50k** (premium themes); Premium **125k**; Intimate **250k** (100 guests, 100 WhatsApp sends, 1 reception app); Celebrate **500k** (250 / 500 / 2); Ultimate **1,000k** (500 / 1,000 / 4, `.com` domain). Add-ons: +50 guests 25k, +50 WhatsApp 40k, +50 e-mails 10k, +1 reception app 100k, custom domain 200k; staffed services from 2,000k (assistant, equipment, usher, livestream). [OBSERVED]
- **Premium features:** cashless angpao, gift registry, session scheduling per group, custom music, custom **greeting screen ("Layar Sapa")**, **check-in and check-out**, 100 MB storage, livestream, comment policy. [OBSERVED]
- **Apps:** Android `id.wedew.mobile` and `id.wedew.guestbook`, iOS `id1523036734`. [OBSERVED links]
- **Tech:** Next.js, Sentry, GTM, Meta Pixel. [OBSERVED]
- **Lesson:** metering the costly parts (messages, reception devices) while giving the page away. **Counter:** we never meter guests; WhatsApp stays `wa.me` (B-018) until an official API contract exists (`../09-masterplan/10-data-privacy-security-payments.md` §5).

### WNK — WebNikah (thin)
Free wedding-website builder; claims **252,582** couples and 100+ themes (basic / premium); "Anda Vendor?" vendor entry; jQuery + Bootstrap, GA4/GTM. The homepage publicly lists recent customers' couple names and event dates (not recorded) — a privacy weakness shared with IDI, SMO and IVT. [OBSERVED/CLAIMED S-WNK-001]

### BRS — Bridestory (thin)
Vendor marketplace homepage (Nuxt/Vue) with a "SayYes RSVP" product flagged new and an app promotion; no invitation pricing on the homepage. Profiled only at homepage level. [OBSERVED S-BRS-001]

### MMO — MEMO Wedding (thin)
`memowedding.com` serves a "Coming Soon" page that links the Android app `com.memowedding.undanganpernikahandigital` (100K+ installs per the 2026-10-29 Play read in the longlist). Store listing not re-read. [OBSERVED S-MMO-001] / installs [ESTIMATE longlist]

### HRK — Harikita (blocked)
robots.txt opts out the legacy Anthropic agent tokens; pages read before the check were discarded unused (D-026). Only the historical longlist row remains (business tiers up to Rp 9.999M, 2026-10-29).

---

## International

### INE — Invitee (Malaysia) — the closest cultural twin
- **Positioning:** digital invitations "built for Malaysian couples" from akad nikah to bersanding, tea ceremony and reception. [OBSERVED S-INE-001]
- **Pricing (one-time per wedding, valid one year):** Free **RM 0** (1 event, EN + BM, QR code and share link, add-to-calendar, Waze / Google Maps, 3 family contacts); Lite **RM 29** (2 events, countdown + music, theme swapping, no branding); Plus **RM 59** (3 events, **4 languages incl. Chinese and Tamil**, RSVP + digital guest book, own music); Pro **RM 99** (5 events, 6-photo gallery + playlist, invitation video and livestream). [OBSERVED]
- **Features:** themes for Malay, Chinese, Indian and Islamic weddings; bulk guest import, grouping by side, personal links via WhatsApp; **QR check-in** with seating; **e-Gifts through DuitNow QR** and a gift registry; multiple events on one invitation; partner programme. Claims: 10,000+ couples, 500k invites sent, 4.9★, 350 themes. [OBSERVED / CLAIMED]
- **Tech:** custom site, TikTok pixel. [OBSERVED]
- **Lesson:** packaging by **number of events and languages** fits multi-ceremony families exactly; a national QR standard for gifts (DuitNow ≈ QRIS). **Counter:** multi-event schedule exists (F-010); gift block with the host's own QRIS image (B-026, idea I-03); guest UI language (G-018) moves up if regional languages matter.

### ZOL — Zola (US)
- **Positioning:** free wedding websites tied to registry, guest list, RSVP tracking, budget, seating chart, vendors and paper. [OBSERVED S-ZOL-001, S-ZOL-002]
- **Website product:** "over 600 templates", custom URLs and **custom domains**, **password protection**, travel and accommodation sections, gallery, RSVPs; the website-designs gallery is disallowed by robots.txt and was not read. [OBSERVED]
- **Paper:** save-the-date cards listed from **$0.59 to $3.09** per card. [OBSERVED]
- **Tech:** Next.js, React, Segment, GA4/GTM, Stripe. [OBSERVED]
- **Lesson:** the free website is the funnel for registry and paper revenue. **Counter:** our money is the invitation itself; password protection (G-047) and custom domains (G-048) stay P2.

### TKN — The Knot (US)
- **Positioning:** free planning platform (checklist, registry with **no-fee cash funds**, free wedding website with RSVPs, invitations and paper with **3 free paper samples**) monetised through a marketplace of ~175,000 vendors; claims 30 million couples and 4 million reviews. [OBSERVED/CLAIMED S-TKN-001, S-TKN-002]
- **Website product:** design families (floral, botanical, rustic, classic, modern, themed), custom RSVP page, FAQ builder with common guest questions, **RSVP reminder message templates**, registry links. [OBSERVED S-TKN-002]
- **App:** Android `com.xogrp.planner`. **Tech:** Next.js / React, Segment, GA4/GTM. [OBSERVED]
- **Lesson:** a guest FAQ (dress code, directions) and reminder templates reduce host messaging. **Counter:** render dress code and agenda (B-029); reminder lists (B-034).

### EVT — Evite (US)
- **Positioning:** online invitations, event pages and greeting cards for every occasion; new "upload your own design". [OBSERVED S-EVT-001]
- **Pricing:** free invitations plus **Evite Pro: unlimited premium invitations and greeting cards for $249.99 per year** ("average savings of $380/yr" claimed). [OBSERVED S-EVT-002 / CLAIMED]
- **Features page:** RSVP tracking, guest messaging, host tools; claims events up to 2,500 guests. [OBSERVED/CLAIMED]
- **Tech:** Webflow marketing pages, jQuery, GSAP, Hotjar, Stripe, PayPal, Cloudflare; Android app `com.evite`. [OBSERVED]
- **Lesson:** a subscription only makes sense for hosts of many events (planners, resellers). **Counter:** keep one-time pricing for families; a reseller credit model (G-052) is the analogue for repeat hosts.

### BHP — Biihappy (Vietnam)
- **Positioning:** a wedding community with tools: **iWedding** (free online wedding cards and a personal wedding website on a subdomain), invitePro (event invitation design), M-Invite (mobile invitations with RSVP and map), a free wedding-logo maker, checklist and budget tools, and community content. [OBSERVED S-BHP-001, S-BHP-002]
- **iWedding features:** RSVP, **wedding gifts by QR**, sharing via Zalo, Messenger and QR code, free theme switching, wishes book, love story, album, events with maps, guest-list management; a pricing page exists but was not read. [OBSERVED]
- **Tech:** Laravel (2026-10-29 probe). [OBSERVED longlist]
- **Lesson:** share channels follow the local messenger (Zalo there, WhatsApp here) and gifts by national QR. **Counter:** WhatsApp-first sharing with OG cards (B-010 done, B-018).

### SNT — Sonett (blocked) · WMG — WedMeGood (blocked) · CNV — Canva (blocked)
robots.txt opts out the legacy Anthropic agent tokens (all three) and WedMeGood and Canva also answered HTTP 403; nothing usable was kept (D-026). Korean format lessons are covered by Barunson (`barunson/dossier.md`).

### GRV — Greenvelope (blocked) · MTD — Minted (blocked)
HTTP 403 to the first request (Greenvelope also on robots.txt): origin stopped, no fallback route (`_rea-playbook.md` §5). Only the 2026-10-29 longlist rows remain.

### EQX — Eqxiu (unreadable)
The homepage answered with a compressed body although the request did not advertise compression; the tool could not decode it and the page was not re-requested. Longlist row only (WeChat H5 invitations and marketing pages).

---

## Cross-profile insights (Tier B)
1. **Free publishing is common at the bottom of the market** (Wedew free forever, WebNikah free, Invitee RM 0, Biihappy free, Zola / The Knot free websites); paid value moves to messaging, check-in devices, events / languages, or services. Our "free drafting, paid publish" stance (ADR-O02) stays a deliberate choice, not a market default.
2. **Packaging axes differ by vendor:** guest quota (UVR), art direction (JNV), turnaround (SAN), events + languages (INE), messages + reception devices (WDW). Among the substantive profiles, only Invitee withholds RSVP below a paid tier (Free and Lite lack it; Plus RM 59 has it).
3. **QR check-in is already a low-price feature** (SMP at 49k, INE Plus, WDW packages) — supports moving B-024 forward once B-011 is decided.
4. **National QR gifts** (DuitNow, Vietnamese bank QR) mirror the QRIS opportunity (I-03, B-026).
5. **Honesty and privacy gaps recur:** 78–86 % anchors (SMP), customers' names on a homepage (WNK), film-studio-styled theme naming (JNV), wrong `lang` (SMP).
