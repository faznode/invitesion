# Enviory: public API surface observed from normal page use

Rule: record only calls a normal visitor's page load triggers. No probing, no form submissions (R1). Response shapes are recorded as keys and types only; no values that could be personal data.

| Date (WIB) | Capture | Method | Path | Params | Response shape | Tag |
|---|---|---|---|---|---|---|
| 2026-10-29 10:37–10:49 | C-ENV-101…106 | none | none | none | REA `analyze-web-bundle` found no endpoint observations; only low-confidence `endpoint_candidate` values (`u`, `name`) from minified `.get()` calls, which are not real paths | [OBSERVED] |

Notes
- These captures hit the preview wrapper (`/tema/<slug>/pratinjau`), see `dossier.md` §4.1. The guest-page captures C-ENV-111…116 (queue C) may show the RSVP/wishes/analytics calls a page *load* makes. Submissions stay out of scope.
- Check-in uses `enviory.com/checkin` with a dashboard code [CLAIMED S-ENV-001]. It is not exercised, because it needs a host account.
