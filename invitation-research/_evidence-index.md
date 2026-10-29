<!-- SUMMARY (first 7 lines — greppable) -->
# _evidence-index.md — every evidence ID cited in this research
> WHAT: ID scheme + index of captures (C-), HTTP observations (H-), probes (P-), secondary sources (S-). Claims elsewhere cite these IDs.
> STATUS: ACTIVE (append-only)
> OWNER: Oracle (research)
> DEPS: raw/_captures.csv (machine index of C- IDs), _rea-playbook.md
> GREP: evidence, capture, observed, source, C-, H-, P-, S-
> UPDATED: 2026-10-29

## ID scheme
| Prefix | Meaning | Where the artefact lives |
|---|---|---|
| `C-<COMP>-NNN` | Browser capture by `capture.mjs` (REA inspect + bundle, CDP structure pass, optional Lighthouse) | `raw/<competitor>/<id>.json` (summary, no copy/PII); `_private/rea|lh|thumbs/` for competitors; `raw/invitesion/<id>/` for our own pages |
| `H-<COMP>-NNN` | Single HTTP observation (curl headers/status/body grep) | Described here with command and result |
| `P-<COMP>-NNN` | Code/DB probe on our own instance | Described here |
| `S-<COMP>-NNN` | Secondary source (store listing, pricing page read, article, search result) | URL + access date here or in the dossier |
| `B-<COMP>-NNN` | Browser probe (session 06): a throwaway CDP script that inspects one competitor page for a specific question, structure only, no capture record | Script in git-ignored `_private/probes/`, result described here; screenshots only in `$INVITESION_PRIVATE_DIR/probes/` |
| `V-REA-NNN` | REA verification run (new instructions Step 0): command, REA version, Evidence IDs, verdict | `_rea-playbook.md` §7; compact summaries in `raw/_setup/rea-smoke-*.json`; full Evidence in `$INVITESION_PRIVATE_DIR/rea-smoke/` |
Tags used with IDs: [OBSERVED] [CLAIMED] [ESTIMATE] [INFERRED] [UNKNOWN] (rules in `_rea-playbook.md` §5).

Competitor codes: Tier A Indonesia IDI PLO SMO WEV VID ENV IVT INV KAT STM · Tier A international PPO RSV JOY PTF BRN · full list in `02-competitor-discovery/competitor-longlist.csv`.
`D-<CODE>` = demo-discovery run by `_tools/discovery/discover-demos.mjs` (link targets + short redacted labels only) → `raw/<competitor>/discovery-<CODE>.json`; the file's `observedAt` is the observation date.

