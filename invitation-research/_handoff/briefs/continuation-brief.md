# Continuation brief + handoff protocol (verbatim copy)

> Source: https://ctxt.io/3/sJeQRv4FG (the owner's first message in the v0 chat that started session 03), stored 2026-10-29 (session 05) so the handoff rules live in the repo. The two links it cites are the original prompt (now `original-prompt.md`) and the pre-v0 agent's checkpoint logs (history only; not needed to resume).
> Later owner messages in the chat: "continue" (session 04) and, for session 05: "make sure you've read the whole main prompt and mapping with actual repo state, and I want all the files organized (grouped according to their nature). Old files that aren't related to the project can just be archived."

---

Hello,

Thank you for your help so far. Please continue the work of the previous agent on the Invitesion project.

## Context

- The previous agent's interim results were pushed to this branch:

 https://github.com/faznode/invitesion/tree/v0/faznode-3b993736

- The original prompt that agent was working from:

 https://ctxt.io/3/mTY6p2bHG

- The previous agent's checkpoint logs, written against that same prompt:

 https://ctxt.io/3/nvgiDJz4Q

Please note that not everything in the original prompt has been executed yet.

## What I would like you to do

1. Read the original prompt carefully and in full.

2. Read the checkpoint logs carefully through to the very end. The end of the logs lists tasks that are still unfinished.

3. Clone the branch above into your local sandbox so you can inspect the actual files. Compare the branch against the logs and the prompt to determine exactly how far the previous agent got, and write a short progress summary (done / partial / not started) before you continue. If the logs and the branch disagree, please treat the branch as the source of truth.

4. Continue the previous agent's work from the latest checkpoint and complete the remaining tasks from the prompt, starting with the unfinished tasks listed at the end of the logs.

## Handoff notes (important)

This work will span several working sessions. I will not copy logs for you anymore. Instead, you keep a handoff note inside the repo, and any later session (including a fresh one with no memory) must be able to resume from that note alone.

Where to write:

- `invitation-research/_handoff/LATEST.md` is the single entry point. Overwrite it each time so it always reflects the current state.

- `invitation-research/_handoff/sessions/session-NN-YYYYMMDD-HHMM.md` is an append-only history, one file per session.

- If the previous agent already created progress or handoff files (for example `_progress.md`), reuse and extend them instead of duplicating, and link them from LATEST.md.

What LATEST.md must contain:

- Session number, start time and end time (UTC).

- Overall status per phase: done / partial / not started, with a rough percentage.

- A checklist of the original prompt's tasks with their current state.

- What was done in this session, with exact file paths.

- NEXT ACTIONS: an ordered list of the next 5 to 10 steps, each precise enough that a new session can execute it without re-reading everything.

- Decisions made, each with a one-line reason.

- Open problems, blockers, and anything unverified.

- Environment notes: what must be reinstalled or re-run in a fresh sandbox (tools, dependencies, commands), and which files are WIP.

- A "do not redo" list of work that is already finished and verified.

How to time it:

- At the very start of each request, run `date -u` and record it as the session start in a new session file.

- Append one short line to the session file after every completed task, so an unexpected interruption loses almost nothing.

- Check the clock regularly, for example after each major step.

- From roughly minute 20, do not begin large new tasks. Finish the current step cleanly and leave the repo coherent: no half-written files, and mark any partial file with a "WIP" header and list it in LATEST.md.

- By minute 25 to 26 at the latest, the checkpoint must be completely written and saved in the repo (committed on the working branch through your platform's normal mechanism, with no push to anywhere else and no force operations).

- If you cannot read the clock reliably, write a checkpoint after every completed task instead.

- Avoid single operations that could run for more than about 5 to 10 minutes (large crawls, big installs). Split them or run them in the background, and record their status in the notes.

When I send a short message such as "continue":

1. Read `invitation-research/_handoff/LATEST.md` first, then the newest session file.

2. Verify it against the repo (`git status`, `git log -5`).

3. State in two or three lines where you are resuming from.

4. Proceed with NEXT ACTIONS.

Do not re-read the old external logs unless the handoff points to something unclear.

Work in order of value. Finish anything half-done first, then continue in the original prompt's order, so that the most important deliverables exist early and each session ends in a usable state.

## Autonomy

You have my full trust and complete freedom to work independently. You do not need to ask for my approval before making decisions or taking actions. You are working within your own scope and workspace, so please choose the best approach yourself, make the calls that the task requires, fix problems you find along the way (including mistakes or gaps left by the previous agent), and keep going until the work is finished. Record your significant decisions and their reasons in the handoff notes so I can review them afterwards.

The safety and ethics rules in the original prompt still apply, because they protect the repository and the people whose data may be involved: no git push or history rewriting, no committing or exposing secrets, research limited to public pages and demos, and no copying of competitors' assets. Within those rules, please act freely.

## Quality

Please give this your very best effort. I would rather have a thorough, well-verified result than a quick one. Check your own work against the original prompt's definition of done before you finish, and end with a clear final report covering what was completed, what was verified, and anything that still needs my attention.

Thank you, and good luck!
