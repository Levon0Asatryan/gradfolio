#!/bin/sh
# Says whether each reviewer of record has reviewed the pull request's current
# head commit. A push is reviewed only when BOTH have.
#
#   Copilot  a review whose commit is the head, and which is a real review:
#            "Copilot was unable to review this pull request ... quota limit"
#            is also posted as a review on the head, and does not count.
#
#   Codex    one of these, each tied to THIS head:
#            - a review whose commit is the head;
#            - its no-findings comment ("Didn't find any major issues"), which
#              names the commit it reviewed ("Reviewed commit: `<sha>`");
#            - a 👍 on the `@codex review` request comment that names the head
#              (scripts/request-review.sh writes that comment).
#            A 👍 on the PR itself is NOT accepted: it names no commit, so a
#            late answer for the previous head would pass for this one.
#            👀 from Codex means it is still reviewing.
#
# Usage: sh scripts/review-status.sh [pr-number]
# Exit status: 0 when both reviewed the head, 1 otherwise.
# Tested by src/testing/review-status.test.ts against a fake gh.
set -eu

pr=${1:-$(gh pr view --json number --jq .number)}
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
head=$(gh pr view "$pr" --json headRefOid --jq .headRefOid)
short=$(printf '%s' "$head" | cut -c1-7)
FAILED='unable to review'

status=0

# --- Copilot ---------------------------------------------------------------
copilot_reviews=$(gh api "repos/$repo/pulls/$pr/reviews" --paginate \
  --jq ".[] | select(.user.login | test(\"copilot\"; \"i\")) | select(.commit_id == \"$head\") | (.body | split(\"\n\")[0])")
if printf '%s\n' "$copilot_reviews" | grep -v "$FAILED" | grep -q .; then
  echo "Copilot: reviewed $short"
elif printf '%s\n' "$copilot_reviews" | grep -q "$FAILED"; then
  echo "Copilot: FAILED on $short -- $(printf '%s\n' "$copilot_reviews" | grep "$FAILED" | tail -1)"
  status=1
else
  echo "Copilot: NOT yet reviewed $short"
  status=1
fi

# --- Codex -----------------------------------------------------------------
codex=$(gh api "repos/$repo/pulls/$pr/reviews" --paginate \
  --jq ".[] | select(.user.login | test(\"codex\")) | select(.commit_id == \"$head\") | .id" | head -1)
how="review"

if [ -z "$codex" ]; then
  codex=$(gh api "repos/$repo/issues/$pr/comments" --paginate \
    --jq ".[] | select(.user.login | test(\"codex\")) | select(.body | test(\"find any major issues\")) | select(.body | contains(\"$short\")) | .id" | head -1)
  how="no findings"
fi

if [ -z "$codex" ]; then
  for request_id in $(gh api "repos/$repo/issues/$pr/comments" --paginate \
    --jq ".[] | select(.body | test(\"^@codex review\")) | select(.body | contains(\"$short\")) | .id"); do
    codex=$(gh api "repos/$repo/issues/comments/$request_id/reactions" \
      --jq ".[] | select(.user.login | test(\"codex\")) | select(.content == \"+1\") | .id" | head -1)
    [ -n "$codex" ] && break
  done
  how="👍 on the request"
fi

if [ -n "$codex" ]; then
  echo "Codex:   reviewed $short ($how)"
else
  echo "Codex:   NOT yet reviewed $short"
  status=1
fi

exit $status
