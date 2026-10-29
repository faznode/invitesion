# invitation-research/

Research, benchmarks and plans for the Invitesion competitor-research + template-harness mission.
**Resume from `_handoff/LATEST.md`.** Every requirement of the original prompt, with its status and location, is in `_handoff/prompt-map.md`.

## Layout (grouped by nature)

| Path | Nature | Contents |
|---|---|---|
| `_handoff/` | Resume material | `LATEST.md` (single entry point, overwritten each checkpoint) · `prompt-map.md` (prompt requirement → repo state) · `briefs/` (verbatim owner briefs) · `sessions/` (append-only session logs) |
| `_progress.md` · `_evidence-index.md` · `_open-questions.md` · `_rea-playbook.md` | Mission control (names and location fixed by the prompt) | phase board + history · evidence IDs · decisions and owner questions · REA cheat-sheet |
| `_tools/` | Executable tooling only | `ops/` sandbox bootstrap, handoff zips · `safety/` commit guard, secrets scan, discovery redaction · `discovery/` homepage probe, demo discovery, demo selection · `capture/` capture pipeline, robots.txt gate (+ test), batch runner, summarizer · `setup/` skill vetting, local demo seed |
| `00-setup/` … `09-masterplan/` | Phase deliverables (documents) | `00` setup log, skill vetting report · `01` codebase audit · `02` longlist + shortlist · `03` dossiers + dossier template · `04` protocol, captures summary, `queues/` (capture work queues). `05-` … `09-` are created on first use |
| `raw/` | Collected evidence (machine data, cap 50 MB; 3.4 MB on 2026-10-29) | `<competitor>/` discovery + capture JSON per source · `invitesion/` our own captures · `_discovery/` cross-competitor homepage probe · `_setup/` skill-catalog snapshot · `_captures.csv` capture log |
| `_private/` | Git-ignored, never committed | secrets report, competitor thumbnails, Lighthouse JSON. In the sandbox it lives at `$INVITESION_PRIVATE_DIR` (`/vercel/share/work/invitesion-private`) |

Filing rules: documents go in a phase folder, scripts in `_tools/<group>/`, machine-collected data in `raw/`, generated queues in `04-template-benchmarks/queues/`. Scripts resolve the research root as two levels above their own folder, so keep them exactly two levels deep.

## Commands (from the repo root)

```bash
source /vercel/share/work/tools/env.sh            # after: bash invitation-research/_tools/ops/bootstrap-sandbox.sh git|tools|chrome|check
"$REA_NODE" --test invitation-research/_tools/capture/robots.test.mjs           # 6/6
python3 -B invitation-research/_tools/safety/redact-discovery.py --check         # privacy check after any discovery
python3 -B invitation-research/_tools/capture/summarize-captures.py              # -> 04-template-benchmarks/captures-summary.csv
bash invitation-research/_tools/capture/run-batch.sh invitation-research/04-template-benchmarks/queues/<queue>.tsv   # background only
bash invitation-research/_tools/safety/commit-guard.sh                           # before every commit
```

## ID conventions

- Captures `C-<CODE>-NNN`. Naming hazard: `C-INV-0xx` = **our own Invitesion** (`raw/invitesion/`), `C-INV-1xx` = **INVI.ID** competitor (`raw/invi/`).
- Sources `S-<CODE>-NNN` · decisions `D-NNN` · questions `Q-D…` (decided autonomously) and `Q-O…` (owner) · modules `M-NNN` · features `F-NNN` · quality findings `QA-NNN`.
- Evidence tags (R5): `[OBSERVED]` `[CLAIMED]` `[ESTIMATE]` `[INFERRED]` `[UNKNOWN]`.

## Path changes (session 05, 2026-10-29)

Session logs are append-only, so sessions 01–04 still cite the old paths. Living documents were rewritten.

| Old path (under `invitation-research/`) | New path |
|---|---|
| `00-setup/scripts/bootstrap-sandbox.sh`, `make-handoff-zips.sh` | `_tools/ops/` |
| `00-setup/scripts/commit-guard.sh`, `secrets-scan.py` · `03-teardowns/scripts/redact-discovery.py` | `_tools/safety/` |
| `02-competitor-discovery/scripts/probe-homepages.py` · `03-teardowns/scripts/discover-demos.mjs`, `select-demos.py` | `_tools/discovery/` |
| `00-setup/scripts/capture.mjs`, `robots.mjs`, `robots.test.mjs` · `04-template-benchmarks/scripts/run-batch.sh`, `summarize-captures.py` | `_tools/capture/` |
| `00-setup/scripts/vet-skills.py` · `01-codebase-audit/scripts/seed-local-demo.ts` | `_tools/setup/` |
| `00-setup/skill-issue-catalog-2026-10-29.json` | `raw/_setup/` |
| `02-competitor-discovery/candidates.txt`, `probe-2026-10-29.jsonl` | `raw/_discovery/` |
| `04-template-benchmarks/queue-tier-a*.tsv` | `04-template-benchmarks/queues/` |

Outside this folder, at the repo root: `REBUILD-HANDOFF-A-Z.md` → `docs/specs/`, `artifacts/navigation/*.png` → `docs/worklog/assets/2026-07-18-public-navigation/`, and `README.md` (Next.js starter boilerplate) and `tokens.css` (unused old-brand tokens) → `archive/` (see `archive/README.md`).
