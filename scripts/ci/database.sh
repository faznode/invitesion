#!/usr/bin/env bash
# CI job "database" (B-020): migrations from empty, schema drift, the template seed, and the database-backed checks
# AGENTS.md requires before anything is called done (verify-payment, verify-view-dedupe).
#   POSTGRES_URL=postgres://…/scratch bash scripts/ci/database.sh       # locally: bash scripts/ci/local.sh database
set -euo pipefail
cd "$(dirname "$0")/../.."
. scripts/ci/lib.sh
ci_require_database

migration_fingerprint() { find lib/db/migrations -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum; }

# drizzle-kit owns every migration (ADR-A2). A schema.ts change without its generated migration is drift.
no_schema_drift() {
  local before after log="$CI_OUT/drizzle-generate.log"
  before=$(migration_fingerprint)
  pnpm exec drizzle-kit generate > "$log" 2>&1 || { cat "$log"; return 1; }
  after=$(migration_fingerprint)
  if [ "$before" != "$after" ]; then
    cat "$log"
    echo "lib/db/schema.ts differs from the committed migrations: run pnpm db:generate and commit the result" >&2
    return 1
  fi
  grep -q 'No schema changes' "$log" || { cat "$log"; echo "unexpected drizzle-kit output" >&2; return 1; }
}

step "migrate from empty (drizzle-kit)" pnpm db:migrate
step "schema drift (drizzle-kit generate is a no-op)" no_schema_drift
step "seed the theme catalog" pnpm db:seed:templates
step "seed a customer row (fictional email)" env CUSTOMER_SEED_EMAIL=ci-customer@example.com pnpm db:seed
step "seed the demo invitations (Budi & Sari)" npx tsx invitation-research/_tools/setup/seed-local-demo.ts
step "verify-payment (QRIS / Stripe vectors)" npx tsx scripts/verify-payment.ts
step "verify-view-dedupe (B-017a)" npx tsx scripts/verify-view-dedupe.ts
step "verify-theme-entitlement (B-041)" npx tsx scripts/verify-theme-entitlement.ts
