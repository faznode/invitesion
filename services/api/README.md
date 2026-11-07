<!-- SUMMARY (first 7 lines — greppable) -->
# services/api — Invitesion domain API in Rust (ADR-A2; R-01 foundation, R-02 views, R-03 RSVP, R-04 wishes)
> WHAT: The authoritative writer for migrated data domains, one at a time. Next.js selects the live writer per domain with `BACKEND_<DOMAIN>` and calls this service only from server code with the internal service signature. Domains with a Rust writer: views (R-02, `BACKEND_VIEWS`), RSVP (R-03, `BACKEND_RSVP`) and wishes (R-04, `BACKEND_WISHES`); all default to `next`.
> STATUS: s29 (2026-11-07): host idempotency keys bound to their owner, invitation and resource (D-046, E-062), proven against the binary. s28 (2026-11-06): R-01…R-04 built and tested in the sandbox (Rust unit, vector and database tests; shared vectors in both languages; views, RSVP and wishes end to end through the Next.js call sites against the running binary). Not deployed: the preview deployment, its latency and cold-start figures, trace export and each slice's 7-day observation are owner steps.
> OWNER: Operator role
> DEPS: ../../invitation-research/09-masterplan/09-backend-and-frontend-architecture.md §8, ../../invitation-research/09-masterplan/06-backlog.md (R-01…R-04), ../../contracts/vectors/, ../../lib/api/, ../../lib/backend.ts, ../../lib/invitation/rsvp-writer.ts, ../../lib/invitation/wish-writer.ts
> GREP: rust, axum, sqlx, utoipa, openapi, service signature, owner token, jwks, problem+json, idempotency-key, rate limit, BACKEND_VIEWS, BACKEND_RSVP, BACKEND_WISHES, moderation, R-01, R-02, R-03, R-04
> UPDATED: 2026-11-07

## Endpoints
| Method and path | Auth | Purpose |
|---|---|---|
| `GET /v1/health` | none | Liveness; touches nothing else |
| `GET /v1/health/ready` | service signature | Readiness: one round trip to Postgres (503 `database.unavailable` otherwise) |
| `GET /v1/me` | signature + owner token | The owner-token chain end to end: RS256 against the JWKS, `sub` → `users.clerk_user_id`, role from the database |
| `POST /v1/views` | service signature | R-02: one invitation open, deduplicated per 30-minute window (B-017a) |
| `POST /v1/guest-links/{slug}/{guest}/rsvp` | service signature | R-03: a guest's RSVP through their personal link (token, or the slug of a guest without one; B-011). Limits per link and per address; `Idempotency-Key` |
| `POST /v1/invitations/{invitation}/guests/{guest}/rsvp-override` | signature + owner token | R-03: the host sets one guest's answer, for the invitation or one event; ownership and role from the database; `Idempotency-Key` |
| `POST /v1/guest-links/{slug}/{guest}/wishes` | service signature | R-04: a guest's wish through their personal link; stored `PENDING` while the guestbook is moderated. Limits per link and per address; `Idempotency-Key` |
| `POST /v1/invitations/{invitation}/wishes/{wish}/moderation` | signature + owner token | R-04: the host shows (approves or restores), hides or deletes one wish of their invitation; `Idempotency-Key` |
| `POST /v1/invitations/{invitation}/wishes/{wish}/reply` | signature + owner token | R-04: the host's reply under one wish; a blank reply clears it; `Idempotency-Key` |

The contract is `openapi.json` (OpenAPI 3.1, generated from the code). Errors are RFC 9457 `application/problem+json` with a stable `code` (`domain.reason`), including timeouts (`request.timeout`); a 422 names its subject (`eventId`, `questionId`) and a 429 carries `Retry-After`. Every response carries `x-request-id` (taken from Next.js or minted here).

