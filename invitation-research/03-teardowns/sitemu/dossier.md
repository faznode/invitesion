# Sitemu (STM): Tier A teardown dossier — BLOCKED

> **Status: BLOCKED, session 10 (2026-11-03). Not a substantive profile; it does not count toward any coverage requirement.** Sitemu is Tier A rank 10 (`../../02-competitor-discovery/shortlist.md`).
>
> **Why blocked (D-026).** `https://sitemu.id/robots.txt` (HTTP 200, read 2026-11-03T20:52Z) allows `User-agent: *` but has explicit `Disallow: /` groups for the **legacy Anthropic agent tokens `Claude-Web` and `anthropic-ai`** (next to training crawlers, which do not bind visitor reads per `_rea-playbook.md` §5) and carries `Content-Signal: ai-train=no`. This research is run by an AI agent, and `Claude-Web` historically identified Anthropic's user-initiated fetches, so the group is treated as an explicit AI-agent opt-out, in line with the playbook rule that a disallow for user-initiated AI agents is a block.
>
> **What happened.** Seven pages were fetched at 20:52–20:53Z with `_tools/discovery/profile-reads.py` before the tool checked AI-agent groups (it then honoured only `User-agent: *`). After the check was added, the page text, the derived facts file and the draft dossier based on them were **deleted unused**; no figure, quote or observation from those reads appears in this repository. The tool now stops at such an opt-out before the first page request (D-026).
>
> **What remains (historical, gathered before this rule existed, not expanded here):** the longlist row (probe 2026-10-29: claimed "120 tema; Rp50k–Rp300k; coba gratis"; stack hints WordPress, Next.js, Cloudflare; Tranco not in the top 1M) and `D-STM` (2026-10-29: 0 demo links on `/product`). These were not re-verified and carry the same opt-out question.

## Required sections
All twelve dossier sections (`../_TEMPLATE-dossier.md`) are **[UNKNOWN]** for Sitemu in this research: positioning and pricing beyond the historical longlist claims, funnel, builder, guest page, technology, public API, app, growth, monetization, strengths and weaknesses, patterns, and the module mapping.

## What would resolve it
1. **Owner decision Q-O08** (`../../_open-questions.md`): either confirm that legacy Anthropic tokens do not cover this research's agent (then re-read under D-026's documented exception), or keep the block.
2. A human researcher reads the public pages and records facts in a new dossier version with their own evidence IDs.
3. Sitemu changes its robots.txt (for example, an explicit `Claude-User` allow group).

## Effect on the masterplan
- Tier-A coverage stays **14 / 15** (requirement RQ-COMP-02 in `../../_handoff/acceptance-matrix.md`: BLOCKED for Sitemu).
- Sitemu's archetype (DIY → custom ladder) remains represented by Satu Momen (`../satumomen/dossier.md`); conclusions that would rest on Sitemu alone are not drawn.
