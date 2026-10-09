# gradfolio: working conventions

The Next.js frontend of **Gradfolio**. Read this before adding files. `AGENTS.md`
has the review rules: what to flag on a pull request. This file has the conventions
to follow while writing.

## How work is done

Work is split across chats:

- one **orchestrator** session tracks the project and checks the work;
- **worker** chats each implement one milestone, or one step of a plan, from a
  handoff prompt (`gradfolio-api/docs/handoff-template.md`).

**The plan of record is
[`gradfolio-api/docs/tracker.md`](https://github.com/Levon0Asatryan/gradfolio-api/blob/main/docs/tracker.md)**,
for all three repositories. Read it first. Workers propose tracker changes in their
report and never edit it. Levon approves plans and merges pull requests. No chat
merges.

### Cost discipline: keep the review loop cheap

- **Two review rounds per PR, then stop.** In rounds one and two, fix whatever is
  real. After that, each finding is either **fix-now** or a tracker follow-up.
  - Fix-now means only a security hole, data loss, a wrong result, or a broken build.
  - Everything else gets a one-line reply saying it is deferred, plus a follow-up
    row proposed for the tracker.
  - Answer every thread either way.
- **The cap limits what gets fixed, not whether the latest commit gets reviewed.**
  - After the last fix push, ask explicitly for one confirmation round on the head
    commit, limited to the commits since the previous round.
  - In that round, act only on fix-now findings. Everything else becomes a follow-up
    row, so the round cannot restart the loop.
- **Push back on a wrong finding with evidence instead of implementing it.** Check
  the premise first: a review that cites a limit, a default or a standard is stating
  a fact, and facts can be checked.
- **Build for this project's real scale.** Gradfolio is university coursework: tens
  of users, hundreds of projects. Work that only pays off at a larger scale is out
  of scope by default. Correctness, security, accessibility and the evidence for
  them still apply.
- **Two or three PRs per milestone**: one plan PR, then the implementation in
  coherent chunks.

### The review loop

1. **The first push is a finished PR, not a draft.** Phase 3 (the full gate,
   removing each guard to prove its test fails, and a real run in the browser)
   happens **before** the first push of code.
2. **One push per round, carrying every finding from that round.** Read all the
   comments, decide on all of them, fix all of them, then push once.
3. **Every fix push re-runs the full gate and checks what the fix could have
   broken.** Re-run verify, coverage and the build; repeat the real run if the fix
   touched a page, the middleware or auth; re-prove each guard it touches.
4. **A plan PR gets one review round, then it merges.** Fix only what changes the
   design.
5. **Resolve a thread once its fix is pushed and verified.** Reply with what changed
   and in which commit, then resolve. A thread stays open only for pushback waiting
   on Levon, or a deferral with a proposed tracker row.

### Every task runs four phases (not optional)

1. **Investigation**, before any plan or code: the requirements in scope (the spec,
   the API's `openapi.yaml`), the code on `main` it touches, how comparable apps
   solve it, and published vulnerabilities in the area. Claims about how Next.js,
   React, MUI or Auth0 behave are **run**, not remembered, against the versions
   `package-lock.json` pins.
2. **Implementation**, only after the plan is approved.
3. **Revalidation.** Walk the plan against the code and close every gap. Re-prove
   every guard by removing it. For a change to a page, the middleware or auth, and
   for the last PR of a milestone: a fresh clone
   (`git clone <checkout> <dir> && git -C <dir> checkout <branch>`, never a push to
   have something to clone), then install, verify, coverage, build, and a real run.
4. **Re-review.** Read the whole diff as a hostile reviewer against `AGENTS.md`, and
   separately walk the plan's requirement sentences ("must", "is excluded from") to
   the line that implements each one.

### Before writing code

- Plan first. A milestone's plan is `gradfolio-api/docs/mN-plan.md` (it covers every
  repository); a frontend-only piece of work gets its plan in this repository's
  `docs/` (example: `docs/setup-plan.md`).
- Check that `git config user.email` is the email of the developer whose chat this
  is (for Levon, `levonasatryan1098@gmail.com`).
- Branch from the latest `origin/main` in **your own worktree**, then `npm ci`.
- One chat per working tree at a time: two chats in one checkout corrupt each
  other's work.

### While writing

- Never push to `main`. One PR per coherent step.
- **Check the branch is still live before committing to it.** A branch whose PR is
  merged or closed is dead. `scripts/check-branch.sh` enforces this on push. After a
  merge, fetch and cut a new branch before writing anything else.
- **Split commits by logical change, never one commit for a whole PR.** Tests go in
  the same commit as the code they test. Each commit passes the pre-commit hook on
  its own. Review fixes are separate commits, named after the finding.
- **Prove every guard, and every new test, by removing what it tests** and watching
  it fail. A test that has never been seen failing is not evidence.
- **A test that runs `git` must not inherit `GIT_*` variables.** The hooks run the
  tests, and inside a hook `GIT_DIR` points at the real repository: a test that once
  inherited it re-initialised this repository as bare. `src/testing/push-gates.test.ts`
  shows the guard.
- **A table that maps external signals is untested until one real example of each
  class has come through the real transport**: Auth0 errors and sessions, and the
  API's error envelope.
- **Diagnose an environment failure to its cause before reporting it as blocking.**

### Before calling it done

1. The full gate: `npm run verify`, `npm run test:coverage` (at or above the floor)
   and `npm run build`.
2. A **real run**: `npm run dev`, open every changed page, in each language if it
   shows text, and in light and dark mode if it has styling. Passing tests alone is
   not done.
3. CI is green on every job, the Vercel preview built, and
   `gh pr view <n> --json mergeable` says `MERGEABLE`.
4. **Both reviewers review every push: GitHub Copilot and Codex.**
   - Request both on every push, including the confirmation round and docs-only PRs:
     `sh scripts/request-review.sh [pr] ["scope note"]`. Copilot is a formal
     reviewer; Codex is asked through an `@codex review` comment naming the head.
   - Read the findings with
     `gh api repos/Levon0Asatryan/gradfolio/pulls/<n>/comments --paginate`.
   - A push counts as reviewed only when **both** have reviewed the head commit:
     `sh scripts/review-status.sh [pr]` exits 0 only then.
   - Findings from both on the same push belong to **one** round.
5. **Leave the machine clean**: stop dev servers, remove scratch clones and files.
6. Report in the format in `gradfolio-api/docs/handoff-template.md`. Say plainly
   what was not verified.

Style: laconic. Same facts, fewer words.

---

## The project

**Gradfolio** is a student portfolio platform, built as NPUA (National Polytechnic
University of Armenia) coursework: students show projects, skills and achievements,
each backed by evidence, to recruiters and peers.

### The workspace

Absolute path: `/Users/levon/Dev/university/gradfolio-repos`.

| Path             | What it is                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `gradfolio/`     | This repo: the Next.js frontend, deployed on Vercel from `main`.                                        |
| `gradfolio-api/` | The NestJS backend. **Owns the schema** and the plan of record (`docs/tracker.md`, `investigation.md`). |
| `gradfolio-sql/` | MySQL 8.4 schema reference only (frozen as the API's `0001_baseline`).                                  |
| `docs/`          | The product spec and a competitor analysis. Not in any repo.                                            |
| `issues.md`      | Known defects across all three repos (F\* are this repo's).                                             |

### Commands

| Purpose                                                     | Command                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| install                                                     | `npm ci`                                                                 |
| dev server (Turbopack; reads `.env.local`)                  | `npm run dev`                                                            |
| production build / serve it                                 | `npm run build` / `npm start`                                            |
| verify (format + lint + types + tests; the pre-push gate)   | `npm run verify`                                                         |
| unit and component tests / watch                            | `npm test` / `npm run test:watch`                                        |
| coverage (a ratchet: floor in `vitest.config.mts`)          | `npm run test:coverage`                                                  |
| types / lint / lint and fix                                 | `npm run typecheck` / `npm run lint` / `npm run lint:fix`                |
| format / check formatting                                   | `npm run format` / `npm run format:check`                                |
| unused files, exports, dependencies (CI runs it)            | `npm run knip`                                                           |
| browser smoke tests (needs `npm run build` first; Chromium) | `npm run e2e`                                                            |
| request both reviewers / check both reviewed the head       | `sh scripts/request-review.sh [pr]` / `sh scripts/review-status.sh [pr]` |

Browser tests (`e2e/`, Playwright, CI job "Browser smoke tests") run the production build with throwaway Auth0 values and never log in. Locally keep the browser in the sandbox: `export PLAYWRIGHT_BROWSERS_PATH=/Users/levon/Dev/university/.sandbox/ms-playwright; npx playwright install chromium`. A logged-in journey stays in tracker 9.6.

Pages render without any environment variables; logging in needs the Auth0 ones
(`.env.example`). The build does not need them (`docs/setup-plan.md` §1).

Hooks (husky): pre-commit runs lint-staged (ESLint fix and Prettier on staged files),
then `typecheck` and `npm test`. Pre-push runs `scripts/check-branch.sh`,
`scripts/require-review.sh` (a review receipt for the pushed commit, written by
`/gradfolio-web-review`; docs-only pushes are exempt) and `verify`. Both push gates
judge the refs being pushed, not the checkout.

### Stack

- **Next.js 16** (App Router, Turbopack), **React 19**, TypeScript 5 (strict,
  `noUncheckedIndexedAccess`, `noImplicitReturns`, `allowJs: false`), Node 24
  (`.nvmrc`, `engines`).
- **MUI 7** with Emotion; `sx` prop throughout, no Tailwind, no CSS modules.
- **Auth: `@auth0/nextjs-auth0` v4**, server-side SDK (`src/lib/auth0.ts`).
- `react-resizable-panels` (sidebar), `rooks` (`useWindowSize`), Motion (animation),
  Vercel Analytics and Speed Insights, Geist and Roboto fonts.
- **Tests:** Vitest 5, jsdom, Testing Library. `vitest.config.mts` pins `TZ=UTC` and
  an en-US locale so dates render the same everywhere.
- **i18n:** a context with three languages: English (`en`), Russian (`ru`), Armenian
  (`am`).

## Structure

```
src/
  app/          App Router pages. Server components by default; "use client" only where needed.
  components/   Grouped by feature (dashboard/, profile/, profile-edit/, project/, projects/,
                project-new/, search/, integrations/, settings/), plus shared UI (shared/,
                stepper/, text/, theme/, i18n/, layout/, navigation/, sidebar/, effects/).
  data/         Mock data (*.mock.ts) until each feature is wired to the API; locales/.
  lib/          auth0.ts (the Auth0Client); auth/routePolicy.ts (which pages need a login);
                api/client.ts (gradfolio-api, server only); api/types.ts, schema.d.ts (generated).
  utils/        constants/, helpers/ (formatDate, validation), types/.
  testing/      Test-only setup and helpers; never imported by shipped code.
  proxy.ts      Auth0 session handling and the login requirement (Next 16's `proxy`).
scripts/        Review and push-gate scripts (shared with gradfolio-api).
```

- Group by **feature**, as the folders above do. Deleting a feature should mean
  deleting one folder.
- Tests sit beside the file they test: `<file>.test.ts(x)`.
- Path alias: `@/*` → `./src/*`.
- Components: functional, typed with `FC`, `memo()` where it pays. Client components
  are marked `"use client"`.

## Patterns

### Provider hierarchy (`app/layout.tsx`)

`ThemeRegistry` (Emotion SSR cache) → `ThemeWrapper` (MUI theme, `CssBaseline`,
`DarkModeContext`) → `LanguageProvider` → `SidebarVisibilityProvider` →
`SideBarWrapper` (resizable sidebar + content) → page. `SpeedInsights` and
`Analytics` sit beside it.

### Theme

Light/dark in a `theme` cookie (1 year), read on the server in the layout so there is
no flash. `getTheme(mode)` builds the palette; `palette.navigation.main` is a custom
extension declared by module augmentation.

### i18n

- `const { t, language, setLanguage } = useLanguage()`; access like `t.profile.skills`.
- The `Dictionary` type (`src/data/locales/types.ts`) makes every key exist in all
  three languages; `locales.test.ts` checks what the type cannot (empty strings,
  placeholders a translation invents or drops).
- **Every new user-facing string goes into `en`, `ru` and `am` in the same commit.**
- The language is stored in `localStorage` (`language`); the default is English.
- `formatDate` formats in the browser's locale, not the UI language (M3 follow-up).

### Sidebar and navigation

`useLayoutConfigHook` turns pixel sizes into panel percentages; the sidebar
auto-collapses below `sm`, saves its state (`autoSaveId`), and can be hidden (404).
Active route = the longest matching `href` prefix.

### Auth

- `src/lib/auth0.ts` constructs the client at module load; `scope` and `audience` are
  passed explicitly (v4 does not read `AUTH0_SCOPE`/`AUTH0_AUDIENCE` itself). The
  SDK's `/auth/access-token` route is **off**: the access token never reaches the
  browser (Q11). Tokens refresh a minute before they expire.
- `src/proxy.ts` runs `auth0.middleware(request)` (mounts `/auth/*`, rolls the
  session) and enforces the route policy in `src/lib/auth/routePolicy.ts`: a
  protected page without a session redirects to `/auth/login?returnTo=…`. It **fails
  closed**: if the session cannot be checked, a protected page answers 503; public
  pages still render (tracker 2.10, 2.11).
- Public pages: `/profile/<id>`, `/projects/<id>`, `/search`, `/settings`. Everything
  showing or changing the user's own data needs a login, `/` (the dashboard) included.
- **Links to `/auth/*` are plain `<a>`, never `<Link>`** (`navLinkComponent`): a
  client-side fetch of `/auth/login` follows Auth0's redirect as a cross-origin
  request and fails CORS.
- The layout reads the session for the navigation only (name, picture, logout); a
  signed-in user does not see "Login" or "Login Connections" (2.13).
- Each `/auth/callback?code=…` URL works once: reloading it answers 500 "The state
  parameter is invalid". Log in on the production host itself
  (`gradfolio-navy.vercel.app`): a login started on a Vercel alias host returns to
  `APP_BASE_URL`, where its cookie is missing.
- **Previews pin their own base URL** (`src/lib/auth/appBaseUrl.ts`): on
  `VERCEL_ENV=preview` the Auth0 client uses `https://$VERCEL_BRANCH_URL`, not
  `APP_BASE_URL` (one value for Production and Preview). Log in on the branch host
  (`gradfolio-git-<branch>-levons-projects-4fb86c2e.vercel.app`), not the per-commit
  one. Auth0 lists that host's `/auth/callback` and logout URL as exact entries, one
  per tested branch, never a `*.vercel.app` wildcard. Allowed Origins and Web Origins
  stay empty (server-side flow; nothing calls Auth0 from the browser).
- The current user comes from the API (`getMe().id`); `/profile` redirects to
  `/profile/<id>`. Nothing hardcodes a user id (2.12).

### Writes

Edits go through server actions (`src/lib/profile/actions.ts`), which are public
endpoints: they take no user id (the Auth0 session's token tells the API who is
writing) and run `parseHeaderPatch` (`src/lib/profile/headerPatch.ts`, shared with the
forms) before forwarding. A failed save keeps the form and says so; the form warns
before the tab closes with unsaved changes. Section edits (education, experience, certifications, skills) use the same pattern:
`src/lib/profile/sections.ts` holds each section's fields (kept in step with the generated
create bodies by a type-level test) and `parseEntry`, which refuses a half-filled entry
before anything is sent; `SectionEditor`/`SkillsEditor` (Edit Mode on your own profile)
call the actions, show the API's `ORDER_STALE`, `LIMIT_REACHED` and `NOT_FOUND` as
messages, and reload the server's list after every success.
Inputs match what they hold: years are `type="number"` with the API's 1900-2100 and no
wheel or `e+-.` changes; months are a localized month list plus a year number (not
`type="month"`: no picker in desktop Firefox or Safari; not MUI X: a date adapter for one
field), with a "still studying / currently work here" checkbox for an open end; text is
checked against the API's column limits (`src/lib/profile/limits.ts`, copied from the API
because openapi.yaml does not carry them; VARCHAR counts code points, TEXT counts UTF-8
bytes, so no `maxLength` attribute); an end before its start is refused on the field. Unsaved skill changes lock
the mode switch and warn before the tab closes. Account deletion (`DeleteAccount`) needs an
"I understand" tick and signs the user out right after the API deletes: the Auth0 login
outlives the account, and a valid token would create a new empty one.

First-login onboarding (2.14): `/` renders `OnboardingGate`, which offers a dialog
while `getMe().onboarded` is false; every way out calls `completeOnboarding`. It never
blocks the page if the account cannot be read.

### The API

`src/lib/api/client.ts` (`import "server-only"`) calls gradfolio-api with
`Authorization: Bearer` from `auth0.getAccessToken()`, from server components, route
handlers and server actions only. Every failure is an `ApiError` carrying the API's
stable `code` (its `{ code, message }` envelope), or one of ours: `API_NOT_CONFIGURED`
(no `API_BASE_URL`), `API_UNREACHABLE`, `UNAUTHENTICATED` (no token: sign in again).
Branch on `code`, never on `message`. Callers: `/account` (`getMe`), `/profile` and
`/profile/[id]` (`getMe`, `getProfile`). `getProfile` sends the token when there is a
session and reads anonymously otherwise, and refuses any id that is not a UUID before
calling (no `..` path tricks). A failed load is an error screen (`ProfileError`), never
an empty profile; a private or unknown profile is a 404 (Q3).

### Data

All data is mock (`src/data/*.mock.ts`). Each feature moves to the API as its
milestone lands (tracker M2–M8). Per Q11 (decided), the API is called **from the
Next.js server only** through `src/lib/api/client.ts`. Types are generated (Q5):
`src/lib/api/openapi.yaml` is a copy of the API's contract at the commit named in
`src/lib/api/openapi.source`, and `src/lib/api/schema.d.ts` is `npm run api:types` of
it (never hand-edited; `schema.test.ts` fails on drift, in `verify` and CI).
`src/lib/api/types.ts` names the shapes components import. To take a new contract:
`sh scripts/sync-api-contract.sh <full sha of gradfolio-api>`.
Projects (`getProject`, `listMyProjects`) are on the API; descriptions go through
`src/lib/sanitize.ts` (isomorphic-dompurify, the API's allow-list) in a server component.
Project writes go through server actions (`src/lib/projects/actions.ts`, checked by `src/lib/projects/form.ts`, limits in `limits.ts`); the description editor is Tiptap, loaded on the form routes only. Attachments and uploads: `AttachmentsEditor` (own requests per change on a saved project; a draft list on a new one), `UploadControl` + `signUploadAction` (the browser PUTs to the signed URL, the token stays on the server; 503 `STORAGE_UNAVAILABLE` shows "uploads not available, paste a link"). Still mock until their milestones: dashboard, search, integrations.

## Environment variables

`.env.example` lists them. Auth0 v4 names:

| Variable                                 | Purpose                                                          |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `AUTH0_DOMAIN`                           | Tenant domain, e.g. `dev-….us.auth0.com`                         |
| `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` | The application's credentials                                    |
| `AUTH0_SECRET`                           | Session cookie encryption (`openssl rand -hex 32`)               |
| `APP_BASE_URL`                           | This app's URL (`http://localhost:3000` locally)                 |
| `AUTH0_SCOPE`, `AUTH0_AUDIENCE`          | Passed explicitly in `src/lib/auth0.ts`; the audience is the API |
| `API_BASE_URL`                           | gradfolio-api's base URL, server only (`src/lib/api/client.ts`)  |

There is no `vercel.json`; Vercel builds with its Next.js preset.

## Remote images

`next.config.ts` allows only the storage bucket's host
(`gradfolio-files-1058577031182.storage.googleapis.com`, Q6). User media is rendered with
`next/image` `unoptimized` (any https image is allowed), so no other host is listed; the
mock hosts are gone (F5, tracker 4.9). Media URLs go through `safeHttpsUrl` first.

## Pages

| Route                       | What it does                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`                         | Dashboard (client): header, stats, recent projects, quick actions, activity feed. `/dashboard` → `/`     |
| `/profile/[id]`             | Server page on `getProfile`: loading, error and 404 states; `ProfileView`; owner edits the header        |
| `/profile`, `/profile/edit` | Redirect to your own `/profile/<id>` (from `getMe`) and `/profile`                                       |
| `/projects`                 | Your projects from `GET /v1/me/projects`: filters and sort in the URL, "Load more" (keyset cursor)       |
| `/projects/[id]`            | `GET /v1/projects/{id}`: header, description (DOMPurify on the server), attachments, metadata, team      |
| `/projects/new`             | `ProjectForm` (create): sections, Tiptap description, terms, links, visibility; login required           |
| `/projects/[id]/edit`       | `ProjectForm` (edit) for the owner (404 otherwise) and delete with a confirmation naming the project     |
| `/search`                   | Explore portfolios: name, headline, skills, projects; category heuristic                                 |
| `/integrations`             | GitHub and LinkedIn cards; connect/disconnect is local state                                             |
| `/integrations/connections` | Four-step onboarding stepper (to be redesigned with 2.14 in M3)                                          |
| `/settings`                 | Language and theme                                                                                       |
| `/account`                  | `getMe` + `getMyProfile`: linked accounts, privacy switch, contact email, delete account; login required |
| 404                         | Hides the sidebar, Noise effect                                                                          |

## What is not built yet

Real data (beyond `/account`), file uploads, notifications UI, privacy controls,
AI summaries, PDF export: each is a tracker milestone. The product spec is in the
workspace `docs/`; its scope decisions are in the tracker's "Release definition".
