<!-- SUMMARY (first 7 lines — greppable) -->
# services/api — Invitesion domain API in Rust (ADR-A2; R-01 foundation, R-02 views)
> WHAT: The authoritative writer for migrated data domains, one at a time. Next.js selects the live writer per domain with `BACKEND_<DOMAIN>` and calls this service only from server code with the internal service signature. Live domain: views (R-02, `BACKEND_VIEWS`).
> STATUS: s27 (2026-11-06): R-01 foundation and R-02 views built and tested in the sandbox (20 Rust tests, shared vectors in both languages, end-to-end through the Next.js call site). Not deployed: the preview deployment, its latency and cold-start figures and the 7-day observation are owner steps.
> OWNER: Operator role
> DEPS: ../../invitation-research/09-masterplan/09-backend-and-frontend-architecture.md §8, ../../invitation-research/09-masterplan/06-backlog.md (R-01, R-02), ../../contracts/vectors/, ../../lib/api/, ../../lib/backend.ts
> GREP: rust, axum, sqlx, utoipa, openapi, service signature, owner token, jwks, problem+json, BACKEND_VIEWS, R-01, R-02
> UPDATED: 2026-11-06

## Endpoints
| Method and path | Auth | Purpose |
|---|---|---|
| `GET /v1/health` | none | Liveness; touches nothing else |
| `GET /v1/health/ready` | service signature | Readiness: one round trip to Postgres (503 `database.unavailable` otherwise) |
| `GET /v1/me` | signature + owner token | The owner-token chain end to end: RS256 against the JWKS, `sub` → `users.clerk_user_id`, role from the database |
| `POST /v1/views` | service signature | R-02: one invitation open, deduplicated per 30-minute window (B-017a) |

The contract is `openapi.json` (OpenAPI 3.1, generated from the code). Errors are RFC 9457 `application/problem+json` with a stable `code` (`domain.reason`), including timeouts (`request.timeout`). Every response carries `x-request-id` (taken from Next.js or minted here).

## Rules
- **One writer per column group.** A domain moves every writer of its columns at once; `BACKEND_<DOMAIN>` selects exactly one implementation per call, with no fallback to the other (`lib/backend.ts`, `lib/invitation/view-writer.ts`).
- **drizzle-kit owns migrations.** Nothing here runs DDL. Queries are compile-time checked (`sqlx::query!`) against a database migrated by drizzle-kit; the metadata in `.sqlx/` lets builds run without a database (`SQLX_OFFLINE=true`).
- **Shared behaviour is proven by shared vectors** run in both languages: `contracts/vectors/service-signature.json` (expected values from an independent implementation) and `contracts/vectors/view-dedupe.json`.
- **Not browser-facing.** No CORS; every call except liveness is signed: `x-invitesion-signature: t=<unix>,v1=<hex HMAC-SHA256 of t.METHOD.path_and_query.sha256hex(body)>`, 60 s skew, two secrets during a rotation.

## Configuration
| Variable | Required | Meaning |
|---|---|---|
| `DATABASE_URL` (or `POSTGRES_URL`) | yes | The application database (through the provider's pooler in production) |
| `INTERNAL_API_SECRET` | yes, ≥ 32 bytes | Service signature secret, shared with Next.js |
| `INTERNAL_API_SECRET_PREVIOUS` | during a rotation | Accepted alongside the current secret |
| `OWNER_TOKEN_ISSUER`, `OWNER_TOKEN_JWKS_URL` | both or neither | Owner tokens (Clerk issuer and its JWKS URL); without them owner endpoints answer 503 |
| `OWNER_TOKEN_AUTHORIZED_PARTIES` | recommended | Comma-separated allowed `azp` origins |
| `PORT` | no (8080) | Standalone server port |
| `DATABASE_STATEMENT_CACHE` | no (0) | Prepared-statement cache; keep 0 behind a transaction pooler |
| `RUST_LOG` | no | Log filter (default `info,sqlx=warn`); logs are JSON lines |

Next.js needs `API_BASE_URL` and the same `INTERNAL_API_SECRET`, and `BACKEND_VIEWS=rust` to move the views slice.

## Develop and verify
```
export CARGO_TARGET_DIR=/vercel/share/work/rust/target-api    # build output stays outside the project
cargo fmt --check && SQLX_OFFLINE=true cargo clippy --locked --all-targets -- -D warnings
SQLX_OFFLINE=true TEST_DATABASE_URL=postgres://…/scratch cargo test --locked
bash scripts/api/contract.sh check     # openapi.json, lib/api/schema.d.ts and .sqlx are current
```
CI runs all of it in the `rust` job (`scripts/ci/rust.sh`), then starts the binary and runs `scripts/verify-views-api.ts` through the Next.js call site.

## Deployment (owner steps, not done from the sandbox)
- A separate Vercel project with root directory `services/api` (the Rust runtime is beta on Fluid compute); `vercel.json` sends every path to `api/index.rs` and pins `sin1` beside the database. Fallback: the same binary as a container (`src/main.rs`).
- R-01's remaining acceptance: the preview deployment answers health within SLO and records its cold start. R-02's rollout: `BACKEND_VIEWS=rust` on preview under load, then production, 7 days within the error budget, then the TypeScript writer is removed. Rollback at any point: `BACKEND_VIEWS=next`.
