## What this changes

<!-- Behaviour, not a file list. Two to five lines. -->

## Why

<!-- The spec feature, plan section, tracker row (gradfolio-api/docs/tracker.md) or issue this serves. -->

## Evidence

- [ ] `npm run verify` passes
- [ ] `npm run test:coverage` stays at or above the floor
- [ ] `npm run build` passes, and the Vercel preview built
- [ ] `/gradfolio-web-review` ran clean on the head commit (or the receipt's method is named below)
- [ ] Copilot and Codex requested on this head (`sh scripts/request-review.sh`)

**Guards proved by removal.** List each check, guard or validation this PR adds, and
the test that fails when it is removed.

| guard removed | test that failed |
| ------------- | ---------------- |
|               |                  |

<!-- Delete the table if the PR adds no guard. -->

**Real run.** The pages opened in `npm run dev` (or the preview), and what you checked
on each: languages, light and dark mode, keyboard.

## Kept in step

- [ ] Every new user-facing string is in `en`, `ru` and `am`
- [ ] User HTML goes through the allow-list sanitizer; no token reaches client code
- [ ] Changes the API (`gradfolio-api`) needs are listed below
- [ ] Commits split by logical change; tests are in the same commit as the code they test

## Not verified

<!-- What you could not check, and why. "Nothing" is a valid answer. -->
