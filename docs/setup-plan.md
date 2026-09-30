# Frontend setup plan (tracker 0.7, 0.8, F6)

Brings this repository to the working model `gradfolio-api` already uses: the same
push gates, review contract, review scripts and CI, adapted to a Next.js app. No
feature, page or API wiring changes here.

The plan of record is
[`gradfolio-api/docs/tracker.md`](https://github.com/Levon0Asatryan/gradfolio-api/blob/main/docs/tracker.md).
This document covers only the setup.

Baseline: `origin/main` at `ffe1eeb` (2026-04-04), Node 24.20.0, npm 11.19.0, macOS.
No `.env*` present, and no Auth0 variables in the shell.

## 1. Baseline (0.7)

Every command below was run. Logs are summarised; the exact output is quoted where
it decides something.

| Command                    | Result   | Notes                                                                                    |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `npm ci`                   | PASS     | 422 packages, 16 s. `npm audit`: 17 vulnerabilities (1 critical, 10 high); see §2.6      |
| `npm run build`            | PASS     | Next.js 16.1.4 (Turbopack), 14 routes, all dynamic. Warns: `middleware` → `proxy` rename |
| `npm run eslint`           | PASS     | 0 problems                                                                               |
| `npx tsc --noEmit`         | PASS     | 0 errors                                                                                 |
| `npm run knip`             | **FAIL** | 1 unused file, 4 unused dependencies, 67 unused exported types; triage in §2.4           |
| `npx prettier --check .`   | **FAIL** | `.prettierrc`, `CLAUDE.md`, `README.md`, `tsconfig.json`. `src/` is clean                |
| `npx prettier --check src` | PASS     | what the current pre-commit hook formats                                                 |

### Does `next build` need the Auth0 variables?

**No.** The build above ran with none of them set and passed. Why, from the source:

- `src/lib/auth0.ts` constructs `Auth0Client` at module load, but only
  `src/middleware.ts` imports it (`grep -rn "lib/auth0" src`). The build compiles the
  middleware and never runs it.
- Even when it runs, `@auth0/nextjs-auth0` 4.14.0 does not throw on missing options:
  `validateAndExtractRequiredOptions` (`dist/server/client.js:550`) collects them and
  calls `console.error("WARNING: Not all required options were provided …")`.

**Decision:** CI builds with no Auth0 variables. When tracker 2.9 imports the client
from server components, the build still cannot throw on them, but the warning will
appear in the log; that PR re-checks this.

### Real run of the baseline (`next start`, no env)

| Route                                        | Status | Note                                                                                                             |
| -------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `/`, `/profile/u_001`                        | 200    |                                                                                                                  |
| `/projects`, `/search`, `/projects/ecoroute` | 200    |                                                                                                                  |
| `/auth/login`                                | 404    | middleware throws `TypeError: Invalid URL` (`input: 'auth/callback'`), catch returns `undefined`: F2, reproduced |

Production (`gradfolio-navy.vercel.app/auth/login`) answers 307 to Auth0, so Vercel
has the Auth0 variables. The authorize URL carries **no `audience`**, so
`AUTH0_AUDIENCE` is not set there (tracker 2.8).

## 2. Investigation

### 2.1 Node 24

- Engines: `next` `>=20.9.0`; `eslint`, `typescript-eslint` `>=21.1.0`; `sharp`
  `>=21.0.0`; `knip` `>=18.18.0`; `husky` `>=18`; MUI, React, Auth0 declare no
  upper bound. The whole baseline above ran on Node 24.20.0.
- **`@types/node` must move from `^20` to `^24`.** Vitest 5 declares
  `peerOptional @types/node "^22.0.0 || >=24.0.0"`, and `npm i -D vitest@^5` fails
  with `ERESOLVE` against `@types/node@20.19.30`. `^24` also matches the runtime, as in
  the API.
- `jsdom@30` requires Node `^22.22.2 || ^24.15.0 || >=26.0.0`; fine on 24.

### 2.2 What Vercel runs

What the repository shows:

- No `vercel.json`. Vercel uses its Next.js preset: `npm install`, then
  `npm run build` (`next build --turbopack`).
- The `Vercel` and `Vercel Preview Comments` checks run on every PR (seen on #5), and
  production deploys from `main` (`gh api …/deployments`: last one `ffe1eeb`).
- `husky` runs in `prepare` there too. It exits 0 when it finds no `.git`, as today.

What it does not show: the project's Node version setting. Adding
`"engines": {"node": ">=24 <25"}` makes Vercel use Node 24.x regardless of that
setting. The preview of PR (a) is where that is proved.

### 2.3 Vitest with the App Router: spike

Run in a scratch clone of `main`, not recalled:

- Vitest 5.0.2 on Vite 8.3.1, `@testing-library/react` 16.3, `@testing-library/dom`
  10, `@testing-library/jest-dom` 6, `jsdom` 30.
- **`@vitejs/plugin-react` is not needed.** Vitest 5 transforms TSX with oxc and
  honours `"jsx": "react-jsx"` from `tsconfig.json`. The same component test passed
  with and without the plugin, so it is left out.
- **The `@/` alias:** Vite 8's built-in `resolve.tsconfigPaths: true` reads it from
  `tsconfig.json`; no `vite-tsconfig-paths` package, no duplicated alias.
- **jsdom over happy-dom.** Both passed the spike. jsdom is the more complete DOM,
  and accessibility queries (`getByRole`) lean on it.
- **MUI and Emotion** render in jsdom with no provider: `Box component="mark"` with a
  theme-callback `sx` rendered and was queried by role and text.
- Setup file: `@testing-library/jest-dom/vitest` and `cleanup` after each test.

### 2.4 knip triage

| Finding                                              | Real? | Action                                                                                                       |
| ---------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| 66 of 67 unused exported types: `…Props` interfaces  | noise | Each is used in its own file. `ignoreExportsUsedInFile: { interface: true, type: true }` clears all 66 (run) |
| `FormatDate` type (`formatDate.ts:23`)               | real  | Delete the export                                                                                            |
| `src/components/projects/shared/SectionCard.tsx`     | real  | Delete: nothing imports it                                                                                   |
| `@mui/material-nextjs`, `@mui/system` (dependencies) | real  | Remove: never imported (`@mui/system` stays installed through `@mui/material`)                               |
| `@eslint/eslintrc`, `eslint-config-next` (dev)       | real  | Remove: the flat config uses `@next/eslint-plugin-next` directly                                             |
| `knip` itself in `dependencies`                      | real  | Move to `devDependencies` (not reported by knip; it is a dev tool shipped to Vercel's install)               |

Then knip runs in CI with the config above. `npm run build` is re-run after the
removals.

### 2.5 Review scripts and Codex on this repository

- The API's `scripts/review-status.sh` already detects the slug
  (`gh repo view --json nameWithOwner`): run here unchanged, it printed
  `Levon0Asatryan/gradfolio` and judged PR #5 correctly (Codex's review is on
  `3408781`, the head is `5657717`, so "NOT yet reviewed").
  `request-review.sh` and `check-branch.sh` use `gh pr` on the current repo, so they
  need no slug either. They are copied as they are, with only the skill name changed.
- **Codex:** `chatgpt-codex-connector[bot]` reviewed PR #5 on 2025-12-08, so the app
  was installed on this repository then. The plan PR's `@codex review` comment
  confirms it is still installed.
- Copilot: the repository ruleset "Clean Code Rules" has `copilot_code_review` on
  push, but the ruleset is **disabled**. Copilot's quota is exhausted, so "Copilot:
  FAILED" is expected.

### 2.6 Defects and risks found while investigating

Not fixed by this plan unless Levon says so (§6).

1. **Security: `next@16.1.4` is behind 33 advisories**, including 2 critical
   (GHSA-2xp9-vwfh-vxw4, RCE in the image optimizer with AVIF; GHSA-p293-qw3h-jr36,
   Windows hosts only) and several middleware/proxy bypasses (e.g.
   GHSA-492v-c6pp-mqqv, fixed in 16.2.5; GHSA-6gpp-xcg3-4w24, fixed in 16.2.11).
   Everything is fixed in 16.3.3+; latest is 16.3.7, inside the current `^16.1.4`
   range. `@auth0/nextjs-auth0` 4.14.0 has GHSA-xq8m-7c5p-c2r6 (moderate, fixed
   after 4.17.0; latest 4.30.0, also in range). On Vercel the image optimizer is the
   platform's own service, which likely takes the first critical off the table; the
   proxy bypasses matter once 2.11 makes the middleware a guard.
2. **`HighlightedText` crashes on regex metacharacters (proposed F7).** Its escape
   pattern `/[.*+?^${}()|[\\]\\\\]/g` closes the character class at the first `]`, so
   nothing is escaped. `new RegExp("(C++)", "gi")` throws
   `Invalid regular expression: /(C++)/gi: Nothing to repeat`; `(` and `[x` throw
   too (run in Node, and in a component test). It receives the search query on
   `/search` (`PortfolioCard`) and `/projects` (`ProjectCard`), so typing `C++` into
   the search box throws during render.
3. **Open PR #5** ("Auth partial fix", 2025-12-08, 76 files) touches
   `.husky/pre-commit`, `eslint.config.mjs` and `next.config.ts`. It predates #4 and
   is likely superseded; if it stays open it will conflict with PR (a).
4. **Three collaborators** (Levon0Asatryan, Parg3e3v, narekpoghosyan05). The
   pre-push receipt gate expects a Claude review skill; a teammate without it needs
   `SKIP_REVIEW_GATE=1` (§6).
5. `formatDate` formats in the browser's locale, not the UI language (`en`/`ru`/`am`).
   Noted for M3; not a defect of this setup.

## 3. What will be added

### 3.1 Toolchain and gates

- **Scripts** (API names): `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`),
  `lint` / `lint:fix` (ESLint), `format` / `format:check` (Prettier over the whole
  repo), `knip`, `test` (`vitest run`), `test:watch`, `test:coverage`, `verify`
  (`format:check && lint && typecheck && test`), `prepare`.
  - The old `prettier`, `eslint` and `eslint-fix` are replaced, not aliased.
- **Prettier config unchanged**: double quotes, width 100, trailing commas. The four
  files that fail today are formatted with it (whitespace only); `.prettierignore`
  gains `package-lock.json`, `.idea/`, `public/`.
- **Vitest** (`vitest.config.mts`): jsdom, `resolve.tsconfigPaths`, setup file
  `src/testing/setup.ts`, `TZ=UTC` for the date tests. Tests sit beside their file as
  `<file>.test.ts(x)`.
- **First tests**, each shown failing by breaking what it tests:
  - `formatDate`: invalid input gives `""`; the date-only form has no time; `withTime`
    adds it; a date-only ISO string near midnight UTC formats the right day under a
    fixed `TZ`.
  - `validation.ts`: `isNonEmpty` (null, undefined, whitespace); `isValidEmail`
    (trimmed input, missing `@`, one-letter TLD, spaces).
  - **i18n, runtime, only what the `Dictionary` type cannot check:** no empty string
    in any language; a translation never introduces a placeholder `en` does not have
    (it would render literally, e.g. `{nmae}`); and every data placeholder
    (`{name}`, `{count}`, `{skill}`) survives in `ru` and `am`. `{s}` is exempt: it is
    English's plural suffix, and `am` rightly drops it (the spike found exactly this).
    Also checks every `translationKey` in `dashboard.mock.ts` exists, since
    `ActivityFeed` indexes with a cast the compiler cannot see through.
  - **One component test:** `HighlightedText` marks case-insensitive matches with
    `<mark>` and leaves the rest as text. Its metacharacter case waits on §6 Q2.
  - `scripts/review-status.sh` regression test, ported from the API (see 3.3).
- **Coverage**: `@vitest/coverage-v8` over `src/**/*.{ts,tsx}`, excluding mock data
  and type-only files. The floor is what the suite achieves, rounded down, and it is
  a ratchet: raised as features land, never lowered.
- **Husky**:
  - pre-commit: `lint-staged` (ESLint fix + Prettier on staged files only), then
    `npm run typecheck` and `npm test`. This replaces the hook that reformats and
    fixes the whole `src/` tree.
  - pre-push: `scripts/check-branch.sh`, `scripts/require-review.sh`, `npm run verify`.
- **Node**: `.nvmrc` `24`, `"engines": {"node": ">=24 <25"}`, `@types/node` `^24`.
- **knip**: `knip.json` (§2.4), the real findings removed.

### 3.2 CI (0.8): `.github/workflows/ci.yml`

On `pull_request` and pushes to `main`; `concurrency` cancels superseded runs;
`permissions: contents: read`; `actions/checkout@v7` and `actions/setup-node@v7`
with `node-version-file: .nvmrc` and the npm cache, as the API pins them.

| Job      | Runs                                              |
| -------- | ------------------------------------------------- |
| `static` | `format:check`, `lint`, `typecheck`, `knip`       |
| `test`   | `test:coverage` (thresholds enforced)             |
| `build`  | `npm run build`, with **no** Auth0 variables (§1) |

No E2E (tracker 9.6).

### 3.3 The working model

- **`CLAUDE.md`**: keeps the project description (stack, structure, patterns, pages);
  adds the API's "How work is done" (orchestrator/worker split, cost discipline, the
  review loop, four phases, before/while writing, before calling it done), points to
  the API tracker as the plan of record, and adds a Commands table. Fixes F6: no "no
  backend", no "10 tables" (the schema section becomes a pointer to the API, which
  owns it), no `vercel.json`, Auth0 v4 variable names, Next.js 16, and the middleware
  claim ("protects all routes": it does not, F2).