## Demo discovery (D-) and secondary reads (S-), added session 03
| ID | When | What | Result |
|---|---|---|---|
| D-IDI, D-PLO, D-SMO, D-WEV, D-VID, D-ENV, D-IVT, D-INV | 2026-10-29 ≈ 06:25 WIB (session 02) | Homepage + best catalog page per competitor | Official demos: IDI 50 (`/preview/*`; 35 `/hasil/*?contoh` customer pages excluded, R1), INV 66, WEV 16, VID 13, ENV 7 (from candidates), IVT 4; PLO 0 (app landing, 4 anchors); SMO 0 (2 anchors in headless Chrome) |
| D-KAT | 2026-10-29 10:31 WIB | katsudoto.id → `/desain` | 61 demo-like links (official pattern not yet whitelisted) |
| D-STM | 2026-10-29 10:32 WIB | sitemu.id → `/product` | 0 demo links (needs manual catalog) |
| D-PPO | 2026-10-29 10:32 WIB | paperlesspost.com | No catalog detected, 0 links (needs manual pattern) |
| S-SMO-001 | 2026-10-29 10:29 WIB | Plain fetch (WebFetch) of https://satumomen.com/ | [OBSERVED] prices Basic Rp79.000 / 7 hari, Prioritas Rp199.000 / 90 hari, Premium 30 hari (price not in text); free trial 12 jam; 1 undangan = 20 credit points; Lifetime package mentioned. [CLAIMED] 500+ tema, 600+ musik (+SoundCloud), WhatsApp broadcast, QR check-in + "Layar Sapa", custom domain, RSVP form builder, video 3D, cetak, reseller 30 % |
| S-KAT-001 | 2026-10-29 10:40 WIB | Plain fetch of https://katsudoto.id/desain and one linked sample (`<couple>.katsudoto.id/<id>`) | [OBSERVED] vendor placeholder demo, not a customer: guest greeting "Hai Katsudoto", both partners' handles = `@katsudoto`, stock venue, patterned dummy account numbers. Catalog copy: all designs usable at no extra cost. Section sequence (structure only): cover + guest greeting → countdown → couple + parents + handles → quote → portrait gallery → event (holy matrimony, reception, venue, dress code) → live streaming → rundown → our story (3 chapters) → Instagram filter → wedding gift (bank accounts + transfer-proof upload) → video footage → thank-you. 49/61 discovery links match the sample pattern → queue B (6) |
| S-PLO-001 | 2026-10-29 10:29 WIB | Plain fetch (WebFetch) of https://paleo.id/ | [OBSERVED] app-install landing page, no web catalog; [CLAIMED] "Undangan Web Digital Nomor 1 Di Indonesia", 100+ tema premium, autoplay backsound, WhatsApp share, real-time editing, prewedding gallery |

## Session 04 additions (2026-10-29, times WIB)
| ID | When | What | Result |
|---|---|---|---|
| D-PPO (s04) | 11:18 | Re-run after the robots fix: paperlesspost.com → `/cards/category/holiday-invitations` | Allowed now; 358 + 583 links, 0 demo-shaped (card pages need a manual pattern) |
| D-JOY (s04) | 11:20 | Re-run: withjoy.com → `/cards/wedding/save-the-date` | Allowed now; 1 demo-shaped link |
| D-IDI (redacted, s04) | 11:24 | `_tools/safety/redact-discovery.py` on `raw/indoinvite/discovery-IDI.json` | 35 customer-showcase links (22 demos + 13 catalog candidates, `/hasil/<id>?contoh=1`) dropped, `customerShowcaseDropped: 35` kept; IDI queue picks verified unchanged |
| S-ENV-001 | 11:19 | WebFetch of https://enviory.com/ | [OBSERVED] plans and prices, 5-day trial, reseller ladder, payments, 18-theme catalog → `03-teardowns/enviory/dossier.md` §1 |
| S-ENV-002 | 11:20 | robots.txt + one plain fetch of the official full-preview demo | robots: `*` Allow, AI training crawlers Disallow; page: HTTP 403 Cloudflare JS challenge (not bypassed, R1) |
| S-KAT-002 | 11:23 | One robots-checked plain fetch per queued KAT demo (C-KAT-101…106), counts only | All 6 carry exactly 2 `@katsudoto` partner handles (vendor placeholder signature), no challenge → queue B cleared |
| S-INV-001 | 11:25 | One plain fetch per queued INV wrapper (`invi.id/tema/<slug>/?to=`) to read its iframe `src` | All 6 embed `demo.invi.id/<niche>/<slug>/?to=Nama%20Tamu` (robots-allowed) → `04-template-benchmarks/queues/queue-tier-a-4.tsv` |

