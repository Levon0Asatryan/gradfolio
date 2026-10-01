# Frontend setup: verification

What was run to accept the setup (tracker 0.7, 0.8, F6, F7; plan:
[setup-plan.md](setup-plan.md)), and what it produced. Run 2026-09-30 to 2026-10-01
on macOS, Node 24.20.0, npm 11.19.0. Every result below was observed, not assumed.

| PR  | Branch            | Contents                                                                         |
| --- | ----------------- | -------------------------------------------------------------------------------- |
| #6  | `setup/baseline`  | The plan (merged, `8d1499e`)                                                     |
| #7  | `setup/security`  | `next` 16.3.7, `@auth0/nextjs-auth0` 4.30.0                                      |
| #8  | `setup/toolchain` | Node 24, scripts, Vitest and tests, F7 fix, hooks, review scripts, CI            |
| #10 | `setup/model`     | CLAUDE.md, AGENTS.md, Copilot instructions, `.review/`, skill and workflow, docs |
| —   | `setup/hygiene`   | Community and editor files, `.env.example`, this record                          |

#8, #10 and the last PR are stacked: each is based on the previous branch.

## 1. Fresh clone of the final head

`git clone <worktree> <dir> && git -C <dir> checkout setup/hygiene` at `c375a75`: the final code (later commits change only this record):

| Command                 | Result | Output                                                        |
| ----------------------- | ------ | ------------------------------------------------------------- |
| `npm ci`                | PASS   | 479 packages; `npm audit`: 0 vulnerabilities (17 on `main`)   |
| `npm run verify`        | PASS   | Prettier clean; 77 tests passed                               |
| `npm run test:coverage` | PASS   | statements 1.95%, branches 1.7%, functions 1.21%, lines 1.82% |
| `npm run build`         | PASS   | Next.js 16.3.7, compiled; no Auth0 variables set              |
| `npm run typecheck`     | PASS   |                                                               |
| `npm run lint`          | PASS   |                                                               |
| `npm run lint:fix`      | PASS   | changed nothing                                               |
| `npm run format:check`  | PASS   |                                                               |
| `npm run knip`          | PASS   |                                                               |
| `npm test`              | PASS   | 77 tests                                                      |
| `npm start`             | PASS   | `/`, `/profile/u_001`, `/projects`, `/search`: 200            |
| `npm run dev`           | PASS   | the same four: 200                                            |

That is every command in `CLAUDE.md`'s Commands table except the two review
scripts, which ran against real PRs (§4).

## 2. Hooks

Run for real (`git commit`, `git push --dry-run`, which runs pre-push).