- **`AGENTS.md`**: the API's severity bar and design-doc rules, plus frontend rules:
  - user HTML rendered only through the sanitizer (`dangerouslySetInnerHTML` anywhere
    else is a finding; F1, 4.8);
  - access tokens never in a client component, browser storage, a URL or a log;
  - API calls from the Next.js server only (Q11 proposal: server components, route
    handlers, server actions);
  - UI that hides or shows by role or ownership is never the guard; the API is;
  - every new user-facing string in `en`, `ru` and `am`;
  - accessibility regressions (lost label, keyboard trap, role, contrast);
  - plus: a middleware or proxy that fails open (F2), user URLs rendered as `href`
    without a scheme check.
- **`.github/copilot-instructions.md`**: the same bar, condensed.
- **`scripts/`**: `check-branch.sh`, `require-review.sh`, `request-review.sh`,
  `review-status.sh`, from the API, skill name `gradfolio-web-review`.
  `src/testing/review-status.test.ts` ported to Vitest here (runs in the node
  environment through a per-file `// @vitest-environment node`).
- **`.review/`**: `README.md`, `stacks` = `gradfolio-web`, `rules/gradfolio-web.md`
  (headings only, as in the API).
- **`.claude/skills/gradfolio-web-review/SKILL.md`** and
  **`.claude/workflows/gradfolio-web-review.js`**: the same passes and the receipt;
  lenses: security (XSS, tokens, open redirects), rendering (server/client boundary,
  hydration, `"use client"` leaks), auth (route policy, fail-closed middleware),
  i18n, accessibility, tests.
