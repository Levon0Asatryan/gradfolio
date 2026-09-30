#!/bin/sh
# Refuses a push to `main`, and a push to a branch whose pull request is
# already merged or closed -- commits there go nowhere and have to be
# cherry-picked out. Needs only git and gh, so it also works in a worktree
# with no dependencies installed, where hooks are skipped and this is run by hand.
set -eu

branch=$(git rev-parse --abbrev-ref HEAD)

if [ "$branch" = "main" ] || [ "$branch" = "HEAD" ]; then
  echo "refusing: on '$branch'. Branch from origin/main first." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "note: gh not found, skipping the pull request state check." >&2
  exit 0
fi

state=$(gh pr view "$branch" --json state --jq .state 2>/dev/null || echo NONE)

case "$state" in
  MERGED | CLOSED)
    cat >&2 <<MSG
refusing: '$branch' has a $state pull request.

Anything committed here is stranded -- the pull request will not pick it up.
Start again from the branch point that is current:

  git fetch origin
  git checkout -B <new-branch> origin/main
  git cherry-pick <the commits you just made>
MSG
    exit 1
    ;;
  *)
    exit 0
    ;;
esac