| Case                                                                  | Result | Output                                                                   |
| --------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| commit with an unfixable lint error (`console.log`)                   | PASS   | refused: `no-console`, `husky - pre-commit script failed (code 1)`       |
| commit with a fixable one (`let` never reassigned)                    | PASS   | fixed in place by `eslint --fix` and committed, as designed              |
| commit that fails a test (email TLD `{2,}` → `{1,}`)                  | PASS   | refused: `rejects "student@npua.a"`, 1 failed / 49                       |
| commit with a type error                                              | PASS   | refused: `TS2322`, code 2                                                |
| push from `main` (clone, `main` at the toolchain head)                | PASS   | `refusing: on 'main'`                                                    |
| push from a feature branch to `HEAD:main`                             | PASS   | `refusing: pushing to 'main'` (after the #8 fix; before it, this passed) |
| push from detached HEAD                                               | PASS   | `refusing: on 'HEAD'`                                                    |
| code push without a receipt                                           | PASS   | `refusing: no review receipt`                                            |
| receipt for the previous commit                                       | PASS   | `refusing: the review receipt is for 1bf34fc…, HEAD is fcf51be…`         |
| receipt with 2 open findings                                          | PASS   | `refusing: … left 2 finding(s) open`                                     |
| push of another branch with a receipt for HEAD                        | PASS   | `refusing: this push sends 704033c, which is not HEAD` (after the fix)   |
| `--follow-tags` with an annotated tag on a reviewed HEAD              | PASS   | passes (after the #8 round-2 fix; before it, refused)                    |
| docs-only push (clone, `origin/main` simulated at the toolchain head) | PASS   | `review gate: docs-only push, nothing to review.`, then verify passed    |

## 3. CI

Every job green on each PR's head (`gh pr checks`): #8 at `1d6ffa1`, #10 at
`e5dc693` and #11: `Format, lint, types, knip`, `Unit tests + coverage`, `Production build`,
plus `Vercel`. #7 has no CI yet (it predates the workflow): `Vercel` green.

Red paths, on a throwaway draft PR (#9, pushed with `--no-verify` on purpose, then
closed and its branch deleted):

| Commit                 | Run                                                                                 | Result                                                               |
| ---------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `2a5e72f` lint error   | [36732733553](https://github.com/Levon0Asatryan/gradfolio/actions/runs/36732733553) | `static` **red** (`no-console`); `test`, `build` green               |
| `73cb4f3` failing test | [36734311176](https://github.com/Levon0Asatryan/gradfolio/actions/runs/36734311176) | `test` **red** (`rejects "student@npua.a"`); `static`, `build` green |

## 4. Review scripts

- `request-review.sh` requested both reviewers on real PRs: #7, #8 (three pushes) and
  #10 (two). After the race fix (`406db9c`), the request right after a push named the
  new head (`1d6ffa1`); before it, one request named the previous head (`fcf51be`
  for a push of `46b3611`) and was re-posted by hand.
- `review-status.sh` reported correctly throughout, e.g. #8 at `1d6ffa1`:
  `Copilot: FAILED … quota limit` and `Codex: reviewed 1d6ffa1 (review)`, exit 1.
- **Regression tests, each proved by breaking what it tests:**

| Broken                                                                                                | Test that failed                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-status.sh` head binding (`select(.commit_id == $head)`)                                       | `does not count a review of an older head`                                                                                                                      |
| `check-branch.sh` before the stdin fix                                                                | `refuses pushing to main …`, `… whose PR is merged …`                                                                                                           |
| `require-review.sh` before the stdin fix                                                              | `refuses a push of another commit …`                                                                                                                            |
| `require-review.sh` before the tag fix                                                                | `passes an annotated tag pushed alongside HEAD`                                                                                                                 |
| `request-review.sh` before the race fix                                                               | `waits until GitHub reports …`, `gives up without requesting …`                                                                                                 |
| `push-gates.test.ts` without its `GIT_*` filter, in a hook env                                        | all 11 refuse to run (`refusing to run git with GIT_DIR …`); the clone it ran in is unchanged                                                                   |
| review workflow: a missing check, a lost lens, a bare deferral, a counted regex match (one at a time) | the matching `review-workflow.test.ts` case; all 10 fail on `7c7bf43`                                                                                           |
| review workflow: the ranking-coverage check; the verbatim-deferral check (one at a time)              | `counts every survivor when the ranking leaves one out`; `subtracts a finding only for a deferral gathered from the PR, verbatim` (both also fail on `8fced7a`) |

## 5. Unit tests, each proved by breaking what it tests

| Broken                                             | Result                     |
| -------------------------------------------------- | -------------------------- |
| `formatDate`: invalid-date guard removed           | 3 failed                   |
| `formatDate`: `withTime` branch disabled           | 1 failed                   |
| `isNonEmpty`: trim removed                         | 2 failed                   |
| `isValidEmail`: TLD `{2,}` → `{1,}`; trim removed  | 1 failed each              |
| `ru` `{count}` → `count`; `am` `{name}` → `{nmae}` | 1 failed each              |
| `en` string emptied                                | 3 failed                   |
| mock `translationKey` renamed; params emptied      | 1 failed each              |
| F7: the old escape pattern                         | 5 of 6 metacharacter cases |
| coverage floor raised above what is achieved       | `test:coverage` exit 1     |
| run under `LANG=hy_AM TZ=Asia/Yerevan`             | all pass: the pin holds    |

## 6. The app still renders as before

`main` (`ffe1eeb`, code identical to `8d1499e`) and the final code, both under
`npm run dev`, read by headless Chrome over the DevTools protocol (`innerText`
after hydration):

| Page                 | Result                  |
| -------------------- | ----------------------- |
| `/`                  | identical (1,050 chars) |
| `/profile/u_001`     | identical (1,186 chars) |
| `/projects`          | identical (526 chars)   |
| `/search`            | identical (1,085 chars) |
| `/projects/ecoroute` | identical (143 chars)   |
| `/settings`          | identical (169 chars)   |
| `/integrations`      | identical (576 chars)   |

**F7 in the browser** (typing into the `/search` box):

| Query          | `main`                                                                                     | final                  |
| -------------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| `+abstractive` | **page dies**: `SyntaxError: … /(+abstractive)/gi: Nothing to repeat`, "Application error" | renders, no exceptions |
| `react`        | two `<mark>React</mark>`                                                                   | the same               |
| `C++`          | no match in the mock data, so no highlight runs                                            | the same               |

## 7. Vercel

The preview built (`Vercel: pass`) for #7, #8 and #10. #8's preview is the first
build with `engines.node >=24 <25`, so Vercel accepted Node 24. Production is
untouched until a merge.

## 8. Incident during verification

The first real pre-push run of `push-gates.test.ts` (#8 round 1) ran inside the
hook, where git exports `GIT_DIR` and `GIT_INDEX_FILE`. The test inherited them, so
its `git init` and commits hit the real repository: `core.bare=true` and
`core.hooksPath=/dev/null` in the shared config, local `setup/toolchain` moved onto a
test commit, `feat` and `other` branches created, and local `origin/main` rewritten.
Nothing reached GitHub (`git ls-remote` unchanged), and the main checkout's working
tree was untouched. All of it was restored by hand (config values, the branch ref to
`fcf51be`, worktree HEAD and index, branches deleted, `git fetch --prune`), and the
test now drops `GIT_*` and refuses to run if any remain (§4). The rule is in
`CLAUDE.md` and `.review/rules/gradfolio-web.md` #2.

## Not verified

- Running `/gradfolio-web-review` as a loaded skill, and executing its workflow: that
  needs a chat started inside this repository. Receipts were written by hand, with
  the method saying so.
- Copilot's review of any head: its quota is exhausted, so every request ended
  "FAILED … quota limit".
- A real login round-trip (needs the production client credentials).
- Dependabot's config takes effect only on `main`.