- **`docs/README.md`**: the index, and that the tracker, investigation and handoff
  template live in `gradfolio-api`.

### 3.4 Hygiene and community files

`.editorconfig`, `.gitattributes`, `.vscode/` (extensions, settings: workspace
TypeScript, Prettier on save, ESLint fix), `LICENSE` (MIT, Levon Asatryan),
`CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md` (frontend scope: stored XSS,
token handling, auth UI), PR template, issue templates (bug, feature, config
pointing to the other two repos), `.github/dependabot.yml` (npm grouped
production/development minor+patch, GitHub Actions; `@types/node` major ignored,
since Node 24 is pinned in `.nvmrc`, `engines` and CI), `.env.example` (Auth0 v4
names plus the API base URL), `.gitignore` gains `!.env.example` and the review
receipt.

`.idea/` stays tracked: it is a teammate's IDE state, and untracking it is not this
setup's call.

## 4. Pull requests

| PR       | Branch            | Contents                                                                                     |
| -------- | ----------------- | -------------------------------------------------------------------------------------------- |
| this one | `setup/baseline`  | `docs/setup-plan.md`                                                                         |
| (a)      | `setup/toolchain` | 3.1 and 3.2, plus the four review scripts and their test (the pre-push hook calls them)      |
| (b)      | `setup/model`     | 3.3 without the scripts: CLAUDE.md, AGENTS.md, Copilot instructions, `.review/`, skill, docs |
| (c)      | `setup/hygiene`   | 3.4, and `docs/setup-verification.md`                                                        |

