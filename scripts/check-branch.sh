#!/bin/sh
# Refuses a push to `main`, and a push to a branch whose pull request is
# already merged or closed -- commits there go nowhere and have to be
# cherry-picked out. Needs only git and gh, so it also works in a worktree
# with no dependencies installed, where hooks are skipped and this is run by hand.
#
# As the pre-push hook, it judges the refs being pushed, which git writes to
# stdin as "<local-ref> <local-oid> <remote-ref> <remote-oid>" lines -- not the
# checked-out branch, or `git push origin HEAD:main` from a feature branch
# would pass. Run by hand with nothing on stdin, it judges the current branch.
# Tested by src/testing/push-gates.test.ts.
set -eu

zero=0000000000000000000000000000000000000000

refuse_state() {
  cat >&2 <<MSG
refusing: '$1' has a $2 pull request.

Anything committed there is stranded -- the pull request will not pick it up.
Start again from the branch point that is current:

  git fetch origin
  git checkout -B <new-branch> origin/main
  git cherry-pick <the commits you just made>
MSG
  exit 1
}

check() {
  branch=$1
  if [ "$branch" = "main" ] || [ "$branch" = "HEAD" ]; then
    echo "refusing: pushing to '$branch'. Branch from origin/main first." >&2
    exit 1
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "note: gh not found, skipping the pull request state check." >&2
    return 0
  fi

  state=$(gh pr view "$branch" --json state --jq .state 2>/dev/null || echo NONE)
  case "$state" in
    MERGED | CLOSED) refuse_state "$branch" "$state" ;;
  esac
}

updates=""
[ -t 0 ] || updates=$(cat)

if [ -z "$updates" ]; then
  check "$(git rev-parse --abbrev-ref HEAD)"
  exit 0
fi

printf '%s\n' "$updates" | while read -r _local_ref local_oid remote_ref _remote_oid; do
  [ -n "$remote_ref" ] || continue
  # Deleting a remote branch leaves nothing stranded.
  [ "$local_oid" = "$zero" ] && continue
  case "$remote_ref" in
    refs/heads/*) check "${remote_ref#refs/heads/}" ;;
  esac
done
