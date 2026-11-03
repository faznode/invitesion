#!/usr/bin/env bash
# run-spike.sh next|rust — run the three k6 scenarios against ONE target with per-second CPU/RSS sampling.
# Prerequisites: Postgres on :5433 with seed-spike-guests.sql applied; the target listening (next :3100, rust :3200);
# nothing else under test. Writes results/<target>-<scenario>-{k6.json,k6.txt,proc.json}.
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
K6=${K6:-/vercel/share/work/tools/k6}
OUT=${OUT:-$HERE/results}
TARGET=${1:?usage: run-spike.sh next|rust}
case "$TARGET" in
  next) BASE=http://127.0.0.1:3100; SERVER='cwd:/vercel/share/work/app' ;;
  rust) BASE=http://127.0.0.1:3200; SERVER='invitesion-spike' ;;
  *) echo "unknown target $TARGET"; exit 2 ;;
esac
mkdir -p "$OUT"
cd "$HERE"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/i/budi-sari/tamu-001")
[ "$code" = 200 ] || { echo "$TARGET not ready: HTTP $code"; exit 1; }
echo "warm-up: 30 sequential reads"
for i in $(seq 1 30); do curl -s -o /dev/null "$BASE/i/budi-sari/tamu-$(printf %03d "$i")"; done
for SC in read-spike rsvp-burst fixed-read; do
  case "$SC" in read-spike) SECS=66 ;; rsvp-burst) SECS=46 ;; fixed-read) SECS=34 ;; esac
  python3 -B "$HERE/sample-proc.py" --out "$OUT/$TARGET-$SC-proc.json" --seconds "$SECS" \
    --group server="$SERVER" --group postgres=postgres --group platform-dev='cwd:/vercel/share/v0-project' --group k6='k6 run' \
    > "$OUT/$TARGET-$SC-proc.txt" 2>&1 &
  SAMPLER=$!
  "$K6" run -q -e TARGET="$TARGET" -e BASE="$BASE" -e SCENARIO="$SC" --summary-export "$OUT/$TARGET-$SC-k6.json" \
    "$HERE/k6/spike.js" > "$OUT/$TARGET-$SC-k6.txt" 2>&1
  echo "$SC: k6 exit $?"
  wait "$SAMPLER"
  cat "$OUT/$TARGET-$SC-proc.txt"
  sleep 5
done
