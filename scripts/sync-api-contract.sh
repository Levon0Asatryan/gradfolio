#!/bin/sh
# Takes gradfolio-api's openapi.yaml at one commit, pins that commit and
# regenerates the types (Q5). Usage: sh scripts/sync-api-contract.sh <40-char sha>
set -eu

sha=${1:-}
case "$sha" in
  [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]*) ;;
  *) echo "usage: sh scripts/sync-api-contract.sh <commit sha of gradfolio-api>" >&2; exit 1 ;;
esac
[ "${#sha}" -eq 40 ] || { echo "sync-api-contract: pass the full 40-character sha." >&2; exit 1; }

dir=src/lib/api
gh api -H "Accept: application/vnd.github.raw" \
  "repos/Levon0Asatryan/gradfolio-api/contents/openapi.yaml?ref=$sha" > "$dir/openapi.yaml.tmp"
mv "$dir/openapi.yaml.tmp" "$dir/openapi.yaml"
printf '%s\n' "$sha" > "$dir/openapi.source"
npm run api:types
