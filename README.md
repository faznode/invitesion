# Invitesion

Digital invitation SaaS for Indonesia (weddings, birthdays, aqiqah, corporate and other life events). A customer pays once, gets an invitation plus a self-service panel, and shares a personal link with each guest (`/i/<invitation>/<guest>`). Product decisions live in [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md); every document is indexed in [`docs/INDEX.md`](docs/INDEX.md).

## Surfaces

| Surface | Route | Who |
|---|---|---|
| Marketing site | `/`, `/pricing`, `/templates`, `/features`, `/event-types`, `/resources` | Visitors |
| Customer panel | `/dashboard/*` | Signed-in customers (Clerk) |
| Admin panel | private entry from `ADMIN_ENTRY_PATH` (wrong entry = 404) | Internal team |
| Guest invitation | `/i/:slug/:guestSlug` | Guests (no login) |

## Stack

Next.js 15.6 (App Router, canary) · React 19.1 · Tailwind CSS 4 + Radix/shadcn primitives · PostgreSQL with Drizzle ORM (postgres.js) · Clerk for auth (local `users` table keeps identity and roles) · own QRIS (IDR) and Stripe (other currencies) payment rails · S3-compatible storage · Zod · `node:test` via tsx. Details: [`invitation-research/01-codebase-audit/architecture.md`](invitation-research/01-codebase-audit/architecture.md).

## Run locally

```bash
cp .env.example .env          # fill POSTGRES_URL and the Clerk keys; read the comments in the file
pnpm install
pnpm db:migrate && pnpm db:seed:templates
pnpm dev                      # http://localhost:3000
pnpm verify                   # typecheck + unit tests + production build
```

Use `.env`, not `.env.local`. Do not run `pnpm db:setup` (a leftover of the starter template). A reproducible measurement stack (Postgres 16 + production build + seeded demo invitations) is scripted in `invitation-research/_tools/ops/local-stack.sh`.

## Repository map

| Path | What |
|---|---|
| `app/`, `components/`, `lib/`, `middleware.ts` | Product code |
| `scripts/`, `tests/`, `drizzle.config.ts` | Seeds, payment verification, unit tests, migrations config |
| `docs/` | Product decisions, systems, audits, specs (`docs/specs/REBUILD-HANDOFF-A-Z.md`), worklogs |
| `AGENTS.md`, `AGENT_WORKFLOW.md`, `CLAUDE.md` | Rules for coding agents (read `AGENTS.md` first) |
| `.agents/skills/`, `SKILLS-LOCK.md`, `docs/skills-registry.md` | Vetted agent skills and their pinned versions |
| `invitation-research/` | Competitor research, benchmarks and the upgrade masterplan ([`invitation-research/README.md`](invitation-research/README.md)) |
| `archive/` | Retired files kept for reference ([`archive/README.md`](archive/README.md)) |

## License

MIT, see [`LICENSE`](LICENSE).