## Invitesion (own instance, production build of 22ed99e, TZ=UTC, 2026-10-29 WIB)
| ID | When (WIB) | What | Result |
|---|---|---|---|
| C-INV-001 | 05:33 | Guest page `/i/budi-sari/budi-hartono` (ivory, WIB events) | LH mobile: Perf 94 / A11y 96 / BP 93 / SEO 60; LCP 2.60 s, TBT 186 ms, CLS 0; 19 req / 323 KB; 11 contrast failures |
| C-INV-002 | 05:34 | Guest page `/i/dimas-laras-makassar/nama-panjang` (gold-noir, WITA, 80-char name) | Perf 95; LCP 2.45 s; 16 contrast failures (1.64:1 on cards) |
| C-INV-003 | 05:35 | Template preview `/templates/eternal-ivory` | Perf 75; LCP 4.33 s; TBT 411 ms; 26 req / 356 KB |
| C-INV-004 | 05:37 | Marketing home `/` | Perf 88; LCP 3.61 s; TBT 130 ms; 62 req / 413 KB |
| H-INV-001 | 05:28 | `curl -D -` guest page headers | `Cache-Control: private, no-cache, no-store…`, `set-cookie: locale=id`, `x-nextjs-postponed: 1`, CSP report-only with nonce |
| H-INV-002 | 05:28 | Time strings in guest HTML | Akad 08:00+07 → "01.00 WIB"; resepsi 11:00–14:00+07 → "04.00 WIB – 07.00 WIB"; WITA 19:00+08 → "11.00 WIB" |
| H-INV-003 | 05:28 | Hostile guest name page | 0 raw `<script>alert`; name HTML-escaped (`&lt;img src=x onerror=alert(1)&gt;`) |
| H-INV-004 | 05:38 | `curl` of `cdn.jsdelivr.net/npm/@clerk/clerk-js@6/dist/clerk.browser.js` (the script our guest page requests) | 325,247 B raw; 70,709 B brotli |
| H-INV-005 | 05:30 | Browser-style request with `pk_test_` build | `307` → `…clerk.accounts.dev/v1/client/handshake`, `x-clerk-auth-reason: dev-browser-missing` |
| H-INV-006 | 05:45 | Unknown guest slug `/i/budi-sari/siti-aminah` | HTTP 200, streamed "Halaman tidak ditemukan", `robots: noindex` (soft 404) |
| P-INV-001 | 05:43 | `detailConfigSchema.safeParse(templates.default_config)` for every row | 64/64 fail, `unrecognized_keys: art` |

## Competitors
| ID | When (WIB) | Competitor | Kind | URL | Notes |
|---|---|---|---|---|---|
| C-WEV-001 | 05:21 | Wevitation | marketing | https://wevitation.com/ | Pipeline smoke test (jQuery/Bootstrap/Owl, Cloudflare Rocket Loader, GTM); 60 req / 903 KB |
| C-ENV-101 | 10:37 (s03) | Enviory | demo | https://enviory.com/tema/hydrangea/pratinjau | First batch-A capture: LH mobile Perf 61 / A11y 100 / BP 79 / SEO 92; LCP 2.92 s, **TBT 3,927 ms**, CLS 0.058; 75 req / 1,863 KB (JS 663, img 922, font 158); Next.js + Tailwind; section detector found 0 `<section>` blocks (div-based layout: tune the heuristic). Platform dev server was running, so re-check TBT before using it as a threshold |
| C-ENV-102…106 | 10:39–10:49 (s03) | Enviory | demo (**wrapper**) | `/tema/{rocaille,velora-linear,velora,aurelia,noctivelle}/pratinjau` | Preview wrapper + iframe (126–129 DOM nodes): Perf 57–64, A11y 100, LCP 2.11–3.60 s, TBT 4.3–5.8 s, CLS 0.058, 1.3–7.8 MB. Not threshold-grade (protocol §2.1) → guest pages queued as C-ENV-111…116 (`queue-tier-a-3.tsv`). C-ENV-101 above is a wrapper too |
| C-IDI-101 | s04 (retry) | Indoinvite | demo | queue A (`/preview/…`) | Real page: Perf 12, A11y 86, LCP 12.3 s; 117 req / 7.2 MB (CDP), 2.56 MB (LH); jQuery + Bootstrap; 569 images. The s03 attempt failed with a DevTools timeout during the VM freeze |
| C-INV-101 | s04 | INVI | demo (**wrapper**) | `invi.id/tema/adat-jawa/?to=…` | 23-node wrapper + cross-origin iframe → Lighthouse NO_FCP; superseded by C-INV-111…116 (`queue-tier-a-4.tsv`, S-INV-001) |
| C-IVT-101 | s04 | Invitato | demo | queue A | Perf 35, A11y 82, LCP 18.5 s; 97 req / 19.2 MB CDP (4.2 MB LH): media-heavy |
| C-VID-101 | s04 | Viding | demo | queue A | Real page, 12 sections; GSAP + ScrollTrigger + Owl + jQuery + Bootstrap; Perf 50, A11y 81, LCP 16.9 s; 91 req / 3.6 MB |
| C-WEV-101 → | s04 → | batch | demo | `queue-tier-a-rr.tsv` then `-2` (KAT), `-3` (ENV guest pages), `-4` (INV guest pages) | Sequential background batches; each row lands in `raw/_captures.csv`, `captures-summary.csv` is regenerated from `raw/*/C-*.json` (exact `capturedAt` inside each JSON) |

