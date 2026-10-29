<!-- SUMMARY (first 7 lines — greppable) -->
# REA playbook — how this research run observes competitors
> WHAT: Pinned REA install, exact commands, mission routing table, measurement protocol, limits and substitutes.
> STATUS: ACTIVE
> OWNER: Oracle (research)
> DEPS: SKILLS-LOCK.md (reverse-engineer-anything skill), _tools/capture/capture.mjs, 04-template-benchmarks/protocol.md
> GREP: rea, reverse engineering, cdp, lighthouse, har, apk, capture, politeness
> UPDATED: 2026-10-29

## 1. Pinned toolchain (verified 2026-10-29 05:00–05:25 WIB)

| Tool | Version / pin | How it was installed | Health check |
|---|---|---|---|
| REA (`rea-agents`) | **6.8.0** (npm), repo `morluto/rea` @ `21b192706d2d273baa9dd9de29c2afb77bd5955e` | `npm i rea-agents@6.8.0` in a tools dir **outside** the repo (README: "run package acquisition from a trusted directory outside the target project") | `rea doctor --json`: node ✔ (24.22.2), host ✔; hopper/ghidra/IDA/JADX/kuna ✘ (not needed for web work) |
| Node for REA | **24.22.2** (REA requires `^22.23.4 \|\| ^24.22.1 \|\| >=26.12.1`; the sandbox ships 24.16.0, which REA rejects) | official tarball `node-v24.22.2-linux-x64.tar.xz` | `node -v` |
| Browser | Chrome for Testing **156.0.8078.4** (Playwright `chromium-1248`) + AL2023 libs via `dnf` (nss, atk, mesa-libgbm, alsa-lib, …) | `npx playwright@1 install chromium` | `curl http://127.0.0.1:9222/json/version` |
| Lighthouse | **12.8.2** | `npm i lighthouse@12` (tools dir) | `lighthouse --version` |
| REA skill | `reverse-engineer-anything` (pinned, MODIFIED to call `rea-agents@6.8.0`) | `npx skills add morluto/rea --skill reverse-engineer-anything -a claude-code codex -y` | `.agents/skills/reverse-engineer-anything/SKILL.md` |

`npx -y rea-agents setup --yes` registers REA's MCP server and skill in the *operator's* agents (Claude Code, Codex, Cursor…) and edits their config with backups. It was **not** run in this sandbox: the research agent here cannot load new MCP servers mid-session, and the setup writes global agent config. Every REA call in this run used the **CLI**, which returns the same Evidence records (REA skill: "the CLI returns the Evidence record directly"). Owners who want MCP locally: `npx -y rea-agents@6.8.0 setup` (review the plan it prints), then `npx -y rea-agents@6.8.0 doctor`.

## 2. Commands that were actually used

```bash
# 0. One dedicated, loopback-only browser profile (REA attaches; it never launches or owns the browser)
chrome --headless=new --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 \
  --user-data-dir=/tmp/rea-browser-profile --password-store=basic --no-first-run --disable-dev-shm-usage \
  --window-size=412,915 --lang=id-ID about:blank &

# 1. Discover targets (endpoint must be http://127.0.0.1:PORT; "localhost" is rejected by REA)
rea list-browser-targets http://127.0.0.1:9222 --json

# 2. Passive page evidence: DOM inventory (node names + attribute NAMES, no values), a11y tree, scripts,
#    resources with sizes, attach-window network/console metadata, storage KEY names (values redacted)
rea inspect-web-page http://127.0.0.1:9222 <TARGET_ID> --observation-ms 1500 --json

# 3. Static bundle analysis without execution: chunk graph, route/endpoint candidates, vendor fingerprints
rea analyze-web-bundle http://127.0.0.1:9222 <TARGET_ID> --json

# 4. Visible-viewport PNG (we re-encode via CDP as WebP; competitor images stay in _private/thumbs)
rea capture-web-screenshot http://127.0.0.1:9222 <TARGET_ID> --json

# 5. A HAR saved by a human visitor (never fetched by REA; tokens excluded by REA's profile)
rea inspect-web-network-capture /abs/session.har har --json
rea inspect-web-network-capture /abs/session.har har --record 2 --json   # one record's request/response shape

# 6. Public APK (analysis only, never committed or redistributed — hashes + metadata only)
rea inspect-artifact /abs/app.apk --json            # member inventory, digests (no JADX needed)
rea identify-flutter-build /abs/app.apk --json      # Flutter vs native/WebView fingerprint (static)
rea inspect-android-package /abs/app.apk --json     # manifest/classes: needs headless JADX + JDK 17 (absent here)
```

`_tools/capture/capture.mjs` wraps steps 1–4 for one URL and adds what REA deliberately does not do (navigation, cover click, scroll, structure fingerprint, Lighthouse):

```bash
node invitation-research/_tools/capture/capture.mjs --id C-ENV-003 --competitor enviory \
  --kind demo --url https://… --open-cover --lighthouse
# → raw/<competitor>/<id>.json (summary, no copy/PII)   _private/rea/<id>/ (full Evidence)
# → _private/thumbs/<id>.webp                            _private/lh/<id>.json (full Lighthouse)
# → appends raw/_captures.csv (capture index; IDs are cited as [OBSERVED C-XXX-NNN])
```

## 3. Routing table for THIS mission