(b) and (c) are stacked on (a) (base = the previous branch), so each shows only its
own diff and CI runs on each. Commits are split by logical change.

## 5. How each gate is shown failing

Recorded in `docs/setup-verification.md`, with output:

- pre-commit: a commit with a lint error is refused; a commit with a failing test is
  refused.
- pre-push: a push from `main` is refused; a code push without a receipt is refused;
  a receipt for an older commit is refused; a docs-only push passes.
- CI: a pushed lint error turns `static` red; a pushed failing test turns `test`
  red; both runs linked, then reverted.
- `review-status.test.ts`: passes, and fails against a copy of the script with the
  head binding (`select(.commit_id == "$head")`) removed.
- Each unit test is broken once by editing what it tests (e.g. `{count}` removed from
  `ru`).
- Then the Phase 3 list from the handoff: fresh clone (`npm ci`, `verify`,
  `test:coverage`, `build`), both reviewers requested on a real PR, the Vercel
  preview, `npm run dev` with `/`, `/profile/u_001`, `/projects`, `/search`, the
  Commands table run cold.

## 6. Open questions for Levon

1. **Security bump.** Take `next` to 16.3.7 and `@auth0/nextjs-auth0` to 4.30.0 (both
   inside the current ranges) in a separate small PR before (a)? Recommended: yes, as
   its own PR so a Vercel regression reverts alone. Otherwise Dependabot security
   updates will raise it once turned on.
