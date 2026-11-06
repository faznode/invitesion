#!/usr/bin/env bash
# CI job "rust" (B-020, ADR-A2): every Rust crate in the repository against a database migrated by drizzle-kit, the only
# migration owner. The service crate (R-01) must be formatted and lint-clean, build from its committed query metadata
# alone, keep its contract artifacts current, and serve the views slice (R-02) end to end through the Next.js call site.
# The s26 feasibility experiment is frozen research and only has to keep passing.
#   POSTGRES_URL=postgres://…/scratch bash scripts/ci/rust.sh        # locally: bash scripts/ci/local.sh rust
set -euo pipefail
cd "$(dirname "$0")/../.."
. scripts/ci/lib.sh
ci_require_database
export TEST_DATABASE_URL=${TEST_DATABASE_URL:-$POSTGRES_URL}

SERVICE=services/api
EXPERIMENT=invitation-research/08-backend-rust-plan/feasibility-s26
API_PORT=${API_PORT:-8090}

API_PID=
stop_api() { if [ -n "$API_PID" ]; then kill "$API_PID" 2> /dev/null || true; wait "$API_PID" 2> /dev/null || true; fi; }
trap stop_api EXIT

# R-02 end to end: the real binary on the migrated database, called by the guest page's writer selection.
views_end_to_end() {
  local secret
  secret=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  SQLX_OFFLINE=true cargo build -q --locked --manifest-path "$SERVICE/Cargo.toml" --bin invitesion-api
  local bin
  bin="$(cargo metadata --format-version 1 --no-deps --manifest-path "$SERVICE/Cargo.toml" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).target_directory))')/debug/invitesion-api"
  DATABASE_URL=$POSTGRES_URL INTERNAL_API_SECRET=$secret PORT=$API_PORT RUST_LOG=warn "$bin" > "$CI_OUT/api.log" 2>&1 &
  API_PID=$!
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$API_PORT/v1/health"; then break; fi
    kill -0 "$API_PID" 2> /dev/null || { cat "$CI_OUT/api.log"; return 1; }
    sleep 1
  done
  API_BASE_URL="http://127.0.0.1:$API_PORT" INTERNAL_API_SECRET=$secret npx tsx scripts/verify-views-api.ts
}

step "migrate (drizzle-kit)" pnpm db:migrate
step "toolchain" cargo --version
if [ -f "$SERVICE/Cargo.toml" ]; then
  step "fmt ($SERVICE)" cargo fmt --manifest-path "$SERVICE/Cargo.toml" --check
  # SQLX_OFFLINE: every query must build from the committed .sqlx metadata alone.
  step "clippy ($SERVICE, offline metadata)" env SQLX_OFFLINE=true cargo clippy --manifest-path "$SERVICE/Cargo.toml" --locked --all-targets -- -D warnings
  step "test ($SERVICE)" env SQLX_OFFLINE=true cargo test --manifest-path "$SERVICE/Cargo.toml" --locked
  step "contract: openapi.json, schema.d.ts, .sqlx" bash scripts/api/contract.sh check
  step "views end to end (BACKEND_VIEWS=rust)" views_end_to_end
fi
step "test ($EXPERIMENT)" cargo test --manifest-path "$EXPERIMENT/Cargo.toml" --locked