## Session 05 additions (2026-10-29; capture times WIB, from each JSON `capturedAt`)
Background queues B → C → D (started s04) finished after the s04 checkpoint, until the VM stopped at ≈ 12:01 WIB (05:01Z). 15 captures, all Lighthouse OK, all `wrapper=False` (`_tools/capture/summarize-captures.py`, regenerated s05). Queue files now live in `04-template-benchmarks/queues/`.

| ID | When (WIB) | Competitor | Kind | URL | Notes |
|---|---|---|---|---|---|
| C-KAT-102…106 | 11:32–11:39 | Katsudoto | demo (vendor placeholder, S-KAT-002) | `<couple>.katsudoto.id/<n>` (`queues/queue-tier-a-2.tsv`) | jQuery + AOS + Slick on all; C-KAT-102 adds GSAP + ScrollTrigger + anime.js + Swiper. Perf 6–30, A11y 74–82; LCP 11.1–47.3 s; TBT 3.2–10.8 s; CLS ≤ 0.007 except **C-KAT-105 0.57**; 92–178 req / 4.3–12.0 MB; 711–1,435 DOM nodes. With C-KAT-101: 6 threshold-grade KAT demos |
| C-ENV-111…116 | 11:41–11:50 | Enviory | demo (guest page) | `enviory.com/<demo-slug>?tpl={hydrangea,rocaille,velora-linear,velora,aurelia,noctivelle}` (`queues/queue-tier-a-3.tsv`) | Real guest pages, **no Cloudflare challenge** (page title = the vendor's demo invitation title, identical on all six, so the theme is not confirmed by the title). Next.js. Perf 36–45, **A11y 100**; LCP 4.9–56.4 s (C-ENV-112 6.8 MB); TBT 0.56–1.72 s (vs 3.9–5.8 s on the wrappers); CLS ≈ 0; 34–64 req / 1.3–6.8 MB. **C-ENV-112 (130 nodes) and C-ENV-113 (148) are ~⅓ the DOM of the other four (458–487)**: the [INFERRED] `tpl` slug may have fallen back or stopped at the cover; verify before using them in dossier §4 |
| C-INV-111…114 | 11:53–11:59 | INVI | demo (iframe target) | `demo.invi.id/<category>/<theme>/?to=Nama%20Tamu` (`queues/queue-tier-a-4.tsv`, S-INV-001) | WordPress + Elementor + jQuery + Swiper (C-INV-112 + Lottie). Perf 13–35, A11y 81–88; LCP 4.8–49.0 s; TBT 3.6–5.6 s; **C-INV-114 CLS 1.00**; 117–149 req / 1.9–9.5 MB; 558–1,134 nodes. C-INV-115/116 followed in s05 (next row) |
| C-INV-115, C-INV-116 | 01:19, 01:21 (30 Oct) | INVI | demo (iframe target) | `demo.invi.id/pernikahan/{white-lily,adat-art-bali}/?to=Nama%20Tamu` (`queues/queue-tier-a-4.tsv`) | s05 live run of the relocated pipeline (`_tools/capture/run-batch.sh`, queue D). WordPress + Elementor + jQuery + Swiper + Lottie. C-INV-115: Perf 5, A11y 97, LCP 19.9 s, TBT 2.6 s, **CLS 1.00**, 123 req / 2.1 MB, 13 sections. C-INV-116: Perf 32, A11y 82, LCP 21.0 s, TBT 2.4 s, CLS 0.006, 139 req / 2.6 MB, 2 sections. INVI now has 6 threshold-grade demos (C-INV-111…116) |

## Session 06 additions (2026-10-29; times UTC unless marked)
| ID | When | What | Result |
|---|---|---|---|
| V-REA-001…007 | 20:40–21:26 | REA re-verification (Step 0): version, doctor, web smoke on own guest page + viding.co, HAR route, Android procedure on the F-Droid client APK, `capture.mjs` with the REA driver | Command-level log with Evidence IDs: `_rea-playbook.md` §7; verdict: `00-setup/rea-verification.md` (13 PASS / 5 PARTIAL / 2 FAIL claims, all fixed; Android decompilation UNVERIFIED) |
| C-INV-005 | 04:03 WIB, 30 Oct (21:03) | Own guest page `/i/budi-sari/budi-hartono`, local production build (measurement variant, P-INV-010), first capture with REA driving the visit (= V-REA-007) | Driver `rea`, scenario 32/32 steps; LH mobile Perf 93 / A11y 96 / BP 96 / SEO 60; LCP 2.62 s, TBT 209 ms, CLS 0; 18 req / 296 KB (CDP), 321 KB (LH); 7 sections. Consistent with C-INV-001 |
| P-INV-010 | 20:49–20:58 | Production build with placeholder Clerk keys (`pk_live_`/`sk_live_` placeholders, `local-stack.sh`) | The first middleware-matched request never answers: `next-server` at 100–120 % CPU, RSS +570 MB within 15 s, curl timeout at 15 s (same with a resolvable frontend-API host). Same snapshot without `middleware.ts`: `/` 200 in 0.17 s, guest page 200 in 0.13 s → own-page measurement builds set `middleware.ts` aside (copy only). Retest with real keys before treating it as a product bug |
| H-INV-007 | 21:26 | Body-less HAR of the own guest page (V-REA-005) | The anonymous guest page requests Clerk's browser SDK: `clerk.browser.js` 6 attempts + `ui.browser.js` 1 attempt when the Clerk host fails. Cause: `ClerkProvider` wraps the root layout (`app/layout.tsx:40`). Production size: H-INV-004 |
| C-IDI-102…104, C-IVT-102/103, C-VID-102/103, C-WEV-102/103 | 21:39–21:57 | Batch A (`queues/queue-tier-a-rr.tsv`), first REA-driven competitor captures; the batch died in the 21:57 platform restart | IDI-102 / IVT-102 `rea+cdp-fallback` (REA aborted on its own cover click, fixed by D-014), the rest `rea` 32/32. **C-IDI-104 has no Lighthouse** (CDP timeout in `Page.captureScreenshot` during the restart; one retry added since). Cover clicked: VID-103 "Open the Invitation", WEV-102/103 "Buka Undangan"; missed before the wording fixes: VID-102, IVT-102/103 ("Tap to Open", "Tap the envelope…"). IDI `/preview/` = invitation inline under a vendor CTA bar (≈ 36k nodes), not a wrapper. Invitato `sectionCount` 0–1 (div layout) |
| C-ENV-117…121 | 22:06–22:17 | Enviory guest pages rocaille (117, 119, 121) and velora-linear (118, 120), re-captured because C-ENV-112/113 never opened their cover (`queues/queue-env-recapture.tsv`) | All five stayed on the cover (1 section, 130–150 nodes), each documenting one failure mode: 117 synthetic `el.click()` ignored; 118/120 control not matched (`aria-label="OPEN"`); 119 trusted click mid-intro; 121 trusted click on the settled control **during REA's scenario**. Lighthouse runs are valid cold-load evidence (Lighthouse never clicks): Perf 48–61, A11y 100 |
| C-ENV-122, C-ENV-123 | 22:22, 22:24 | Rocaille and velora-linear guest pages, first captures with the D-016 cover click (after REA's scenario, trusted, settled) | Both opened: `[aria] Buka undangan` / `[aria] OPEN`, method `trusted`, landing `inside`; 24 sections each, 561 / 605 nodes, 10,017 / 10,770 px. CDP transfer after scrolling the opened page: **27.5 MB** (rocaille) / 2.5 MB (velora-linear). LH Perf 54 / 57, A11y 100. These replace C-ENV-112/113 for structure; all eight stay valid for cold-load Lighthouse |
| B-ENV-001 | 22:01–22:13 | Probes on rocaille (`probe-cover`, `probe-scroll`, `probe-tap`, `probe-click2`) | Gate = `div[role=dialog][aria-label="Buka undangan"]` + photo-frame `button[aria-label="Buka undangan"]` without visible text; a 10+ s zoom-in intro (9 s: opacity 0, 624×815 px, ancestor on top; 15 s: 317×414 px, opacity 1); a trusted mouse click on the settled control opens 25 sections / 588 nodes / 10,017 px; synthetic click, wheel and swipe do not. Hydrangea control (`GateOverride…openBtn`, text "Buka Undangan") visible only after ≈ 10 s |
| B-ENV-002 | 22:19 | Probe on velora-linear (`probe-open-el`) | Control = wax-seal `<button aria-label="OPEN">` (no text, 85×88 px) inside `div[role=dialog][aria-label="Buka undangan"]` |
| S-KAT-003 | 05:11 WIB, 30 Oct | Homepage https://katsudoto.id/ read as a visitor (WebFetch) + `robots.txt` (allow all) + link list from one plain fetch | Three products (Undangan Website, Buku Tamu Digital with QR + selfie check-in and auto thank-you, Wedding Planner); counters 10,517 / 1,527 / 5,742; "berdiri sejak 8 tahun lalu"; Smart WhatsApp; Mitra 15 % commission; `/v2/` app links |
| S-KAT-004 | 05:12 WIB, 30 Oct | https://katsudoto.id/v2/package and https://katsudoto.id/undangan-lite read as a visitor | Tiers Rp 300k (1 yr) / Rp 500k / Rp 700k (forever), each full or self service; 24 priced add-ons incl. Smart WhatsApp + reminders Rp 1.000 per message; Lite flat Rp 100k → `03-teardowns/katsudoto/dossier.md` |
| S-INV-002 | 05:11 WIB, 30 Oct | Homepage https://invi.id/ read as a visitor (WebFetch) + one plain fetch of its HTML (prices, links) + `robots.txt` (only `/wp-admin/` blocked) | Trial Rp 0 (2 days), Plus Rp 198.000 / Premium Rp 298.000 list prices (`/checkout/{trial,plus,premium}`), public 50 % coupon (Premium rendered Rp 149.000); niches incl. walimatussafar; `/tools/` utility pages; counters 4,000+ / 40,000+ / 145+ / 3,000+ |
| S-INV-003 | 05:12 WIB, 30 Oct | https://invi.id/reseller/ read as a visitor | Reseller packs Rp 13.236–44.900 per invitation, resale floors Rp 39k–149k (deactivation below), white label + custom domains + client accounts, quotas never expire → `03-teardowns/invi/dossier.md` |