## RSVP (R-03, D-043)
- **One transaction per write:** the guest row is locked (`for update`), the shared decision (`contracts/vectors/rsvp-decisions.json`, run in both languages) runs on the config read inside the transaction, and status, headcount, answers and per-event answers are set by one UPDATE with the RSVP analytics row beside it. Stored shapes are the TypeScript writer's.
- **Problems:** `rsvp.link_not_found` (404: no published invitation or no guest for the link), `rsvp.closed` (409: `disabled`, `deadline` or `expired`), `rsvp.status_invalid`, `rsvp.event_answer_missing` (+ `eventId`), `rsvp.answer_invalid` (+ `questionId`), `rsvp.override_invalid` (422), `invitation_or_guest.not_found` (404: not this owner's), `owner.unknown_user` / `owner.role_not_allowed` (403), `rate_limit.exceeded` (429).
- **`Idempotency-Key`:** 1–255 visible ASCII characters, recorded with the response in the write's own transaction and kept 24 hours (`api_idempotency_keys`). The same key and request replay the committed answer with `Idempotent-Replayed: true`; the same key with another request is 422 `idempotency.key_reused`. Refusals record nothing. A key replays only inside its scope (D-046): a guest write's scope is the guest its link resolves to (`rsvp:guest:<guest>`, `wish:guest:<guest>`); a host write's is the owner resolved from the verified token, the invitation and the guest or wish (`idempotency::host_scope`, e.g. `wish:host:<owner>:<invitation>:<wish>`). Another customer, another invitation or another resource never reads a cached answer or a 422: the request is judged afresh and the ownership check refuses it (404). The same owner's retry still replays, including a delete whose row is gone. `scripts/verify-host-replay-isolation.ts` proves it against the binary. Next.js sends a key with every write and resends an unknown outcome once under the same key (`lib/invitation/rsvp-writer.ts`).
- **Limits (B-013):** fixed windows in `api_rate_limits`, shared by every instance, checked after a replay and before the transaction: per link (`rsvp:link:<guest id>`) and per address (`rsvp:ip:<HMAC>`). The address is the one Next.js derived by its trusted-proxy contract (`TRUSTED_PROXY_HOPS`); IPv4 counts by address and IPv6 by /64, and only an HMAC of that key under the service secret is stored. Something that is not an IP literal skips the per-address limit (logged without the value).

## Wishes (R-04, D-044)
- **States:** a wish is `VISIBLE` (`is_hidden` false), `PENDING` (hidden and never reviewed: the guestbook was moderated when it arrived) or `HIDDEN` (hidden by the host, `reviewed_at` set). The guest page lists visible wishes only, with the host's reply under them; a hosts-only guestbook (`visibility: host`) lists none. Migration 0017 adds `reviewed_at`, `host_reply`, `replied_at` and the index `guest_messages_invitation_visible_idx (invitation_id, is_hidden, created_at)`, which the guest page's list and count use.
- **One transaction per write:** the guest's wish inserts the row and its `GUESTBOOK` analytics row together; moderation and replies lock the owner's wish (`for update`) and change only its own columns. The shared decision (`contracts/vectors/wish-decisions.json`, run in both languages) decides switch, message, moderation and reply text.
- **Problems:** `wish.link_not_found` (404), `wish.closed` (409: the guestbook is switched off), `wish.message_invalid` / `wish.reply_invalid` (422: empty, over 1,000 UTF-16 units, or U+0000), `invitation_or_wish.not_found` (404: not this owner's invitation or not its wish), `owner.unknown_user` / `owner.role_not_allowed` (403), `rate_limit.exceeded` (429).
- **`Idempotency-Key` and limits** as for RSVP: the guest page mints a key per rendered form (`lib/invitation/rsvp-form-key.ts`), the writer one per host action; limiter keys `wish:link:<guest id>` and `wish:ip:<HMAC>`. A key reused with another message is a new wish to Next.js (an old page brought back and changed), sent under a fresh key.

## Rules
- **One writer per column group.** A domain moves every writer of its columns at once; `BACKEND_<DOMAIN>` selects exactly one implementation per call, with no fallback to the other (`lib/backend.ts`, `lib/invitation/view-writer.ts`, `lib/invitation/rsvp-writer.ts`, `lib/invitation/wish-writer.ts`).
- **drizzle-kit owns migrations.** Nothing here runs DDL. Queries are compile-time checked (`sqlx::query!`) against a database migrated by drizzle-kit; the metadata in `.sqlx/` lets builds run without a database (`SQLX_OFFLINE=true`). The API's own operational tables (migration 0016: idempotency keys, rate limits) and the wishes columns and index (0017) are drizzle migrations too.
- **Shared behaviour is proven by shared vectors** run in both languages: `contracts/vectors/service-signature.json` (expected values from an independent implementation), `view-dedupe.json`, `rsvp-rules.json`, `rsvp-decisions.json` and `wish-decisions.json`.
- **Not browser-facing.** No CORS; every call except liveness is signed: `x-invitesion-signature: t=<unix>,v1=<hex HMAC-SHA256 of t.METHOD.path_and_query.sha256hex(body)>` over the path exactly as sent (percent-encoded segments included), 60 s skew, two secrets during a rotation. Bodies are bounded to 1 MiB (Next.js's server-action limit) and verified before any extractor.

## Configuration
| Variable | Required | Meaning |
|---|---|---|
| `DATABASE_URL` (or `POSTGRES_URL`) | yes | The application database (through the provider's pooler in production) |
| `INTERNAL_API_SECRET` | yes, ≥ 32 bytes | Service signature secret, shared with Next.js; also keys the address hashes of the limiter |
| `INTERNAL_API_SECRET_PREVIOUS` | during a rotation | Accepted alongside the current secret |
| `OWNER_TOKEN_ISSUER`, `OWNER_TOKEN_JWKS_URL` | both or neither | Owner tokens (Clerk issuer and its JWKS URL); without them owner endpoints answer 503 |
| `OWNER_TOKEN_AUTHORIZED_PARTIES` | recommended | Comma-separated allowed `azp` origins |
| `RATE_LIMIT_RSVP_LINK` | no (`10/600`) | RSVP writes per guest link per window, as `<count>/<seconds>` |
| `RATE_LIMIT_RSVP_IP` | no (`60/600`) | RSVP writes per address (IPv6: per /64) per window |
| `RATE_LIMIT_WISH_LINK` | no (`5/600`) | Wishes per guest link per window |
| `RATE_LIMIT_WISH_IP` | no (`60/600`) | Wishes per address (IPv6: per /64) per window |
| `PORT` | no (8080) | Standalone server port |
| `DATABASE_STATEMENT_CACHE` | no (0) | Prepared-statement cache; keep 0 behind a transaction pooler |
| `RUST_LOG` | no | Log filter (default `info,sqlx=warn`); logs are JSON lines |

Next.js needs `API_BASE_URL` and the same `INTERNAL_API_SECRET`, `BACKEND_VIEWS=rust` / `BACKEND_RSVP=rust` / `BACKEND_WISHES=rust` to move a slice, and `TRUSTED_PROXY_HOPS` when it runs behind anything other than Vercel's edge.

## Develop and verify
```
export CARGO_TARGET_DIR=/vercel/share/work/rust/target    # build output stays outside the project
cargo fmt --check && SQLX_OFFLINE=true cargo clippy --locked --all-targets -- -D warnings
SQLX_OFFLINE=true TEST_DATABASE_URL=postgres://…/scratch cargo test --locked
bash scripts/api/contract.sh check     # openapi.json, lib/api/schema.d.ts and .sqlx are current
```
CI runs all of it in the `rust` job (`scripts/ci/rust.sh`, locally `scripts/ci/local.sh rust`), then starts the binary once (owner tokens from a JWKS the acceptance scripts serve themselves with one shared key pair, RSVP and wish limits 8 / 20 per 600 s) and runs `scripts/verify-views-api.ts`, `scripts/verify-rsvp-api.ts` and `scripts/verify-wishes-api.ts` through the Next.js call sites.

## Deployment (owner steps, not done from the sandbox)
- A separate Vercel project with root directory `services/api` (the Rust runtime is beta on Fluid compute); `vercel.json` sends every path to `api/index.rs` and pins `sin1` beside the database. Fallback: the same binary as a container (`src/main.rs`).
- R-01's remaining acceptance: the preview deployment answers health within SLO and records its cold start; trace export once a collector endpoint is chosen.
- Each slice's rollout: `BACKEND_<DOMAIN>=rust` on preview under load, then production, 7 days within the error budget, then the TypeScript writer is removed. RSVP and wishes also need `OWNER_TOKEN_*` (the Clerk issuer and JWKS) for the host's operations. Rollback at any point: `BACKEND_<DOMAIN>=next`; nothing to migrate back (the columns are shared, 0016's tables are the API's own, and 0017 is additive).
