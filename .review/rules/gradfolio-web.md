# gradfolio-web: review rules

Mined from this repository's merged PRs. Seeded from the setup PRs; grown from each
milestone's reviews; see `../README.md`.

## Trust boundaries: tokens, HTML, URLs

## Push gates and review tooling

### 1. A push gate judges the pushed refs, not the checkout

`check-branch.sh` and `require-review.sh` read the `<local-ref> <local-oid>
<remote-ref> <remote-oid>` lines git writes to the pre-push hook's stdin. Only
`refs/heads/*` updates are compared with HEAD; tags and deletions pass.

**Why:** judging the checkout let `git push origin HEAD:main` and pushes of other,
unreviewed branches through; comparing tags with HEAD refused `--follow-tags`.

**Tags:** `concern:gates` `severity:must`
**Sources:** #8 (Codex, rounds 1 and 2)

### 2. Tests that run git drop the parent's GIT\_\* variables

**Why:** the hooks run the tests; inside a hook `GIT_DIR` and `GIT_INDEX_FILE` point
at the real repository, and a test that inherited them re-initialised it as bare,
moved a branch and rewrote `origin/main` (#8, found by running the real pre-push).

**Tags:** `concern:tests` `severity:must`
**Check:** `execFileSync\("git"` :: build the child env without GIT\_\* (push-gates.test.ts)
**Sources:** #8

## Rendering and state

## i18n and accessibility

## Tests that can fail
