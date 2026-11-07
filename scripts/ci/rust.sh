#!/usr/bin/env bash
# CI job "rust" (B-020, ADR-A2): every Rust crate in the repository against a database migrated by drizzle-kit, the only
# migration owner. The service crate (R-01) must be formatted and lint-clean, build from its committed query metadata
# alone, keep its contract artifacts current, and serve its slices end to end through the Next.js call sites: views
# (R-02), RSVP (R-03) and wishes (R-04), with host idempotency keys bound to their owner (s29, D-046). The s26 feasibility
# experiment is frozen research and only has to keep passing.
#   POSTGRES_URL=postgres://…/scratch bash scripts/ci/rust.sh        # locally: bash scripts/ci/local.sh rust
set -euo pipefail
cd "$(dirname "$0")/../.."
. scripts/ci/lib.sh
ci_require_database
export TEST_DATABASE_URL=${TEST_DATABASE_URL:-$POSTGRES_URL}

SERVICE=services/api
EXPERIMENT=invitation-research/08-backend-rust-plan/feasibility-s26
API_PORT=${API_PORT:-8090}
# The RSVP acceptance serves the owner-token JWKS itself (keys made per run, no Clerk credential) and needs limits low
# enough to reach their boundaries.
JWKS_PORT=${JWKS_PORT:-8091}
OWNER_ISSUER=https://clerk.invitesion.test
OWNER_PARTY=http://127.0.0.1:3100
RSVP_LIMIT_LINK=8
RSVP_LIMIT_IP=20
WISH_LIMIT_LINK=8
WISH_LIMIT_IP=20

API_PID=
API_SECRET=
stop_api() { if [ -n "$API_PID" ]; then kill "$API_PID" 2> /dev/null || true; wait "$API_PID" 2> /dev/null || true; fi; }
trap stop_api EXIT

# The real binary on the migrated database, configured for every slice's end-to-end check.
start_api() {
  API_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  SQLX_OFFLINE=true cargo build -q --locked --manifest-path "$SERVICE/Cargo.toml" --bin invitesion-api
  local bin
  bin="$(cargo metadata --format-version 1 --no-deps --manifest-path "$SERVICE/Cargo.toml" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).target_directory))')/debug/invitesion-api"
  DATABASE_URL=$POSTGRES_URL INTERNAL_API_SECRET=$API_SECRET PORT=$API_PORT RUST_LOG=warn \
    OWNER_TOKEN_ISSUER=$OWNER_ISSUER OWNER_TOKEN_JWKS_URL="http://127.0.0.1:$JWKS_PORT/.well-known/jwks.json" \
    OWNER_TOKEN_AUTHORIZED_PARTIES=$OWNER_PARTY \
    RATE_LIMIT_RSVP_LINK="$RSVP_LIMIT_LINK/600" RATE_LIMIT_RSVP_IP="$RSVP_LIMIT_IP/600" \
    RATE_LIMIT_WISH_LINK="$WISH_LIMIT_LINK/600" RATE_LIMIT_WISH_IP="$WISH_LIMIT_IP/600" \
    "$bin" > "$CI_OUT/api.log" 2>&1 &
  API_PID=$!
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$API_PORT/v1/health"; then return 0; fi
    kill -0 "$API_PID" 2> /dev/null || { cat "$CI_OUT/api.log"; return 1; }
    sleep 1
  done
  echo "the API did not answer /v1/health" >&2
  return 1
}

# R-02: the guest page's view writer selection against the binary.
views_end_to_end() {
  API_BASE_URL="http://127.0.0.1:$API_PORT" INTERNAL_API_SECRET=$API_SECRET npx tsx scripts/verify-views-api.ts
}

# R-03: the guest's RSVP action and the host's dashboard action, through both writers, against the binary.
rsvp_end_to_end() {
  API_BASE_URL="http://127.0.0.1:$API_PORT" INTERNAL_API_SECRET=$API_SECRET OWNER_TOKEN_JWKS_PORT=$JWKS_PORT \
    OWNER_TOKEN_ISSUER=$OWNER_ISSUER OWNER_TOKEN_AUTHORIZED_PARTIES=$OWNER_PARTY \
    RSVP_LIMIT_LINK=$RSVP_LIMIT_LINK RSVP_LIMIT_IP=$RSVP_LIMIT_IP npx tsx scripts/verify-rsvp-api.ts
}

# R-04: the guest's wish action and the host's moderation and reply actions, through both writers, against the binary.
wishes_end_to_end() {
  API_BASE_URL="http://127.0.0.1:$API_PORT" INTERNAL_API_SECRET=$API_SECRET OWNER_TOKEN_JWKS_PORT=$JWKS_PORT \
    OWNER_TOKEN_ISSUER=$OWNER_ISSUER OWNER_TOKEN_AUTHORIZED_PARTIES=$OWNER_PARTY \
    WISH_LIMIT_LINK=$WISH_LIMIT_LINK WISH_LIMIT_IP=$WISH_LIMIT_IP npx tsx scripts/verify-wishes-api.ts
}

# B-033: every roster call site (both lists, invite-only events, the import and its undo, self-registration and the
# host's decisions) through both writers against the binary, with the default registration limits.
roster_end_to_end() {
  API_BASE_URL="http://127.0.0.1:$API_PORT" INTERNAL_API_SECRET=$API_SECRET OWNER_TOKEN_JWKS_PORT=$JWKS_PORT \
    OWNER_TOKEN_ISSUER=$OWNER_ISSUER OWNER_TOKEN_AUTHORIZED_PARTIES=$OWNER_PARTY npx tsx scripts/verify-roster-api.ts
}

# s29: a host's Idempotency-Key replays only to its owner, on the same invitation and guest or wish (signed requests with
# chosen keys and valid owner tokens, against the binary).
host_replay_isolation() {
  API_BASE_URL="http://127.0.0.1:$API_PORT" INTERNAL_API_SECRET=$API_SECRET OWNER_TOKEN_JWKS_PORT=$JWKS_PORT \
    OWNER_TOKEN_ISSUER=$OWNER_ISSUER OWNER_TOKEN_AUTHORIZED_PARTIES=$OWNER_PARTY npx tsx scripts/verify-host-replay-isolation.ts
}

step "migrate (drizzle-kit)" pnpm db:migrate
step "toolchain" cargo --version
if [ -f "$SERVICE/Cargo.toml" ]; then
  step "fmt ($SERVICE)" cargo fmt --manifest-path "$SERVICE/Cargo.toml" --check
  # SQLX_OFFLINE: every query must build from the committed .sqlx metadata alone.
  step "clippy ($SERVICE, offline metadata)" env SQLX_OFFLINE=true cargo clippy --manifest-path "$SERVICE/Cargo.toml" --locked --all-targets -- -D warnings
  step "test ($SERVICE)" env SQLX_OFFLINE=true cargo test --manifest-path "$SERVICE/Cargo.toml" --locked
  step "contract: openapi.json, schema.d.ts, .sqlx" bash scripts/api/contract.sh check
  step "api binary (owner tokens, RSVP and wish limits)" start_api
  step "views end to end (BACKEND_VIEWS=rust)" views_end_to_end
  step "rsvp end to end (BACKEND_RSVP, both writers)" rsvp_end_to_end
  step "wishes end to end (BACKEND_WISHES, both writers)" wishes_end_to_end
  step "roster end to end (BACKEND_ROSTER, both writers)" roster_end_to_end
  step "host replay isolation (owner, invitation, resource)" host_replay_isolation
fi
step "test ($EXPERIMENT)" cargo test --manifest-path "$EXPERIMENT/Cargo.toml" --locked
