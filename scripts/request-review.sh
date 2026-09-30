#!/bin/sh
# Requests both reviewers of record on a pull request, for its current head:
#   - GitHub Copilot code review, as a formal reviewer (re-requesting after a
#     push asks it to review the new head);
#   - Codex, through an `@codex review` comment -- it is a GitHub App, and the
#     review-request API only accepts collaborators, so a comment is the only
#     way to ask it.
#
# Usage: sh scripts/request-review.sh [pr-number] [scope note]
#   pr-number   defaults to the pull request of the current branch
#   scope note  e.g. "confirmation round: fix commits since abc1234, fix-now only"
set -eu

if ! command -v gh >/dev/null 2>&1; then
  echo "request-review: gh not found." >&2
  exit 1
fi

pr=${1:-$(gh pr view --json number --jq .number)}
scope=${2:-}
head=$(gh pr view "$pr" --json headRefOid --jq .headRefOid)
short=$(printf '%s' "$head" | cut -c1-7)

gh pr edit "$pr" --add-reviewer @copilot >/dev/null
echo "requested: Copilot on #$pr" >&2

body="@codex review -- head \`$short\`."
[ -n "$scope" ] && body="$body Scope: $scope"
gh pr comment "$pr" --body "$body" >/dev/null
echo "requested: Codex on #$pr (head $short)" >&2