| Target | Primary tool | Exact entry point | Output we keep | Notes / limits |
|---|---|---|---|---|
| Competitor marketing site (home, pricing, catalog) | REA `inspect-web-page` + `analyze-web-bundle` via `capture.mjs` | `--kind marketing` / `--kind pricing` / `--kind catalog` | stack fingerprint, asset weight, third parties, Lighthouse | Pricing *numbers* are read by a human-style page read and tagged [OBSERVED] with the capture ID |
| Builder / dashboard flows | Normal browser session (agent-browser) for screens reachable **without** signup; REA `observe-web-session` while a human navigates | `rea observe-web-session … --observation-ms 20000` | step list, field inventory, timings | No automated signups (R1). Free-tier signup only if ToS allows, with throwaway identity, logged in `_open-questions.md` |
| Guest-facing invitation (public demo) | `capture.mjs --kind demo --open-cover --lighthouse` | one navigation, one cover click, progressive scroll | section sequence, interaction inventory, libraries, fonts, audio behaviour, metrics | No RSVP/wish submission, no repeated loads. Real-customer pages: do not store PII; redact notes |
| Public network/API shape | REA attach-window network metadata; HAR via `inspect-web-network-capture` | requests triggered by **normal page use only** | method, path template, param names, response *shape* (REA keeps paths/types, never values) | No probing, no replay, no enumeration |
| JS bundle reconstruction | `analyze-web-bundle` (+ `export-web-scripts` → `analyze-javascript-application` when deeper module graphs matter) | target from step 1 | framework + animation-library fingerprints, chunk graph | Source maps used only if publicly served; nothing is copied into our repo (R2) |
| Public Android APK | `inspect-artifact`, `identify-flutter-build`, `inspect-apk-signature`; `inspect-android-package` when JADX is available | local file from a public store listing | permissions, SDKs, framework, signer fingerprint, sizes | Never commit/redistribute; record SHA-256 + metadata only. JADX/JDK are not installed in this sandbox → manifest/class views unavailable here |
| Our own running instance | same `capture.mjs --own` | `http://localhost:3000/i/<slug>/<guest>` | same metrics, screenshots allowed in `raw/invitesion/` | Needs a seeded DB (see 01-codebase-audit/quality-audit.md) |

## 4. Measurement protocol (identical for competitors and Invitesion)

- Viewports: **412×915** (primary, DPR 2.625) and **360×800** (layout/overflow check); 390×844 in the harness gates.
- Lab metrics: Lighthouse 12 mobile, **simulated Slow 4G (150 ms RTT, 1.6 Mbps down) + 4× CPU slowdown**, cold profile per run, Android Chrome UA. Records LCP, CLS, TBT (INP proxy in lab), FCP, SI, bytes by type, request count, third parties, font-display issues, a11y failures.
- Structure pass (CDP, unthrottled, cache disabled): bytes by resource type, protocols, script/font hosts, libraries (globals + DOM markers), section sequence, buttons/labels (≤60 chars, digits redacted), audio elements and autoplay attributes, iframes (maps/video hosts), feature heuristics (cover gate, countdown, RSVP, wishes, gift, copy button, maps, calendar, livestream, QR, timezone labels, watermark).
- Stress items run by the harness on our templates (and spot-checked on competitors when the demo accepts a name parameter): long names ("Muhammad Fadhlurrahman Al-Ghifari & Putri Anindya Maharani Kusumawardhani"), Arabic/RTL block, hostile guest names, WIB/WITA/WIT labels.
- In-app browsers (WhatsApp/Instagram): emulated by UA only in this sandbox; true WebView autoplay/gesture behaviour needs a physical Android device → logged as [UNKNOWN] unless observed on-device.

## 5. Politeness and ethics (R1, R2, R8)

- `capture.mjs` checks `robots.txt` (User-agent `*`, longest-match Allow/Disallow) and spaces requests to one origin ≥ 1.5 s; one page at a time; Lighthouse runs are spaced the same way.
- No logins, purchases, form submissions, RSVP/wish posts, captcha or paywall bypass, watermark removal, rate-limit evasion.
- Competitor HTML/CSS/JS/images/fonts/audio/copy never enter the repo; only measurements, structure blueprints and our own words.
- Every claim is tagged [OBSERVED capture-id + URL + date] / [CLAIMED] / [ESTIMATE source+date] / [INFERRED confidence] / [UNKNOWN].

## 6. What REA cannot do here, and what was used instead

| Gap | Why | Substitute |
|---|---|---|
| Navigate, click, scroll | REA's web tools are passive by design ("not a general browser automation surface"); `capture_browser_scenario` is MCP-only | CDP over WebSocket inside `capture.mjs` (one navigation, optional cover click, scroll) |
| Throttled performance metrics | Not an REA feature | Lighthouse 12 mobile simulate |
| Android class/manifest decompilation | JADX + JDK not installed in this sandbox | `inspect-artifact` / `identify-flutter-build` static views; Play Store listing text for permissions |
| iOS apps, App Store binaries | No binaries obtainable without a device | Store listing only |
| True in-app WebView behaviour | No device | UA emulation + [UNKNOWN] tag |
| MCP prompts / retained evidence views | MCP server not registered in this sandbox | CLI with full inline Evidence saved to `_private/rea/` |