2. **F7 (`HighlightedText`).** Fix it in (a), with the component test as its
   regression test (one line: escape with `/[.*+?^${}()|[\]\\]/g`)? Recommended: yes;
   it is a crash on the public search page. Otherwise it gets a tracker row and the
   component test covers only the working cases.
3. **Teammates and the receipt gate.** Keep `require-review.sh` for everyone, with
   `SKIP_REVIEW_GATE=1` documented in CONTRIBUTING for people without Claude Code?
   Recommended: yes; CI does not depend on it.
4. **Vercel project settings** the repository cannot show: the Node.js version and
   any build-command override. `engines` will select 24.x; say if the project
   overrides the build command.
5. **PR #5**: close it as superseded?
6. Settings only Levon can change: auto-delete head branches (**off**), branch
   protection or enabling the "Clean Code Rules" ruleset (**disabled**; it would also
   make Copilot review automatic), Dependabot security updates, the Copilot quota,
   and, per 2.8, `AUTH0_AUDIENCE` on Vercel.

## 7. Tracker changes to propose

- 0.7: done, recorded here.
- 0.8: in review with (a).
- 2.15: covered by (b) and (c) (Auth0 v4 names, `.env.example`).
- New F7: `HighlightedText` regex escape (per Q2).
- New row: frontend security bump (per Q1).
- 2.8: production authorize URL has no `audience` (checked 2026-09-30).
