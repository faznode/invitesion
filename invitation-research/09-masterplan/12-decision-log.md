<!-- SUMMARY (first 7 lines — greppable) -->
# 12-decision-log.md — architecture and research decisions (ADRs) for the Invitesion masterplan
> WHAT: ADRs with context, options, decision, consequences, confidence and revisit triggers. Short decisions D-001… live in `../_progress.md`; this file holds the decisions the masterplan depends on.
> STATUS: **2026-11-07: ADR-O13 removes GitHub workflows; sandbox checks required before transfer.** **s28 (2026-11-06): D-043 (R-03 RSVP through the Rust API), D-044 (R-04 wishes: moderation, replies, visibility) and D-045 (B-009 music and the cover gate) added.** **s26 (2026-11-06): five decisions added:** ADR-O11 (owner sequencing: research, then the final masterplan, then the upgrade; ADR-O08 superseded for sequencing only), ADR-O12 (owner: RQ-COMP-04 / -05 qualified by availability, strict counts 13 / 21 and 4 / 15 kept; the research gate passes as qualified), ADR-A2 (Rust as the authoritative backend, one data domain at a time), ADR-F1 (Next.js stays the frontend) and D-041 (legacy contrast INCOMPLETE stays INCOMPLETE; legacy frozen for compatibility). ADR texts W1, O01…O10 and A1 are unchanged. **s25 (2026-11-06): extended to current decisions:** ADR-A1 outcome (D-039; the ADR stands, no revisit trigger fired), a table of the product decisions since s14 (D-034…D-040) and Q-D17 (Q-O11 resolved, s25), and the owner's s25 deferrals (DA-01 / DA-02, not ADRs). ADR texts W1, O01…O10 and A1 are unchanged. Earlier: verified s10 (2026-11-04; v1 s09). ADR-W1 **decided** (s08), fallback met → planning gate met through ADR-W1 (reduced confidence, not literal Wave 1). ADR-W1 is the historical authorization to plan with reduced confidence; it is **not** the missing evidence and does not close any research requirement (strict Wave 1 stays NOT MET, RQ-DEMO-01). Owner-question ADRs **ADR-O01…O07 accepted autonomously** in s08 as safe, reversible defaults with revisit triggers (the owner can override any of them). **ADR-A1** (s09): keep the Next.js stack, measured. s10 additions: Viding coverage 3 → 6 themes, D-026 / D-027, open owner question Q-O08 (§ "Session 10 decisions"). s12 decisions D-030 / D-031 entered and verified in s13 (§ "Session 12 decisions"); s13 decision D-032 (measurement profiles, § "Session 13 decisions"); open owner questions Q-O08 (residual), Q-O09, Q-O10.
> OWNER: Architect (research agent acting autonomously, brief 03 §5.1)
> DEPS: ../_handoff/review-20261101.md §2, ../_open-questions.md §B, ../_evidence-index.md, ../04-template-benchmarks/benchmark-exclusions.csv, ../03-teardowns/*/dossier.md; owner instructions supplied outside the repository; code at `2c94140`: lib/invitation/{detail-config,create,template-sync,templates}.ts, lib/pricing.ts, app/marketing-copy.ts, app/globals.css, app/layout.tsx
> GREP: adr, decision, wave 1, ADR-W1, planning gate, reduced confidence, fallback, revisit, D-039, D-040, Q-D17, deferred, D-043, D-044, moderation
> UPDATED: 2026-11-07 (ADR-O13; s28 history retained)

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
3. At least three valid demos wherever enough permitted official demos exist (met: WEV 6, ENV 6 themes, INV 6, IVT 4, VID 3; **s10:** VID 6 with C-VID-107…109).
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
| s13 re-check (2026-11-04, D-031) | Strict Wave 1 still **NOT MET**: **4 / 8 unconditional** (WEV 6, VID 6, INV 6, IVT 4), 5 / 8 with the provisional Enviory themes (Q-O09). Revised obligation 2 / 6 unconditional (WEV, VID), 3 / 6 sensitivity. ADR-W1's fallback item 3 ("≥ 3 valid demos wherever enough permitted official demos exist") holds for the four unconditional vendors; Enviory's demos are permitted but provisional, not invalid. Rows above are kept as history |
| s10 re-check (2026-11-04) | Strict Wave 1 still **NOT MET** (5 / 8). The revised obligation of six valid demos for the six highest-ranked Indonesian competitors is met wherever safely available (WEV 6, VID 6, ENV 6) and unavailable for IDI, PLO and SMO (same reasons as above; no equivalent search repeated). Reported as strict and qualified coverage in `../_handoff/acceptance-matrix.md` (RQ-DEMO-01 BLOCKED, RQ-DEMO-02 qualified) |

### Session 10 decisions referenced by the masterplan (full text in `../_progress.md`)
- **D-026:** a robots.txt group for a user-initiated AI agent, including the legacy Anthropic tokens `Claude-Web` and `anthropic-ai`, is an explicit AI-agent opt-out: no request is made and content fetched before the check is deleted unused. Effect: Sitemu (Tier A) and Harikita, Sonett, WedMeGood and Canva (Tier B) are blocked. **Revisit:** owner answer to **Q-O08** (`../_open-questions.md`), or the site adds an explicit allow group. **Superseded in part by D-030 (s12)**: other operators' agents no longer bind, and the legacy names are no longer an opt-out by assertion.
- **D-027:** benchmark tiers are assigned from observed structure with the template manifest's own definitions; no competitor-parity threshold is derived from them. **Revisit:** when the basic and signature tiers reach high confidence.

### Session 12 decisions referenced by the masterplan (full text in `../_progress.md`; verified s13)
s12 wrote these two decisions in `../02-competitor-discovery/robots-applicability-s12.md` but never entered them in the register; s13 entered them after re-running the tests, re-reading the primary sources and observing its own clients (`../_progress.md` D-030 entry).
- **D-030, robots applicability:** a client is bound by the groups that name its own token, else `*` (RFC 9309); on top of that, `Claude-User`, `ai-input=no`, `use=immediate` and a Cloudflare-managed Agent section are applicable opt-outs; the legacy names are uncertain and restricted, except inside a Cloudflare managed "Training crawlers" section, where they are a documented training opt-out (recorded, not binding); training / search tokens and other operators' agents are recorded, not binding. Effect: Sitemu (Tier A) and Harikita, Sonett and WedMeGood (Tier B) become readable by robots (WedMeGood then answered HTTP 403); Canva stays restricted. **Revisit:** Anthropic documents how the legacy names relate to Claude-User; Canva labels its group or names current tokens; Cloudflare changes the managed block's structure or labels (the tests pin today's markers); the owner answers Q-O08 or Q-O10; any site adds `ai-input=no`, an Agent section or a `Claude-User` group (enforced without code changes).
- **D-031, Enviory G1 / G2:** G1 (robots applicability) is resolved as not applicable; G2 (the 2026-10-29 challenge followed by browser captures of the same route) stays open as Q-O09. Until it is answered, C-ENV-111…123 are provisional: retained with provenance, excluded from unconditional benchmark results, coverage counts and aggregates, and reported only in separately labelled sensitivity results; no new request to the demo route. **Revisit:** the owner or the independent reviewer answers Q-O09.

### Session 13 decisions referenced by the masterplan (full text in `../_progress.md`)
- **D-033, own builds as populations (s14):** for our own pages the product build is part of the measurement population (`22ed99e` pre-P0 baseline vs `0b5eb1b` measured in s13 on a slower host), so no median, retry count, coverage figure or digest pools two builds, and a build comparison needs both builds interleaved on one host (`../_progress.md` D-033). D-032 amended: the pilot theme is re-captured with new IDs; the pilot keeps its provenance.
- **D-032, measurement profiles:** protocol v2 measures each theme at 412×915, 360×800, 390×844 and 412×915 with reduced motion in one session; every profile is its own population (never pooled with another profile or with v1.2), and v2 results are paired per theme against the same-session 412 control (`../04-template-benchmarks/protocol.md` §2.3, `viewport/`). The Lighthouse channel is verified per capture against the profile's screen; the CDP channel by the page's own report, and an unverified CDP emulation removes structure, layout and motion evidence only. The pilot exposed a re-apply defect (REA's disconnect wipes the emulation; Chrome ignores an identical re-send), fixed by clear-then-set and covered by a local CDP-after-REA verification channel. **Revisit:** REA gains a mobile / touch flag for its scenario environment (then the before-open window can match the profile too), or a Chrome or REA upgrade changes the disconnect behaviour (re-run `verify-profiles.mjs`).

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
- **Outcome (s11–s21, recorded s25):** the ADR stands; option (a) was followed.
  - One loader call per request (E-013).
  - The cached invitation shell was built with `'use cache'` and measured, then **not shipped** (D-039): it saved ≈ 1 ms of ≈ 29.6 ms per view, because Next replays the cached Flight stream.
  - Clerk was removed from guest pages (E-042) and date formatters shared (E-043): 28.5 → 22.2 ms per view on one host.
  - The ≤ 2 × `next-min` target is not met, and no telemetry exists yet, so no revisit trigger has fired.

## Owner decisions (session 14, 2026-11-04 ≈ 14:58Z)

Answers to the three gate questions in `../_handoff/sessions/session-14-20261104-1420.md`. They are owner direction, not research findings.

### ADR-O08 — Start implementation while research rows stay open
- **Status:** ACCEPTED (owner) · **Confidence:** n/a (owner direction). **Sequencing superseded by ADR-O11 (s26)**; kept as the authority for the s14–s25 implementation work.
- **Context [OBSERVED]:** the gate (`../_handoff/acceptance-matrix.md` §9) was closed on RQ-DEMO-01 and RQ-VER-03 (BLOCKED) and on four PARTIAL rows (RQ-COMP-04, RQ-COMP-05, RQ-OWN-02, RQ-BENCH-05). The session instruction forbids entering implementation by silent waiver.
- **Decision:** implementation starts now, with the open rows kept open and listed. CPU-heavy work keeps its order: the running v2 batch, output regeneration and the RQ-OWN-02 same-host comparison first; then B-016, the design harness and three families, with B-014 step 2 in parallel.
- **Consequences:** the gate reads "not passed; implementation authorized by ADR-O08", never "passed". Claims that depend on an open row (own-build comparisons, B-012 budgets, public-review themes) stay qualified until the row closes.
- **Revisit:** an open row's result contradicts an implementation decision, for example the same-host comparison shows the current build slower than `22ed99e`.

### ADR-O09 — Self-review under owner authority for RQ-VER-03
- **Status:** ACCEPTED (owner) · **Confidence:** lower than an independent review, by construction.
- **Context:** `AGENTS.md` asks for a Guardian review in a separate session (author ≠ reviewer). No second session exists in this sandbox; s14 prepared `../_handoff/review-request-s14.md`.
- **Decision:** the owner gave the author authority to review its own work ("do your best"). The review follows `../_handoff/review-request-s14.md` and `docs/review/review-personas.md` and is recorded as a self-review under owner authority, never as an independent review or a Guardian approval.
- **Consequences:** RQ-VER-03 closes as "self-reviewed under ADR-O09" once the review record exists with its findings and fixes. An independent review stays recommended before release-facing claims and supersedes this one if it happens.
- **Revisit:** the owner or a teammate runs an independent review.

### ADR-O10 — RQ-DEMO-01 is qualified by availability
- **Status:** ACCEPTED (owner) · **Confidence:** as ADR-W1 (reduced for IDI, PLO and SMO).
- **Context [OBSERVED]:** strict Wave 1 needs ≥ 3 valid official demos for each of the top-8 Indonesian competitors. IDI, PLO and SMO publish none that is safe (s08 bounded search: IDI catalogs and real-event accounts, SMO previews show personal data, PLO is app-only), and signup or purchase is not allowed.
- **Decision:** the requirement is qualified by availability: 4 / 8 strict, 5 / 8 counting the provisional ENV themes (D-028). It no longer blocks the gate.
- **Consequences:** comparisons involving IDI, PLO or SMO stay marked as not demo-backed. The ADR-W1 trigger stays open, and the s08 search is not repeated without new evidence.
- **Revisit:** a vendor publishes a placeholder demo, or the owner supplies consented sample invitations.

## Owner decision (session 26, 2026-11-06)

### ADR-O11 — Research, then the final masterplan, then the upgrade
- **Status:** ACCEPTED (owner) · **Confidence:** n/a (owner direction). Supersedes ADR-O08's sequencing; ADR-O08 stays as the historical authority for the work done under it (s14–s25).
- **Decision:** the order is (1) complete the remaining research, (2) reconcile and finalize the masterplan, (3) begin the codebase upgrade by that final plan. No new product feature and no backend migration starts before the research gate (`../_handoff/acceptance-matrix.md` §9) and the final-masterplan gate pass. Research tooling, evidence correction, architecture investigation and isolated feasibility experiments are allowed meanwhile. Once both gates pass, implementation continues without a further approval.
- **Unchanged:** ADR-O09, ADR-O10, Q-D17, DA-01 / DA-02 (deferred, NOT RUN; neither blocks either gate).
- **Consequence (s26):** at first the research gate did not pass (RQ-COMP-04, RQ-COMP-05; `../_handoff/research-closure-s26.md` §8), so until ≈ 16:50Z the masterplan was reconciled but not labelled FINAL and no product feature or migration was started. ADR-O12 then qualified both rows; both gates passed and the upgrade began under this decision.

### ADR-O12 — RQ-COMP-04 and RQ-COMP-05 are qualified by availability
- **Status:** ACCEPTED (owner, s26, ≈ 16:50Z, answering the gate question in the session) · **Confidence:** n/a (owner direction); the evidence behind both rows keeps its own levels.
- **Context [OBSERVED]:** RQ-COMP-04 needs one-page profiles for 21 Tier-B vendors; 13 are substantive. WNK, BRS, MMO and SNT publish too little (no pricing page, "Coming Soon", a homepage-only shell); WMG, GRV and MTD answer 403; CNV is a D-030 uncertain class. RQ-COMP-05 needs public-complaint themes in all 15 Tier-A dossiers; 4 have them. For the other 11, every permitted route was tried s14–s26: search answers without source URLs (s14, s23r, s24, s25, s26), Apple's feeds disallowed by robots, G2 and Product Hunt 403, Trustpilot restricted (D-030 / Q-O08), and Capterra ids only a search would return (`../_handoff/research-closure-s26.md` §3.3–§3.4).
- **Decision:** both rows are qualified by availability, as ADR-O10 did for demos. The strict counts stay as they are: **13 / 21** substantive profiles and **4 / 15** complaint sections. Neither row blocks the research gate any longer.
- **Consequences:**
  - The conclusions in `../_handoff/research-closure-s26.md` §7 stay unsupported and are never stated as findings: complaint themes for ENV, IVT, INV, VID, SMO, KAT, STM, BRN, PPO, JOY and RSV; price comparisons with WNK, BRS, MMO, SNT, WMG, GRV, MTD and CNV; RSVPify's rendered design.
  - Every comparison that touches one of those vendors is marked as limited by availability.
  - The searches already recorded are not repeated without a new capability.
  - With RQ-DEMO-01 (ADR-O10) and RQ-VER-03 (ADR-O09) already qualified, criterion 1 holds. The research gate passes as **qualified**, which unblocks the final-masterplan gate (`../_handoff/masterplan-gate-s26.md`).
- **Revisit:** a search client that returns source URLs, owner-supplied review threads or profiles, a vendor publishing prices, or Q-O08 ruled for Trustpilot / CNV.

## Architecture and product decisions (session 26; full specification in `09-backend-and-frontend-architecture.md` §8)

### ADR-A2 — Rust as the authoritative backend, one data domain at a time
- **Status:** ACCEPTED (s26) as the target architecture. Owner direction plus the evidence below. Implementation waits for the gates (ADR-O11). ADR-A1 is preserved as the measured history and stays true for the render path.
- **Context [OBSERVED]:**
  - ADR-A1 (s09) showed the guest page's cost is the React render, which Rust does not remove; option (a) was followed through D-039 and E-042 / E-043.
  - The owner now asks for Rust as the primary backend.
  - Planned work brings ADR-A1's own revisit triggers within reach: QR check-in with offline sync, jobs, webhook fan-out.
  - An isolated experiment (`../08-backend-rust-plan/feasibility-s26/`) ran on the real schema and matched the TypeScript writer: 17 / 17 tests and the parity guard.
- **Options:**
  - (a) keep everything in Next.js;
  - (b) a Rust service owning domain rules and writes, migrated per domain behind flags, with Next.js as the presentation layer;
  - (c) a full rewrite including the frontend (for example Leptos).
- **Decision:** (b). Rejected:
  - (c): it rebuilds the frontend only to change technology (ADR-F1);
  - (a): it ignores the owner's direction without a measured reason to overrule it.
- **Rules:**
  - one writer per column group, never two at once;
  - drizzle-kit stays the single migration owner, and changes are expand → migrate → contract;
  - OpenAPI from Rust types with a generated TypeScript client and drift checks;
  - RFC 9457 errors;
  - owner tokens verified against the JWKS;
  - guest links checked by the same rules;
  - an internal HMAC signature on every call;
  - a Postgres job table instead of Redis;
  - the Vercel Rust runtime (beta) in `sin1`, with a container fallback;
  - telemetry and SLOs before cutover;
  - flag rollback per slice.
- **Order:** U2 guest interactions (views → RSVP with the host override → wishes with rate limits and moderation) → U3 media derivatives → U4 roster and editor API → U6 payments (`06-backlog.md` "Upgrade order (s26)").
- **Revisit:**
  - the beta runtime fails a slice gate: container fallback;
  - a shared rule cannot be kept in parity by vectors: move rendering's read to a Rust view model first;
  - guest-write p95 or the error rate breaks the SLO after cutover: roll back the flag and reassess;
  - cost exceeds the Next.js-only baseline without a functional gain.

### ADR-F1 — Next.js stays the frontend
- **Status:** ACCEPTED (s26).
- **Evidence:** the comparison in `09-backend-and-frontend-architecture.md` §8.9:
  - measured guest-page lead (RQ-OWN-02);
  - per-invitation share previews (E-010);
  - full reuse of five layouts, the editor, 311 tests and the harness gates;
  - none of Astro, SvelteKit, React Router 7 or Leptos shows a measured gain on a problem we have.
- **Decision:** Next.js renders all HTML, owns sessions, metadata and OG images, and never writes a migrated domain. Two follow-ups:
  - leave the canary release for a supported stable line, behind the gates;
  - the RSC payload is the next render lever.
- **Revisit:**
  - a measured guest-page problem that a framework change demonstrably fixes (harness gates plus the RQ-OWN-02 method);
  - the framework line we depend on losing support.

### D-041 — Legacy layout contrast: INCOMPLETE stays INCOMPLETE; legacy is frozen for compatibility
- **Context [OBSERVED]:**
  - Rendered contrast on the s23r / s24 fixture: 54 PASS, 0 FAIL, **2 INCOMPLETE** (`legacy-corp-wide`, `legacy-photo`). In both, the legacy headline sits over a cover photo, where no solid background exists to measure.
  - Legacy is byte-identical by design and still the default layout. The four families pass.
  - LATEST §4 item 4 left this open: move the text, or accept INCOMPLETE.
- **Decision:**
  - (1) Legacy is a **frozen compatibility layout**: existing invitations keep rendering byte-identically, and no host sees a visual change they did not choose.
  - (2) The two verdicts stay **INCOMPLETE** in every report and total. They are never relabelled or counted as PASS. The legacy gate reads "no FAIL; INCOMPLETE listed".
  - (3) New invitations default to a design family that passes the gate (a U3 product slice; legacy stays selectable).
- **Rejected:**
  - a scrim or moved headline on legacy now: it changes every existing invitation, and the families already solve it for new ones;
  - accepting INCOMPLETE silently.
- **Revisit:** a legacy change becomes acceptable only if a rendered run measures the two pages as PASS **and** the owner approves the host-visible change.

### D-042 — What a theme write may change: the Premium palette rule (B-041, s26 Phase C)
- **Context [OBSERVED]:**
  - Checkout charges by the tier of the invitation's catalog theme (`invitations.template_id` → `templates.is_premium`).
  - Guests see `config.theme.paletteId`. The content contract marks `theme.templateId` host-only.
  - `updateDetailConfig` stored any palette text and any positive `templateId`, before or after payment, so a Standard invitation could render a Premium palette.
  - Of 18 registered palettes, 13 are used by at least one free catalog theme. `ivory` is used only by a Premium theme, but it is also what `palette()` renders for a missing or unknown id.
- **Decision:**
  - (1) A palette is **Premium** when no free catalog theme uses it. The fallback palette is always Standard, since removing the palette would render it anyway. Today that leaves `blossom`, `gold-noir`, `midnight` and `orchid`.
  - (2) A changed Premium palette needs a **Premium entitlement**: the invitation's own theme is Premium (checkout will charge Premium), or a PAID order with the Premium tier exists for it.
  - (3) A changed palette must be registered. A changed `theme.templateId` may only name the invitation's own catalog theme; switching themes is B-036.
  - (4) Only changed fields are checked. A stored config always saves again unchanged, so legacy rows are never locked, and clearing a field needs no entitlement.
  - (5) The PATCH answers 403 `THEME_NOT_ENTITLED` with paths and reasons only. A refused write changes nothing.
- **Rejected:**
  - tying palettes to the exact catalog theme: it would block the 13 shared palettes for no revenue reason;
  - rejecting stored values that predate the rule: it would stop hosts from saving unrelated sections.
- **Evidence:** E-054 (tests 13 / 13; `verify-theme-entitlement` 14 / 14 with a negative control).
- **Revisit:** a catalog change that moves a palette across tiers (a unit test pins today's set), or B-036.

### D-043 — RSVP writes through the Rust API: keyed retries, shared limits, a trusted-proxy address (R-03; code s27, completed s28)
- **Context [OBSERVED]:**
  - ADR-A2 allows one writer per column group and no fallback after an ambiguous write; a fallback after a timeout could write a second time for a request the first writer committed.
  - RSVP is the core guest write and had no limit (B-013). Guests arrive in WhatsApp blasts, often many behind one carrier NAT, and IPv6 subscribers routinely hold a whole /64.
  - `X-Forwarded-For` is appended by every proxy; only entries written by trusted proxies are facts. Vercel's edge replaces the header with the client's address alone.
  - The s27 code minted a form key per rendering but sent none from the host's dashboard, retried nothing, threw on a transport failure (a generic error page), and read the leftmost forwarded entry or `X-Real-IP`.
- **Decision:**
  - (1) Every RSVP write to the API carries an `Idempotency-Key`, recorded with the response in the write's own transaction (`api_idempotency_keys`, kept 24 h). The guest page mints one per rendered form; the writer mints one when a form has none and for every host override.
  - (2) An unknown outcome (status 0, any 5xx) is sent exactly once more under the same key: a committed write replays, an uncommitted one writes once. The other writer is never tried. If the retry is unknown too, the guest sees "unconfirmed" and the re-rendered form carries the same key (`?rsvp=retry&rsvpk=`), so the next send writes at most once; the host sees `?error=unconfirmed` and the list shows the state. Codes and status are logged, never guest data.
  - (3) Fixed-window limits in `api_rate_limits`, shared by every instance: per link (default 10 / 600 s) and per address (60 / 600 s), refused with 429 and `Retry-After`; the guest's notice says how many minutes. Replays answer before the limiter.
  - (4) The address is the `X-Forwarded-For` entry `TRUSTED_PROXY_HOPS` places from the right (default 1; 0 trusts no header; an unreadable value trusts none). Only IP literals are sent. The API keys IPv4 (and IPv4-mapped IPv6) by address and IPv6 by its /64, and stores an HMAC of the key under the service secret, never the address.
  - (5) Refusals map to the notices the TypeScript writer gives (closed, invalid, the event or question to fix, busy). The owner check's 403 sends the host to sign-in, as `context()` does; 400 and 401 are deployment errors and propagate.
  - (6) Migration 0016 is additive and written only by the API; drizzle-kit stays the single migration owner. Stored guest shapes are unchanged.
- **Rejected:**
  - a fallback to the TypeScript writer after a failure: it could write twice;
  - the leftmost forwarded entry or `X-Real-IP`: client-controlled unless a proxy is contracted to set them;
  - per-address IPv6 limits: one line can rotate through 2⁶⁴ addresses;
  - storing or logging addresses (UU PDP).
- **Limits:**
  - Concurrent sends of one form each pass the limiter before one commits, so at the boundary a twin can see "busy" while the other saved; sequential re-sends replay before the limiter.
  - The per-address limit is only as good as the deployment's proxy contract; without a trusted proxy (`0`) only the per-link limit applies.
  - A double click on a dashboard control is two overrides with one result (two RSVP analytics rows); the key covers one override's retry.
- **Evidence:** E-059 (`verify-rsvp-api` through both call sites and the running binary, with negative controls; unit tests for the writer, the client and the address contract).
- **Revisit:** a deployment behind other proxies (set `TRUSTED_PROXY_HOPS`), or limits that real traffic proves too tight or too loose.

### D-044 — Wishes: moderation, replies and visibility, written through one writer (R-04; s28)
- **Context [OBSERVED]:**
  - B-028: `guest_messages.is_hidden` existed and the guest page already skipped hidden rows, but nothing set the flag. Hosts could not approve, hide, delete or reply, so every wish was listed and counted.
  - B-013: wishes had no write limit. B-017: the guest page's newest-wishes list and count had no index.
  - ADR-A2 and D-043 fix the slice mechanics: one writer per column group, an `Idempotency-Key` on every API write, one retry under the same key, no fallback.
- **Decision:**
  - (1) Three states from the existing column plus one timestamp: **VISIBLE** (`is_hidden` false), **PENDING** (hidden, `reviewed_at` null: the guestbook was moderated when the wish arrived), **HIDDEN** (hidden by the host, `reviewed_at` set). `is_hidden` keeps its meaning, so the guest page's rule stays "not hidden".
  - (2) Two host settings in the guestbook section: `moderation` (default off) stores new wishes PENDING, and the form tells the guest; `visibility: 'host'` (default `public`) keeps every wish for the hosts: the page shows the form and no list, and the loader runs no wish query. An unreadable section reads as open, unmoderated and public.
  - (3) Host operations on `/dashboard/invitations/<id>/wishes`: show (approve a pending wish or restore a hidden one), hide, delete, reply (trimmed, at most 1,000 UTF-16 units; blank clears). A reply is stored on any wish and rendered only under a visible one. Only the invitation's owner; administrators sign in; the wish must belong to the invitation.
  - (4) One pure decision, `lib/invitation/wish-decision.ts`: the switch first, then the message (trimmed, 1–1,000 UTF-16 units, no U+0000), then moderation. `contracts/vectors/wish-decisions.json` runs it in both languages.
  - (5) Writer selection `BACKEND_WISHES` (default `next`) with D-043's contract: the guest form's key comes from the per-render key helper; each host action mints its own key, so a retried delete replays instead of answering "not found". Unknown outcomes are retried once and then shown as `?wish=retry&wishk=`. Limits are per link (5 / 600 s) and per address (60 / 600 s, IPv6 per /64), shown as `?wish=busy&wishr=`. A form key reused with another message is treated as a new wish and sent under a fresh key, not refused.
  - (6) Migration 0017 is additive (`reviewed_at`, `host_reply`, `replied_at`, index `guest_messages_invitation_visible_idx (invitation_id, is_hidden, created_at)`); drizzle-kit owns it. The guest page still shows the newest 50 visible wishes, oldest first.
- **Rejected:**
  - a separate status column: a second source of truth beside `is_hidden`, and a changed read rule for the guest page;
  - refusing a reused form key with a changed message: a guest who brings an old page back would lose what they typed;
  - hiding the form on a hosts-only guestbook: the wish still reaches the hosts, and the form says who reads it.
- **Limits:**
  - The TypeScript writer applies no limits. It is the rollback path until the rollout removes it.
  - Concurrent twins at a limit boundary behave as in D-043.
  - A moderated guestbook shows a new wish to nobody until the host approves it. The notice says so.
- **Evidence:** E-060 (`verify-wishes-api` through both writers and the running binary, `EXPLAIN` on the guest page's queries, five negative controls; unit and vector tests in both languages).
- **Revisit:** limits that real traffic proves wrong, or a request to show pending wishes to their author.

### D-045 — Background music opens from a typographic cover gate, only when the music can play (B-009; s28)
- **Context [OBSERVED]:**
  - B-009: `config.music` was stored and never rendered. Cover plus music appear on 8–9 of 9 Indonesian vendors (C-ENV-122, C-INV-111, C-WEV-104, S-IDI-006). Browsers start sound only after the guest's own gesture, and opening is not playback (D-016).
  - I-15 is B-009's acceptance (dispositions s26). The opening takes at most 1.5 s, the control is tappable and labelled from first paint, and reduced motion is honoured. The observed problem is premium vendors' 10 s intros and text-less cover controls (C-ENV-122, B-ENV-001).
  - Every wedding preset stores `music: { enabled: true }` without a URL. Uploads accept images only.
  - D-041 freezes the legacy layout, the four families are experiments, and T1 keeps photos framed.
- **Decision:**
  - (1) Music renders only from a playable source: `music.enabled` and an http(s) `assetUrl`, under the same rule as images (`lib/invitation/audio-url.ts`). Flag `GUEST_MUSIC`, default on.
  - (2) The gate exists to give the music its gesture. It shows when the music plays on opening (`autoplay` unset or true; the editor now presents this as the default "Putar saat undangan dibuka") and never after a form post (`?rsvp=`, `?wish=`). With `autoplay: false` the page offers only the control.
  - (3) One shared client island wraps every layout (`components/invitation/cover-audio.tsx`) and sits outside `<main>`. The layouts' markup is unchanged (`<main>` byte-identical), and a page without playable music renders byte-identical HTML. Next.js lists a route's client chunks statically, so every guest page downloads the island's chunk (5.6 KB decoded), which runs only where music plays. A lazy boundary was rejected: it could stream the gate after the content it covers.
  - (4) The gate is typographic: the kicker (the host's cover headline, or the occasion), the names, the date, "Kepada Yth." with the guest's name on a personal link, then "Buka Undangan" and "Buka tanpa musik". It uses palette tokens only and carries no photo (T1), so it paints with the first byte. It is a modal dialog placed before the layout in the DOM.
  - (5) It opens without JavaScript: both links point at the gate, and `:target` hides it. With JavaScript, the same tap starts the audio inside the click handler. Escape and "Buka tanpa musik" open without sound. After hydration the page behind is inert and the document does not scroll. After opening, focus moves into the page.
  - (6) The only motion is the gate's exit (0.7 s), removed under reduced motion.
  - (7) One `<audio preload="none" loop>`, so no audio byte is fetched before a tap. A toggle with `aria-pressed` appears after hydration, and none appears if the source cannot play.
- **Rejected:**
  - a gate on every invitation: friction without the music it exists for;
  - a gate per family layout: five implementations, and a legacy change under D-041;
  - a gate that needs JavaScript: a tap before hydration would be lost, so it would not be operable from first paint;
  - the `autoplay` attribute, or starting sound from an effect: browsers block it, and it would be sound without a gesture;
  - a cover photo on the gate: text over a photo stays unmeasurable (T1);
  - audio uploads in this item: the storage allowlist, Range support and size limits are their own change.
- **Limits:**
  - Playback is proven in headless Chrome only. Devices and in-app browsers (WhatsApp, Instagram) are unverified (D-016, EXT).
  - A host URL that is not an audio file fails quietly: the gate still opens and no control is offered.
  - The audio host sees the address of a guest who taps, as with external images.
  - An enforced CSP (B-038) will need `media-src` for hosts' audio origins.
- **Evidence:** E-061.
- **Revisit:** audio uploads, evidence from devices, or a host asking for a gate without music.

## Decisions since session 14 referenced by the masterplan (recorded s25; full text where linked)
Product decisions taken during implementation under ADR-O08. Each has its full text, reasons and reversal in `../_progress.md`, its implementation in `../_handoff/IMPLEMENTATION-LOG.md`, and its domain rule in `docs/systems/`.

| ID | Session | Decision (one line) | Implementation |
|---|---|---|---|
| D-034 | s17 | A guest's answers to the host's custom questions live in one nullable `guests.rsvp_answers` jsonb column, written by the same UPDATE as the RSVP | E-029…E-031 (B-027 slice 2b) |
| D-035 | s18 | Questions that can never apply are not shown. A broken stored question costs only itself, and a deleted source never costs its dependants' answers. Hosts author conditions on earlier choice questions only | E-030, E-031 |
| D-036 | s19 | Events carry durable ids (content version 2, migration 0013). An answer per event lives in `guests.rsvp_event_answers`, keyed by event id | E-034…E-036 (B-027 slice 2c) |
| D-037 | s20 | Invite-only events: the config marks an event `inviteOnly`, and the guest row lists the invited events (`guests.invited_event_ids`, migration 0015). Audiences are guest / public / owner; flag `INVITE_ONLY_EVENTS` | E-038 |
| D-038 | s20 | Person photos: adults' photos show once uploaded. Children's photos need the host's switch and a personal link or the host preview | E-039 |
| D-039 | s21 | B-014 step 2 does not ship a cached invitation shell; the measured render-cost levers ship instead (ADR-A1 outcome above) | E-042, E-043 |
| D-040 | s23r | Children's photos get an access contract, not only a rendering rule. Protected storage namespace; owner-only `/media/protected/*`; a personal-link photo route; ownership at save, render and delivery; a byte-verified migration with rollback | E-047 |
| Q-D17 | s25 | Q-O11 resolved under the owner's delegation: the family byte budget judges design bytes, host uploads stay inside both page totals and are reported separately, and both verdicts are stored. Reversible in `policy.ts` | E-053 (harness only) |

**Owner clarification, s25 (not an ADR; recorded in `../_handoff/deferred-acceptance.md`):**
- **DA-01:** real-Clerk signed-in acceptance is deferred out of the codebase-rebuild phase.
- **DA-02:** running the children's-photo migration in real environments belongs to deployment.

Both are NOT RUN and are never reported as passed. The authentication implementation and its security boundaries stay as they are.


### ADR-O13 — Sandbox release checks; no GitHub workflow files (owner, 2026-11-07)

- **Authority:** the owner requires checks in the agent sandbox before transfer and explicitly asks for no CI YAML or GitHub workflow directory in the repository.
- **Decision:** remove the GitHub workflow file and directory entirely. Retain the five sandbox gate scripts under scripts/ci and run the applicable checks against the exact final deliverable in a disposable sandbox before transfer.
- **Reporting:** record the tested commit/tree, environment and results; edits after a passing run require the checks relevant to those edits. A sandbox result does not establish real deployment, device or seven-day operational acceptance.
- **Scope:** changes the execution location and transfer process. Existing product checks, budgets, rollback rules and operational prerequisites remain in force.
- **Persistence:** agents must not recreate GitHub workflow files during recovery, export or subsequent transfers. Old workflow references and Actions results describe historical checkpoints only.
