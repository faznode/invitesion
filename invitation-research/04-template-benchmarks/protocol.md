<!-- SUMMARY (first 7 lines — greppable) -->
# protocol.md — one measurement protocol for competitor demos AND Invitesion pages
> WHAT: exactly what `_tools/capture/capture.mjs` + Lighthouse do today, what the prompt requires beyond it, and how results become parity thresholds.
> STATUS: ACTIVE (v1.1, session 04, 2026-10-29: §2.1 wrapper rule; capture settings unchanged since v1). Changes to capture settings must bump the version here and be noted per capture.
> OWNER: research agent
> DEPS: `_tools/capture/capture.mjs`, `_tools/capture/run-batch.sh`, `_tools/capture/summarize-captures.py`, `../_rea-playbook.md`
> GREP: protocol, lighthouse, throttling, viewport, parity, threshold, blueprint

## 1. Run order (sequential only)
`_tools/discovery/discover-demos.mjs` → `_tools/discovery/select-demos.py` → `_tools/capture/run-batch.sh <queue.tsv>` → `_tools/capture/summarize-captures.py` → blueprints → tier aggregates.
Never run two captures, or a capture and discovery, at the same time: Lighthouse simulation is computed from the observed trace, so CPU contention inflates TBT/LCP. Note in the session file whether the platform dev server (:3000) was running.

## 2. What one capture does (v1, as implemented)
| Step | Setting |
|---|---|
| Politeness | `robots.txt` fetched with the Android UA; disallow → capture skipped and logged. ≥ 1.5 s between requests the tool makes to one origin. One navigation per pass, no forms, no login (R1, R8). |
| Browser | Chrome for Testing 156.0.8078.4 (Playwright build 1248), headless, CDP on 127.0.0.1:9222, fresh profile per sandbox. |
| Emulation (structure pass) | Android Chrome UA, `Accept-Language: id-ID,id;q=0.9,en;q=0.6`, viewport **412×915**, DPR 2.625, mobile, HTTP cache disabled. |
| Interaction | Wait for `load` (≤ 45 s) + settle (default 5 s) → fingerprint "before open" → with `--open-cover` click the first element whose text matches `buka undangan / open invitation / lihat undangan / buka` and wait 2.5 s → 14 scroll steps of 0.85 viewport with 700 ms pauses → back to top → fingerprint "after open". |
| Fingerprint | Section count/heights (headings redacted), animation/UI libraries via globals and script URLs (gsap, ScrollTrigger, AOS, animate.css, Lottie, Swiper, Owl, jQuery, three.js…), fonts loaded, audio/video elements, music control, maps, countdown, gift/transfer, QR, OG tags, `prefers-reduced-motion` CSS, DOM size. |
| REA | `inspect-web-page` (DOM/resources/network window) and `analyze-web-bundle` (chunks, routes, vendor fingerprints); evidence IDs stored in the summary. |
| Screenshot | WebP q55, 412 px wide (DPR 1). Competitors → `$INVITESION_PRIVATE_DIR/thumbs/` only (R7); Invitesion → `raw/invitesion/<id>/`. |
| Lighthouse | 12.8.2, `--form-factor=mobile`, screen 412×915 @ 2.625, `--throttling-method=simulate` (Lighthouse mobile defaults: Slow-4G-class 150 ms RTT, 1.6 Mbps down, **4× CPU**), Android UA, categories performance / accessibility / best-practices / SEO, own fresh Chrome instance (= cold cache). `configSettings.throttling` and `screenEmulation` are stored in every summary. |
| Output | `raw/<competitor>/<id>.json`: measurements + structure only, no page copy or names (R1/R2). Row appended to `raw/_captures.csv`. |

### 2.1 Guest page, not a preview wrapper (v1.1, session 04)
Some vendors' official "demo" links open a **preview wrapper**: a small page (theme switcher, CTA) that embeds the real invitation in an iframe. Lighthouse FCP/LCP are main-frame metrics, so a wrapper either measures the shell (Enviory: 126–129 DOM nodes, same-origin iframe, C-ENV-101…106) or nothing at all (INVI: 23 nodes, cross-origin iframe on `demo.invi.id`, Lighthouse `NO_FCP`, C-INV-101).
- Rule: if the top document has **< 200 DOM nodes and an iframe on the vendor's own site** (same host or subdomain), `summarize-captures.py` sets `wrapper=True`. Wrapper captures never feed blueprints, tiers or thresholds.
- Re-target to the wrapper's own iframe `src` (one plain fetch of the wrapper HTML, or the vendor's "Full Preview" link from discovery) with new IDs (+10): ENV → `queue-tier-a-3.tsv` (C-ENV-111…116), INV → `queue-tier-a-4.tsv` (C-INV-111…116).
- If the guest page sits behind a bot challenge for plain clients (Enviory, S-ENV-002), observe it only through the real browser; never solve or evade a challenge (R1). A captured challenge page is discarded.
- `run-batch.sh` re-attempts any ID whose Lighthouse run failed. A deterministic failure (e.g. `NO_FCP` on a wrapper) must be fixed by re-targeting, not by repeated retries.

## 3. Required by the prompt but not yet automated (add in this order)
1. **360×800 pass**: second Lighthouse run per demo at 360×800 (budget allowing), at minimum a layout screenshot.
2. **In-app browsers**: re-run the structure pass with WhatsApp and Instagram Android WebView UAs; record audio `paused` state before/after the cover click (autoplay unlock), and any "open in browser" interstitial.
3. **Long-name stress** where the vendor's own guest-link parameter exists (e.g. `?to=`): one navigation with `Muhammad Fadhlurrahman Al-Ghifari & Putri Anindya Maharani Kusumawardhani` as the guest name; record overflow/truncation from the screenshot. This is normal page use.
   **Hostile-name (XSS) tests run only against our own instance.** Security probing of third-party sites is out of scope (R1).
4. **Arabic/RTL block** handling: note `dir`/`lang` attributes and the font used on Arabic text when a demo contains it (never copy the text).
5. **Timezone labels**: record whether event times carry WIB/WITA/WIT and whether the label follows the venue.
6. **Fonts + licence**: map each font file/family to its licence. Google Fonts → OFL/Apache via `.agents/skills/ui-ux-pro-max/data/google-font-licenses.json`; anything else is UNKNOWN until verified.
7. **INP**: not measurable in Lighthouse navigation mode; TBT is the lab proxy. Record that limitation in every threshold that uses it.

## 4. Tier labelling and aggregation
- Every queued demo gets a tier (`basic | premium | signature`) from the vendor's own catalog label or price, with an evidence ID, in `tiers.csv` (`capture_id,tier,evidence`). Unlabelled demos are `unknown` and excluded from tier thresholds.
- `tier-aggregates.csv`: per tier and metric, **median, p75, best-in-class** over competitor demos with `lh_ok=true`. Metrics: perf, a11y, LCP, CLS, TBT, request count, total KB, JS KB, image KB, font KB, media KB, font files, third-party hosts.
- Parity threshold for the harness (Phase 7.6) = the tier median per metric (lower is better for time/bytes; higher for scores). "Beyond" = better than p75. Thresholds record `n` and the capture IDs used.

## 5. Blueprints (structure and measurements only)
`blueprints/<capture-id>.md`: section sequence, component types, interaction patterns, motion character and parameters (durations, easings, triggers — from REA bundle evidence and observation), layout grid, type pairing (family names only), palette logic (described, not sampled into our repo), imagery style, Indonesian copy conventions (described, never quoted at length), asset budget from the summary. No competitor HTML/CSS/JS, images, fonts, audio or copy (R2).
