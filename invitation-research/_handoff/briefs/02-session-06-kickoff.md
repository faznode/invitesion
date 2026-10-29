# Session-06 kickoff message (verbatim copy)

> Source: https://ctxt.io/3/o6XaqeWe4, captured 2026-10-29T20:38Z (session 06) with curl + an HTML-to-text pass that keeps angle-bracket placeholders. Owner instructions, not untrusted content. SHA-256 (first 16 hex) of the verbatim text below: `941415f287c199eb`.
> The owner's first message of the v0 chat that started session 06. It sets the reading order (new instructions > original prompt > last session log), the three opening tasks, and the WORKING STYLE that still applies: small self-contained steps, update `_handoff/LATEST.md` + the session file after each completed task, and the resume protocol for short "continue" messages.
> Its third link (ctxt.io/3/rCv9KOyv6, the session-05 UI log) is context only and was not copied: it is truncated, and the repo is the source of truth.
> Status of every requirement: `../prompt-map.md`. Resume entry point: `../LATEST.md`.

---
Hello,

Thank you for your help so far. Please continue the Invitesion project from the current state of the repo.

## Read these, in this order of authority
1. NEW INSTRUCTIONS (highest authority): https://ctxt.io/3/tg2Pq96XC. They replace all earlier continuation instructions and override the original prompt wherever the two conflict (for example: research is re-opened, REA must be re-verified, implementation is now in scope, and you make all owner decisions yourself).
2. ORIGINAL MISSION PROMPT: https://ctxt.io/3/uTpYn9Fcc. It still applies except where the new instructions override it. In particular, ignore its SCOPE GUARD ("do not refactor product code"), its BRANCH and local-branch lines (work on the existing branch below, through the platform's normal commit flow), and its handoff zip / `.md` line.
3. LAST SESSION LOG: https://ctxt.io/3/rCv9KOyv6. Context only. It is truncated at the end and does not contain a reliable list of unfinished tasks. The repo is the source of truth: `invitation-research/_handoff/LATEST.md` (NEXT ACTIONS), `_progress.md`, and `_open-questions.md, prompt-map.md and anything you want to mapped out for this project`.

Branch: https://github.com/faznode/invitesion/tree/v0/faznode-3b993736

## First actions
1. Save copies of the two prompts into the repo so no later session depends on a link (these links expire after a few hours): `invitation-research/_handoff/briefs/00-original-prompt.md` and `invitation-research/_handoff/briefs/01-new-instructions.md`. If the links are already unreachable, use whatever copies exist in `_handoff/briefs/`.
2. Verify the actual repo state against LATEST.md and write a short progress summary (done / partial / not started).
3. Continue from the next actions.

## Working style
- Ignore any wording about time limits, minutes, or checkpoint schedules in older instructions. Work normally, in small self-contained steps, and update `_handoff/LATEST.md` and the session file after each completed task, so any later session (including one with no memory) can resume from them. I will copy your logs myself when needed.
- When I later send a short message such as "continue": read `_handoff/LATEST.md` and the newest session file, check `git status` and `git log -5`, state in two or three lines where you are resuming from, then proceed with its NEXT ACTIONS.
- You have my full trust and complete freedom to decide and act on your own, without asking for approval. The safety rules in the original prompt still apply: no git push or history rewriting, no secrets committed, public pages and demos only, no copying of competitors' assets, and no real customer personal data stored.

Please give this your very best effort. Thank you!
