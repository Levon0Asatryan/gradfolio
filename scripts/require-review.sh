#!/bin/sh
# Refuses a push until /gradfolio-web-review has been run against exactly this
# commit and came back with nothing outstanding. The receipt is written by the
# skill's final step to .review/.last-review.json.
#
# The point is that the review happens BEFORE the reviewer sees the branch: a
# defect found here costs minutes; found by the reviewer it costs a round.
#
# The receipt, and the verify step after this in the hook, are about HEAD. As
# the pre-push hook, git writes the refs being pushed to stdin; a push of any
# other commit (`git push origin other-branch`) is refused, or a clean receipt
# for this branch would carry an unreviewed one out. Run by hand with nothing on
# stdin, it judges HEAD. Tested by src/testing/push-gates.test.ts.
set -eu

receipt=".review/.last-review.json"
head=$(git rev-parse HEAD)
zero=0000000000000000000000000000000000000000

if [ "${SKIP_REVIEW_GATE:-}" = "1" ]; then
  echo "review gate: skipped by SKIP_REVIEW_GATE=1. Say so in the PR's 'Not verified'." >&2
  exit 0
fi

updates=""
[ -t 0 ] || updates=$(cat)
pushed=$(printf '%s\n' "$updates" | while read -r _local_ref local_oid _remote_ref _remote_oid; do
  # Deletions push no commit.
  [ -n "$local_oid" ] && [ "$local_oid" != "$zero" ] && [ "$local_oid" != "$head" ] && echo "$local_oid"
done || true)
if [ -n "$pushed" ]; then
  cat >&2 <<MSG
refusing: this push sends $(printf '%s' "$pushed" | head -1 | cut -c1-7), which is not HEAD ($(printf '%s' "$head" | cut -c1-7)).

The review receipt and verify both judge HEAD. Check out the branch you are
pushing, then push it from there.
MSG
  exit 1
fi

# Docs-only pushes do not need a code review.
base=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
if [ -n "$base" ]; then
  changed=$(git diff --name-only "$base" HEAD | grep -vE '^(docs/|\.review/|.*\.md$)' || true)
  if [ -z "$changed" ]; then
    echo "review gate: docs-only push, nothing to review." >&2
    exit 0
  fi
fi

if [ ! -f "$receipt" ]; then
  cat >&2 <<MSG
refusing: no review receipt.

Run /gradfolio-web-review and fix what it finds, then push. It writes
$receipt when it finishes clean.

To push anyway: SKIP_REVIEW_GATE=1 git push ... , and say so in the PR.
MSG
  exit 1
fi

reviewed=$(sed -n 's/.*"sha"[[:space:]]*:[[:space:]]*"\([0-9a-f]*\)".*/\1/p' "$receipt" | head -1)
open=$(sed -n 's/.*"findings_open"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$receipt" | head -1)

if [ "$reviewed" != "$head" ]; then
  cat >&2 <<MSG
refusing: the review receipt is for $reviewed, HEAD is $head.

Commits landed after the review. Re-run /gradfolio-web-review -- on a fix round,
/gradfolio-web-review --fix-round covers pass 0 plus the fix's blast radius.
MSG
  exit 1
fi

if [ "${open:-0}" != "0" ]; then
  echo "refusing: /gradfolio-web-review left ${open} finding(s) open on this commit. Fix or defer them explicitly, then re-run it." >&2
  exit 1
fi

method=$(sed -n 's/.*"method"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$receipt" | head -1)

case "${method:-unset}" in
  gradfolio-web-review | gradfolio-web-review-workflow)
    echo "review gate: reviewed clean at ${head} by ${method}." >&2
    ;;
  *)
    cat >&2 <<MSG
review gate: reviewed clean at ${head}, method "${method:-unset}".

This receipt was not written by /gradfolio-web-review. Name the method in the
PR's "Evidence" section and say which passes actually ran.
MSG
    ;;
esac
