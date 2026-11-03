<!-- SUMMARY (first 7 lines — greppable) -->
# 12-decision-log.md — architecture and research decisions (ADRs) for the Invitesion masterplan
> WHAT: ADRs with context, options, decision, consequences, confidence and revisit triggers. Short decisions D-001… live in `../_progress.md`; this file holds the decisions the masterplan depends on.
> STATUS: **FINAL v1** (session 09, 2026-11-03; masterplan final). ADR-W1 **decided** (s08), fallback met → planning gate met through ADR-W1 (reduced confidence, not literal Wave 1). Owner-question ADRs **ADR-O01…O07 accepted autonomously** in s08 as safe, reversible defaults with revisit triggers (the owner can override any of them). **ADR-A1** (s09): keep the Next.js stack, measured.
> OWNER: Architect (research agent acting autonomously, brief 03 §5.1)
> DEPS: ../_handoff/review-20261101.md §2, ../_open-questions.md §B, ../_evidence-index.md, ../04-template-benchmarks/benchmark-exclusions.csv, ../03-teardowns/*/dossier.md; owner instructions supplied outside the repository; code at `2c94140`: lib/invitation/{detail-config,create,template-sync,templates}.ts, lib/pricing.ts, app/marketing-copy.ts, app/globals.css, app/layout.tsx
> GREP: adr, decision, wave 1, ADR-W1, planning gate, reduced confidence, fallback, revisit
> UPDATED: 2026-11-03

## ADR-W1 — Wave-1 reduced-confidence fallback for competitors without safe public demos
**Status:** DECIDED 2026-11-03 (session 08); fallback requirements met 16:54Z → planning gate met through ADR-W1 · **Type:** reduced-confidence exception, **not** literal satisfaction of strict Wave 1 · **Authority:** brief 05 §14 ("If the bounded search confirms unavailable or insufficient safe public demos, this prompt authorizes ADR-W1").

### Strict requirement
Strict Wave 1 (brief 03 §14, brief 05 §14): a dossier **and at least three valid demo captures** for each of the eight highest-scoring Indonesian competitors (Indoinvite, PALEO, Satu Momen, Wevitation, Viding, Enviory, Invitato, INVI.ID), plus dossiers for the five international competitors (Barunson, Paperless Post, RSVPify, Joy, Partiful). A valid demo = a cold-load-eligible unique theme of a verified placeholder guest page (D-008, D-023).

### Blocked competitors and missing evidence
| Competitor (rank) | Valid demos | Why none are capturable | Evidence |
|---|---|---|---|
| Indoinvite (1) | 0 | Every demo-shaped public surface is one of: SEO article + theme catalog pages (`/preview/contoh-undangan-online-*`, D-020); catalog "Preview" links into sample accounts (`/s/<account>/undangan/<theme>?…&contoh=1`) that render a **real event** (S-IDI-003; not revisited, brief 05 §8); customer showcases (`/hasil/*?contoh`, dropped since s04); video-invitation samples that open as JavaScript modals (S-IDI-004); a design-service page (S-IDI-005) | D-IDI, S-IDI-001…005 |
| Satu Momen (3) | 0 | 96 public theme previews exist (`/preview/<theme>`, S-SMO-003), but **3 of 3 wedding previews checked render personal data** (realistic full names with parents, an official rank title, a street address, personal Instagram handles): not placeholders under D-008, so none may be captured. Checking further themes one by one would mean reading more real people's data | S-SMO-001…004 |
| PALEO (2) | 0 | App-first: the homepage links only to the Play Store and social accounts; no web catalog or demo in s02 discovery, s03 read or the s08 pass. Android analysis is limited to store metadata (D-013: no redistributable APK) | D-PLO, S-PLO-001/002 |

### Existing searches and the final focused pass
- s02 discovery (2026-10-29): IDI 50 `/preview/*` (later reclassified), 35 customer pages excluded; PLO 0 (4 anchors); SMO 0 (links hidden from headless Chrome).
- s03 visitor reads: S-SMO-001 (homepage), S-PLO-001 (homepage). s07: S-IDI-001…003 (robots, wedding catalog, one catalog preview = real event → stopped).
- **s08 focused pass (2026-11-03, 16:34–16:37Z, one request at a time, robots first):** IDI `/contoh/undangan-online-video` and `/contoh/undangan-jasa-desain` (the only demo-shaped IDI pages never read); SMO `robots.txt`, `/tema` (plain fetch, no challenge) and three wedding previews for D-008; PLO `robots.txt` and homepage. Sources and results are indexed in `../_evidence-index.md` (session 08).

### Why further attempts are unproductive or out of scope
- IDI: the remaining routes are account-based previews of real events or customer showcases; brief 05 §8 forbids revisiting them, and D-020 forbids capturing them.
- SMO: the public previews carry real-looking personal data; continuing would mean inspecting more personal events (brief 05 §13 stop condition). Signup to build a demo of our own would violate the no-signup rule (brief 03 §5.2).
- PLO: no web surface exists; app decompilation of a store APK is outside D-013.
- Repeating an equivalent search with another tool (reader, headless browser, search engine) is explicitly not allowed (brief 05 §13).

### Decision
Proceed to planning through ADR-W1 once its fallback requirements are met:
1. Dossiers for all eight Indonesian competitors (IDI, PLO and SMO from public, non-personal evidence: marketing, pricing, catalog structure, store listings).
2. Dossiers for all five international competitors.
3. At least three valid demos wherever enough permitted official demos exist (met: WEV 6, ENV 6 themes, INV 6, IVT 4, VID 3).
4. Where fewer exist: all safely available eligible samples plus this exception (IDI, PLO, SMO: 0 each).
5. Confidence limits recorded per affected conclusion (below and in each dossier).
6. Exclusions fully respected (`benchmark-exclusions.csv`, enforced by `eligibility.py`).
7. No invalid sample counted to improve coverage.

### Affected conclusions and confidence
- **Guest-page quality benchmarks** (performance, structure, interaction) rest on 5 of the top-8 Indonesian vendors (WEV, VID, ENV, IVT, INV) plus KAT and BRN as context: confidence **medium** for "typical Indonesian premium/DIY guest page", **low** for the mass-market DIY leaders IDI and PLO, whose guest pages are unmeasured.
- **Feature coverage** for IDI, SMO and PLO comes from vendor claims, catalog structure and non-identifying observations (e.g. IDI guest-side gift commerce, SMO check-in system, PLO app features): tagged [CLAIMED] or [OBSERVED marketing] and never treated as measured guest-page behaviour.
- **Pricing and positioning** are unaffected (public pages).

### Revisit triggers
- Indoinvite publishes a placeholder demo (e.g. a dedicated sample account with fictional data) → capture under new ids (D-018) and revisit the IDI rows.
- Satu Momen's previews switch to fictional sample data on a re-read during a later session (one page at a time, D-008).
- PALEO launches a public web catalog or demo, or a redistributable APK.
- The owner supplies consented sample invitations for any of the three.

### Gate reporting (kept separate)
| Gate | Status 2026-11-03 |
|---|---|
| Strict Wave 1 | **NOT MET** (valid demos 5/8 Indonesian: IDI, PLO, SMO have 0; dossiers 8/8; international dossiers 5/5) |
| Planning gate | **MET through ADR-W1** at 2026-11-03T16:54Z (not met literally). Fallback items: 1 ✅ eight Indonesian dossiers (IDI, SMO, PLO labelled "no guest-page measurement"); 2 ✅ five international dossiers (`../03-teardowns/{barunson,paperlesspost,joy,rsvpify,partiful}/`); 3 ✅ ≥ 3 valid demos for WEV, ENV, INV, IVT, VID; 4 ✅ IDI, PLO, SMO at 0 with this exception; 5 ✅ confidence limits above and in each dossier; 6 ✅ exclusions enforced by `eligibility.py` + guard; 7 ✅ no invalid sample counted |

---

## Owner-question ADRs (Q-O01…Q-O07), accepted autonomously in session 08
Brief 05 §16 makes these routine decisions: choose safe, reversible options, record revisit triggers, continue. None of them invents credentials, analytics, measurements, legal confirmation, consent or approval. Code facts were verified against `2c94140` on 2026-11-03. Product changes they imply are **P0 candidates for the masterplan**, not implemented here (brief 05 §15: P0 starts after masterplan finalization).

### ADR-O01 — Template art is template-owned; invitation config stays strict (Q-O01)
- **Status:** ACCEPTED (s08) · **Confidence:** high (runtime-verified defect).
- **Context [OBSERVED]:** `detailConfigSchema` (`lib/invitation/detail-config.ts`) is `.strict()` at the top level and has no `art` key; a runtime check returns `unrecognized_keys: ["art"]` for `{ art: {…} }`. `template-sync.ts` writes `defaultConfig = { ...preset, art }` for every catalog template, and `create.ts` keeps the template defaults only `if (parsed.success)`, so **every invitation created from a catalog template starts from `{}`** and loses its preset (palette, sections, copy). `templates.ts:361` parses the same way.
- **Options:** (a) add `art` to the invitation schema (copies shared asset sets into every invitation); (b) split `art` from the preset before validation and resolve art by template; (c) move `art` to its own template column; (d) make the schema permissive (rejected: loses validation of user config).
- **Decision:** (b) now, (c) as the follow-up: validate `{ ...preset }` without `art`, keep `art` template-owned and resolved through `template_id`; the strict invitation schema stays. An optional per-invitation `artOverride` key may be added later (additive).
- **Consequences:** P0 fix in `create.ts` (and the `templates.ts:361` parse) with a regression test "catalog template → created invitation keeps preset keys". Existing invitations are **not** rewritten automatically (their config may already hold user content); a host-triggered "re-apply theme defaults" is the safe repair path.
- **Revisit:** the renderer needs per-invitation art edits → introduce `artOverride`; template art moves to a CDN manifest → (c) becomes the column/manifest reference.

### ADR-O02 — `lib/pricing.ts` is the price source of truth; marketing must show it (Q-O02)
- **Status:** ACCEPTED (s08) · **Confidence:** high on the conflict, medium on future packaging.
- **Context [OBSERVED]:** `lib/pricing.ts` charges IDR 149,000 (standard) / 299,000 (premium), one-time, 12 months active (F-064, F-085). The homepage and `/pricing` show a single **"Rp0"** plan with a **"GRATIS"** badge ("Mulai tanpa biaya") and no paid price, while the same copy says "bayar satu kali". Market bands from the dossiers: Indoinvite Rp 39–119k with no expiry, Satu Momen Rp 79k (7 days) to 199k (90 days), Viding Rp 300–850k.
- **Options:** (a) keep code prices and show "free to start, Rp 149k / 299k to publish"; (b) create a real free tier; (c) re-price now.
- **Decision:** (a). The marketing pages read the figures from `lib/pricing.ts`; "free" may only describe what is free (drafting and preview before the paid publish gate, F-075). Price levels and packaging (e.g. an entry tier against Indoinvite's band) are decided in masterplan chapter 11 with the dossier evidence, by changing `lib/pricing.ts` only.
- **Consequences:** P0 copy fix in `app/page.tsx`, `app/pricing/page.tsx`, `app/marketing-copy.ts`; a test that the rendered price equals `priceFor()`.
- **Revisit:** owner sets final prices or approves a free tier.

### ADR-O03 — Payments stay acquirer-agnostic until a PJP contract exists (Q-O03)
- **Status:** ACCEPTED (s08) · **Confidence:** high for the approach; the vendor choice is the owner's.
- **Context [OBSERVED]:** QRIS checkout is partial with no acquirer and manual confirmation (F-081, F-086); Stripe exists for non-IDR (F-083); webhooks are routed per rail (`app/api/payments/[rail]/webhook/route.ts`). Indonesian competitors accept cards, bank VAs, e-wallets, QRIS, retail outlets and paylater through aggregators (S-IDI-006; Xendit markers S-IDI-003).
- **Decision:** keep the rail interface; no acquirer is chosen and no credential is created; manual confirmation remains the production fallback. Selection criteria for the owner: Bank Indonesia-licensed PJP, dynamic QRIS plus VA and e-wallets, signed webhooks with idempotency keys, refund and settlement APIs, a sandbox, transparent fees, Indonesian data handling. A sandbox adapter is built only once sandbox keys are supplied.
- **Revisit:** owner signs with a PJP or supplies sandbox credentials; gift money (F-022) needs custody/legal review before any money is held.

### ADR-O04 — Religious text only from an approved, sourced corpus (Q-O04)
- **Status:** ACCEPTED (s08) · **Confidence:** high.
- **Context [OBSERVED]:** three template presets in `lib/invitation/templates.ts` (quote blocks at lines 191, 228, 283) carry Qur'an translations of unknown provenance (QA-015, F-029). Hard rule: no agent writes or edits scripture from memory.
- **Decision:** (1) a corpus file with source, translation/edition, licence or permission, verifier and date per entry (path fixed in masterplan chapter 08); (2) until an entry is verified, new invitations get **no quote block** from these presets (omitted, not paraphrased); existing invitations are untouched (user content); (3) the template harness fails any template whose religious text is not in the corpus.
- **Consequences:** P0 preset change (reversible by re-enabling verified entries); corpus instructions in the harness skill.
- **Revisit:** owner supplies an approved corpus (e.g. a licensed official Indonesian translation).

### ADR-O05 — Keep the product brand; template style evolves per theme (Q-O05) — "ADR-STYLE-001"
- **Status:** ACCEPTED (s08) · **Confidence:** medium (taste decision, reversible).
- **Context [OBSERVED]:** `app/globals.css` sets `--primary: #e80053` (brand-600, ring); `app/layout.tsx` loads Manrope (sans) and Instrument Serif (display) via `next/font`. The archived `tokens.css` is never imported, so style documents must cite `globals.css`.
- **Decision:** keep the rose/magenta editorial identity for marketing and dashboard. Templates own their palettes, type and motion ("style DNA" per theme) and evolve toward motion and 3D only with reduced-motion and low-end fallbacks (F-037, F-038) inside the guest-page weight budget.
- **Revisit:** owner rebrand or brand research.

### ADR-O06 — Plan for Vercel functions in `sin1`, no invented analytics (Q-O06)
- **Status:** ACCEPTED (s08) · **Confidence:** medium (deployment facts are the owner's).
- **Context [OBSERVED]:** no `vercel.json` and no region setting in the repo; Node runtime on the upload, payment-webhook and media routes; database provider and region unknown; no analytics access.
- **Decision:** the architecture chapter assumes Vercel with functions in `sin1` (closest region to Indonesia), co-located with the database region the owner chooses; the agent does not deploy or change project settings. Latency and cost models use lab measurements and public price lists only; **no traffic or conversion figures are assumed**. Analytics stays an owner input (privacy-preserving, per-invitation open counts F-059 first).
- **Revisit:** owner provides the hosting/database region, a traffic history or analytics access.

### ADR-O07 — No history rewrite by the agent; keep current minimisation (Q-O07)
- **Status:** ACCEPTED (s08) · **Confidence:** high.
- **Context [OBSERVED]:** residual exposure in research history (`4794846`, `a5e119c`, `0ddd953`) and the platform commit `e1a693b` (`../00-setup/privacy-hygiene.md` §4); brief 05 §16 forbids history rewriting and force-push. `discovery-KAT.json` keeps vendor-labelled "Lihat Preview" links whose sampled pages carry the placeholder signature (S-KAT-001/002).
- **Decision:** no rewrite and no further deletion of `discovery-KAT.json`; all new evidence follows D-015/D-017/D-021 at capture time and in the guard. Any rewrite is an out-of-band owner action using the steps in `privacy-hygiene.md` §4.
- **Revisit:** owner approves or performs a rewrite; a sampled Katsudoto subdomain turns out to be a real couple → drop the unverified links.

## Architecture ADRs (session 09)

### ADR-A1 — Keep the Next.js stack; no Rust service now; fix the render path inside Next.js
- **Status:** ACCEPTED (s09, 2026-11-03) · **Confidence:** medium (lab spike on one 2-vCPU host; effects are far larger than the round-to-round spread, but production CPU, network, compression, middleware and database distance differ).
- **Context [OBSERVED]:** s08 left a Next-only run and an unfinished Rust run. s09 fixed the spike tooling (validity thresholds, failing exit codes, per-PID sampler, database snapshots) and ran a matched comparison in two rounds with reversed order: the product page (`next`), a Next.js route doing the product's loader once with minimal HTML (`next-min`), and the Axum spike doing the same queries with the same minimal HTML (`rust`); same database, fixture, pool size 10, warm-up and workload (`../08-backend-rust-plan/spike/`). Round 1: read spike 36 / 242 / 1,156 req/s; server CPU per page ≈ 30 / 4 / 0.3 ms; at 1,156 req/s Postgres used 112 % of a core and Rust 39 %. RSVP burst 261 / 359 / 1,439 req/s with RSVP events equal to accepted writes on every arm. The view-dedupe race (duplicate VIEW rows) and the allowance overwrite reproduced on every arm. The product page also calls the loader twice per request and answers 200 for unknown guests. A snapshot-only variant with the loader in React `cache()` (two rounds) left server CPU per page at 25–31 ms (within the spread) and cut Postgres CPU per page from ≈ 3.1–3.2 to ≈ 2.0–2.2 ms: the server cost is the full template render (≈ 85–90 %), not the duplicate load.
- **Options:** (a) keep Next.js and fix the render path; (b) a Rust service for the guest page behind the same URL (strangler); (c) rewrite the backend in Rust.
- **Decision:** (a). (b) is deferred behind explicit triggers; (c) is rejected (no measured need, duplicates every domain rule, cannot render the React template system).
- **Consequences:** B-014 (cached invitation-level render with per-guest parts rendered per request, one loader call for the database, no Clerk / locale cookie on `/i/*`) is the performance lever, measured against the spike (target ≤ 2 × the `next-min` server CPU); B-017a makes view tracking atomic; B-007 and B-011 stay P0; telemetry (`../08-backend-rust-plan/README.md` §6) precedes any further performance claim; the spike stays as test equipment, not product code; the project skill `invitesion-rust-backend` (no vetted third-party Rust skill is locked) records the triggers, the measurement method and the rules for an incremental service, so a future agent does not start a rewrite without them.
- **Revisit:** telemetry after B-014 shows guest-page CPU dominating cost or p95 above the SLO while the database has headroom; a non-React hot path appears (venue QR check-in with offline sync, webhook fan-out, bulk WhatsApp sending); the database stops being the limit (pooler, replicas) and runtime CPU is what remains.
