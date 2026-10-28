<!-- SUMMARY (first 7 lines — greppable) -->
# _open-questions.md — decisions taken autonomously + questions for the owner
> WHAT: R9 log. Every judgment call made without asking, and every item only the owner can answer.
> STATUS: ACTIVE
> OWNER: Oracle (research agent)
> DEPS: _progress.md
> GREP: open questions, decision, owner, blocked, assumption
> UPDATED: 2026-10-29

## A. Decisions taken without asking (reversible)
| ID | Date (WIB) | Decision | Why | How to reverse |
|---|---|---|---|---|
| Q-D01 | 2026-10-29 | Git metadata kept outside the hosted project directory (`/vercel/share/work/invitesion.git`) | The hosting platform auto-commits/pushes its own repo; a nested repo could leak or be pushed | Copy the work tree into a normal clone |
| Q-D02 | 2026-10-29 | REA used via CLI, MCP `setup` not run | `setup` edits global agent config (forbidden by the vetting rules); CLI returns the same Evidence records | Owner runs `npx -y rea-agents@6.8.0 setup` locally |
| Q-D03 | 2026-10-29 | Audit builds use placeholder Clerk keys passed on the command line only | No real keys exist for this sandbox; nothing secret is written to disk | Provide a Clerk dev instance for authenticated-flow testing |
| Q-D04 | 2026-10-29 | Production-mode (`pk_live_`) placeholder key for measurements | `pk_test_` keys trigger Clerk's dev-browser handshake redirect on every first navigation, which would make our page unmeasurable and is not what guests see in production | n/a |
| Q-D06 | 2026-10-29 | **Incident + fix:** the hosting sandbox replaced the repo `.gitignore` with its own template (dropping `_private`, `.env`, `*.pem`, `/storage/`); 5 low-sensitivity `_private` files (secret-scan report without values, one competitor marketing thumbnail, its raw REA/Lighthouse JSON) entered local commit `8e0f0b7` and the platform's "Initial commit from v0". Fixed in `e3dcd70` (untracked, `.gitignore` restored and merged, `commit-guard.sh` added). In this sandbox private evidence now lives **outside** the project at `/vercel/share/work/invitesion-private` (`INVITESION_PRIVATE_DIR`); history was not rewritten (R7). The research repo's `.git` is not part of the handoff zip | A rewritten `.gitignore` must never again expose private material | Owner: do not connect this v0 chat to a **public** GitHub repo without first dropping the platform's initial commit; the delivered zips are clean |
| Q-D05 | 2026-10-29 | No free-tier signups on competitor sites in this run | R1 allows it only with a ToS check and a throwaway identity; builder flows are documented from public demos, marketing pages, help docs and store listings instead | Owner may approve specific signups (list in §B) |

## B. Questions only the owner can answer
| ID | Question | Why it matters | Default if unanswered |
|---|---|---|---|
| Q-O01 | Is the strict `detailConfigSchema` meant to reject `defaultConfig.art`, or should `art` move out of the invitation config? | Today every new invitation loses its theme (P0) | Treat as bug; plan moves `art` to a separate column/table |
| Q-O02 | Final pricing: marketing page says "Rp0/GRATIS" for some tiers while `lib/pricing.ts` charges Rp149k/Rp299k | Pricing analysis and packaging recommendation | Use `lib/pricing.ts` as the current truth |
| Q-O03 | Which QRIS acquirer/PJP will be used (docs/AUDIT B5)? | Gift and checkout money flow, compliance questions | Plan stays acquirer-agnostic |
| Q-O04 | Approved religious-text corpus (Qur'an translations, hadith, prayers) and its source/translation | Hard rule: agents may not write scripture from memory; current presets contain 3 Qur'an translations of unknown provenance | Harness blocks unverified religious text |
| Q-O05 | Brand direction: keep the rose/magenta editorial identity (`#e80053`, Instrument Serif + Manrope) or evolve? | Style DNA target direction (ADR in Phase 7) | Keep core identity, evolve toward motion/3D (ADR-STYLE-001) |
| Q-O06 | Hosting target (Vercel region, Indonesian CDN PoP) and analytics access | Phase 8 latency model and cost model | Assume Vercel + Jakarta-adjacent edge (sin1) |
