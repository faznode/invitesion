#!/usr/bin/env bash
# CI job "rust" (B-020, ADR-A2): every Rust crate in the repository against a database migrated by drizzle-kit, the only
# migration owner. The service crate must also be formatted and lint-clean; the s26 feasibility experiment is frozen
# research and only has to keep passing.
#   POSTGRES_URL=postgres://…/scratch bash scripts/ci/rust.sh        # locally: bash scripts/ci/local.sh rust
set -euo pipefail
cd "$(dirname "$0")/../.."
. scripts/ci/lib.sh
ci_require_database
export TEST_DATABASE_URL=${TEST_DATABASE_URL:-$POSTGRES_URL}

SERVICE=services/api
EXPERIMENT=invitation-research/08-backend-rust-plan/feasibility-s26

step "migrate (drizzle-kit)" pnpm db:migrate
step "toolchain" cargo --version
if [ -f "$SERVICE/Cargo.toml" ]; then
  step "fmt ($SERVICE)" cargo fmt --manifest-path "$SERVICE/Cargo.toml" --check
  step "clippy ($SERVICE)" cargo clippy --manifest-path "$SERVICE/Cargo.toml" --locked --all-targets -- -D warnings
  step "test ($SERVICE)" cargo test --manifest-path "$SERVICE/Cargo.toml" --locked
fi
step "test ($EXPERIMENT)" cargo test --manifest-path "$EXPERIMENT/Cargo.toml" --locked
