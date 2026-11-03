<!-- SUMMARY (first 7 lines — greppable) -->
# 11-pricing-growth-roadmap.md — packaging, growth / SEO, ideation highlights, sprint roadmap, 90-day sequence, KPIs, risks
> WHAT: How the backlog turns into releases over 90 days, with entry / exit criteria, the pricing stance, growth levers and KPIs (definitions only; no invented baselines, ADR-O06).
> STATUS: FINAL v2 (s09, 2026-11-03; v1 s08): 90-day sequence reconciled with the s09 spike (B-017a in sprint 1, B-014 as the measured lever)
> OWNER: Research agent
> DEPS: 06-backlog.md, ../06-gap-analysis/pricing-packaging.md, ../07-ideation/{README.md,top-10.md}, 12-decision-log.md
> GREP: roadmap, 90-day, sprint, pricing, growth, seo, kpi, risk
> UPDATED: 2026-11-03

## 1. Pricing and packaging stance (detail: `../06-gap-analysis/pricing-packaging.md`)
- **Now:** prices stay Rp 149k / 299k one-time, 12 months (owner decision, ADR-O02); marketing shows them honestly (B-002); free = drafting and preview only.
- **Next (after P0):** free theme switching within the tier (B-036); test an entry tier inside the Rp 69–100k band **or** a reverse trial behind a flag (B-040), never both at once, measured by publish conversion and refund rate.
- **Never:** permanent strikethrough anchors, revision caps, expiry counted from purchase.

## 2. Growth levers grounded in evidence
| Lever | Evidence | Plan |
|---|---|---|
| WhatsApp is the distribution channel | every Indonesian vendor shares via WhatsApp; OG images on 6 vendors | OG card (B-010), editable per-guest messages (B-018), follow-up lists (I-06) |
| Speed and accessibility as the promise | FM-156…163 | published budgets per template (I-02) once B-012 holds |
| Programmatic SEO | ours ~90 pages; IDI 50 event pages; INV utility tools | keep; remove over-claims (B-022); add niche pages only with real templates |
| Try-before-signup | ENV name-first preview | B-037 |
| Partners | reseller credits at SMO / WEV / ENV / INV; affiliates 15–40 % | P2 after automated payments (B-039) and tenancy |
| Trust | real-customer samples at IDI / SMO / IVT | fictional previews, privacy controls (I-18), verified religious text (I-11) |

## 3. Ideation highlights in the roadmap
Top-10 ideas mapped: I-06 → B-034 (sprint 4); I-02 → after B-012 (sprint 3); I-18 → B-026 + B-031 (sprints 3–5); I-03 → B-026 (sprint 3); I-11 → B-003 corpus + entries when supplied; I-13 → B-032 (sprint 3); I-16 → B-010 (sprint 2); I-15 → B-030 signature tier (sprint 5–6); I-05, I-28 → P2 after B-030 tokens.

## 4. Recommended 90-day sequence (two-week sprints)
| Sprint | Days | Scope | Entry criteria | Exit criteria |
|---|---|---|---|---|
| 1 | 1–14 | **Trust fixes:** B-001 presets, B-002 prices, B-003 scripture, B-004 time zones, B-005 preview link, B-006 CSV, B-007 allowance, B-017a atomic view dedupe (s09 spike finding) | baseline tests green | each item's tests pass; typecheck + test + build green; IMPLEMENTATION-LOG updated |
| 2 | 15–28 | **Guest table stakes I:** B-008 countdown + calendar, B-010 OG image, B-012 harness budgets, B-014 cached invitation-level render + one loader call (ADR-A1 lever; render ≈ 85–90 % of server CPU per page), B-015 Clerk off guest pages, B-016 contrast | sprint 1 exit | harness `check` green for the base template; spike rerun shows the product page's server CPU per view within 2× of the `next-min` level; Lighthouse ≥ 90 on the guest fixture with middleware once real keys exist |
| 3 | 29–42 | **Guest table stakes II:** B-009 cover + music, B-023 profiles, B-026 gift block, B-029 captured blocks, B-032 memorial preset | B-012 live | budgets still met; a11y ≥ 95; reduced-motion run clean |
| 4 | 43–56 | **Host tools:** B-011 opaque links (flag), B-013 rate limits, B-018 wa.me, B-033 import, B-034 analytics + follow-up lists | B-007 live | flag rollout plan; abuse tests pass |
| 5 | 57–70 | **Day-of + editor:** B-024 QR pass / scanner / greeting screen, B-035 live preview + autosave, B-036 free theme switching | B-011 on for new invitations | desk flow ≤ 3 s per guest in a test; no data loss on autosave |
| 6 | 71–90 | **Catalog v2 + payments readiness:** B-030 template system v2 (three dogfood templates promoted), B-017 indexes, B-019 image pipeline, B-020 CI, B-039 PJP adapter if a contract exists, B-040 pricing experiment | owner decisions recorded | ≥ 3 templates pass every gate; CI green on every change |

## 5. KPIs (defined now, measured once analytics exist)
Publish conversion (drafts → published), time to first share, share of guests who open, RSVP answer rate by D-3, wishes per invitation, refund rate, support tickets per 100 invitations, guest-page p75 LCP and weight in the field, accessibility score per template (harness), template gate pass rate.

## 6. Risks
| Risk | Mitigation |
|---|---|
| New guest features erode the speed lead | B-012 budgets block merges; lazy islands; music `preload="none"` |
| Opaque links break published invitations | flag + legacy slugs keep working (B-011) |
| Owner decisions stall payments and pricing | P0 avoids them; B-039 / B-040 wait for decisions |
| WhatsApp policy or ban risk | official API only; wa.me until then |
| Religious or cultural missteps | verified corpus only; reviewed playbooks; sober memorial defaults |
| Production differs from lab (middleware, clerk-js, real keys) | B-015, B-014; re-measure with real keys (P-INV-010) |
