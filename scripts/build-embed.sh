#!/usr/bin/env bash
# Static-export build for embedding in Poseidon. Route handlers are
# incompatible with `output: "export"`, so app/api is moved aside for the
# build and always restored (trap).
set -euo pipefail
cd "$(dirname "$0")/.."

trap 'if [ -d .api-excluded ]; then rm -rf app/api; mv .api-excluded app/api; fi' EXIT
mv app/api .api-excluded

TERMINAL_EMBED=1 NEXT_PUBLIC_API_BASE=/api/terminal NEXT_PUBLIC_EMBED_HOME=/ npx next build

if [ -n "${EMBED_DEST:-}" ]; then
  mkdir -p "$EMBED_DEST"
  # Clear previous bundle but preserve the host's provenance note (BUNDLE.md).
  find "${EMBED_DEST:?}" -mindepth 1 ! -name 'BUNDLE.md' -delete
  cp -r out/* "$EMBED_DEST"/
  echo "Bundle synced to $EMBED_DEST"
else
  echo "Bundle in $(pwd)/out — set EMBED_DEST to sync it somewhere"
fi
