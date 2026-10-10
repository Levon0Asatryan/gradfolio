# M6 frontend verification

Discovery and dashboard, tracker 6.8 to 6.10 and SEO. Plan: `docs/m6-plan.md`. Section 3 is the
anonymous run of 2026-10-11 against the **deployed site** (`https://gradfolio-navy.vercel.app`, the
production deployment of `cd7456a`, Vercel state `success`), headless Chromium, read-only: it created
no data. The logged-in dashboard comparison is not done (section 5, queue row M6-T3).

## 1. What shipped

| PR  | What                                                                                                     | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| #81 | M4/M5 follow-ups: Armenian hydration, token persist, duplicate invite rows, signed-out prefetch, 404 CLS | merged |
| #82 | This milestone's plan                                                                                    | merged |
| #83 | `/search` on the API, `/tags/[name]`, clickable tags, SEO (6.8, 6.2 FE)                                  | merged |
| #84 | `/browse/projects`, `/browse/people`, tag cloud, landing lists (6.9, 6.4 FE)                             | merged |
| #85 | Hotfix: typing in the search box erased what was typed while a search was in flight                      | merged |
| #86 | Suggestions combobox in the search box                                                                   | merged |
| #87 | The dashboard on the API; `dashboard.mock.ts` deleted (6.10)                                             | merged |

Contract: gradfolio-api `287708a` (PRs a, b, c and suggestions, deployed). Search, browse, tags,
facets, cloud, suggestions and the dashboard types come from the generated schema (Q5).

## 2. Evidence without the deployed site

- `npm run verify` (1253 tests), coverage, `knip`, production build, `npm run e2e` 161 passed (the
  logged-in specs are skipped without a storageState).
- `e2e/discovery.spec.ts` (anonymous, against a typed API stub): landing, grouped results, people list,
  no results, tag page, browse projects (filled and empty), browse people, each at 390 and 1440, light
  and dark, en/ru/am: axe 0 serious or critical, console clean (no hydration message), CLS < 0.1, no
  request to `/auth/login`. Behaviour: shareable URL, errors, paging, noindex and canonical, keyboard
  order, no token and the forwarded address at the stub, suggestions combobox, typing while a search is
  in flight (en/ru/am, 390/1440).
- Every guard removed once and a named test seen failing (each PR body lists them).
- A real-browser run on a production build against a fake Auth0 and API (a real SDK session cookie, no
  real credentials): the dashboard in 12 views, axe 0, console clean, CLS 0.000. It found two defects
  that unit tests had not (section 4).

## 3. Deployed site, anonymous (2026-10-11)

Production holds test data only (6 public profiles, 5 public projects, 8 tags; no IoT, ML, AI or
Armenian/Russian content). The run recorded what it returned; it did not create data. Rate limits:
the pass was paced (about 2 seconds between searches); no 429 appeared.

### 3.1 Search matrix

| Query                                | People | Projects | Notes                                                        |
| ------------------------------------ | ------ | -------- | ------------------------------------------------------------ |
| `IoT`, `iot`, `iOt` (case)           | 0      | 0        | nothing in the data; the three spellings agree               |
| `ML`, `AI`, `C#`, `R`                | 0      | 0        | short tokens: 200 with the empty state, no error             |
| `Go`, `go`                           | 0      | 1        | the term `Go` is a project technology; case-insensitive      |
| `Python`, `python`                   | 0      | 1        | same                                                         |
| `Արմեն`, `ԱՐՄԵՆ`                     | 0      | 0        | no Armenian content in the data; both spellings agree        |
| `Алёна`, `алена`                     | 0      | 0        | no Russian content; both spellings agree                     |
| `machine learning`                   | 0      | 0        | two tokens                                                   |
| `zzzzqqq`                            | 0      | 0        | empty state                                                  |
| names read from `/browse/people`     | 1 to 3 | 0 to 1   | `Pargev`, `Levon`, `Test`, `Asa`; upper-case spellings agree |
| project titles read from the gallery | 0 to 3 | 1        | `asdasdasd`, `sfsdf`, `E2E-M4-...`, `Asa`                    |

Private and draft content: no result card has a Draft or Private chip (result cards do not carry
them), and every project and profile linked from search, browse and the landing answers **200
anonymously** (5 of 5 projects, 6 of 6 profiles). The data holds no known private or draft item that
the queries target, so "absent by construction" (the API excludes them for everyone, the owner
included, and the FE sends no token) is what was observed, not a seeded negative.

### 3.2 Pages and behaviour

| Check                                                                       | Result                                                                                                                                              |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing: tag cloud, newest projects and people                              | pass: 8 tags (`ADASD`, `asd`, `Go`, `Python`, ...), 11 cards, no section error                                                                      |
| `/browse/projects`                                                          | pass: 5 cards, no Next page (one page), no Draft/Private chip                                                                                       |
| `/browse/projects?category=course`                                          | pass: 2 cards, `index, follow`                                                                                                                      |
| `/browse/people`                                                            | pass: 6 cards, school filter present                                                                                                                |
| Tag page `/tags/ADASD`, `/tags/Go`, `/tags/Python`, `/tags/go`              | pass: 200, `Tag: <canonical spelling>`, `go` shows `Go`, canonical to the API's spelling                                                            |
| Unknown tag (`/tags/IoT`, `/tags/C%23`, `/tags/no-such-tag-zzz`)            | pass: real 404 with `<meta name="robots" content="noindex">`                                                                                        |
| Typing while a search is in flight (the #85 bug), `iot` then ` garden home` | pass on production: the box ends `iot garden home`, focused, URL `?q=iot+garden+home`                                                               |
| Suggestions combobox: `io`, ArrowDown, Escape                               | pass: `aria-expanded` true, one option (`Search for “io”`: nothing starts with `io`), `aria-activedescendant` set, Escape closes and keeps the text |
| View matrix: 5 pages x en/ru/am x 390/1440 x light/dark = 60 views          | pass: status 200, one `h1`, `<html lang>` en/ru/hy, axe 0 serious or critical, console clean, CLS 0.000 in all 60                                   |

Hydration: no hydration message in any of the 60 views (the console watcher records errors and
warnings; `_vercel` analytics scripts are 404 on the production host by design and excluded).

## 4. Defects found, and where

| Defect                                                                                                           | Found by                                 | Fixed |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----- |
| `/projects` hydration mismatch in Armenian (server ICU has `hy`, headless Chromium does not)                     | Playwright, production build             | #81   |
| Expired access token: "Failed to persist the updated token set"; the next request reused a rotated refresh token | fake IdP with a rotating refresh token   | #81   |
| Revoked refresh token served a protected page normally                                                           | Codex round on #81, run against fake IdP | #81   |
| 404 layout shift 0.172 at 1440; 14 `/auth/login` prefetches per signed-out view                                  | Playwright, production build             | #81   |
| A tag named `C%23` was decoded twice (page and metadata disagree)                                                | Codex round on #83, run on the build     | #83   |
| Typing in the search box could erase what was typed while a search was in flight                                 | the user, in production (since #83)      | #85   |
| Highlight `<mark>` failed contrast (grey caption on yellow); skeleton `aria-label` on a bare `div`               | axe in the new matrix                    | #83   |
| A page's own `openGraph` dropped the share image                                                                 | reading the built HTML                   | #83   |
| "Search for" printed `$&` as a replacement pattern                                                               | second-pass review                       | #86   |
| "Show more" on the dashboard did nothing (the route refresh reset the list)                                      | real-browser run with a fake IdP and API | #87   |
| An activity key named `constructor` or `toString` found an Object property and crashed the feed                  | second-pass review                       | #87   |

**Observations (data, not code).** A profile's display name is an e-mail address
(`test1234@gmail.com`) and is searchable and shown in the directory: it is the user's own public
display name, but a student may not expect it to be public; worth a hint on the profile form
(proposed follow-up). The 404 for an unknown tag has a `canonical` link to its own URL after
hydration; the response carries `noindex`, so nothing is indexed (cosmetic).

## 5. Not verified

- **The logged-in dashboard against the API for a real account (queue row M6-T3):** the numbers
  (projects, published, drafts, 30-day activity, GitHub stars `null`), the three most recent projects
  and the five newest entries compared with `GET /v1/me/dashboard` and with the stored rows. The
  production dashboard was not opened with a login.
- The dashboard on the deployed site, any language (needs a session).
- **A seeded negative for private and draft content on the deployed site:** production holds no
  private or draft item the queries target, and the run created none. The API's own matrix (its PRs)
  covers it.
- A real screen reader (NVDA, VoiceOver) on the combobox and the results: ARIA structure, axe and key
  events only. A real mobile input method (Android, iOS Armenian and Russian keyboards): composition
  was simulated.
- Safari and Firefox: Chromium only.
- Armenian and Russian content: none exists in production data, so ranking and case folding for those
  scripts are verified by the API's tests and by the two spellings agreeing, not by hits.
- The forwarded visitor address in production (`API_PROXY_SECRET` on Vercel): the header is sent only
  when the variable is set; whether it is set, and whether Vercel's `x-forwarded-for` is the client,
  was not observed from here.
- Native ru/am review of the strings added in M6 (queue row OR-T6).

## 6. Proposed tracker changes

- 6.8, 6.9, 6.10: `done` (FE), with the not-verified items above carried as follow-ups.
- Follow-ups: the dashboard comparison (M6-T3); a hint that a profile's display name is public; the
  sitemap (stretch); `hreflang` / language in the URL; a similar-projects block (6.7); an e2e against
  the real API in CI (the stub is a fixture, not the contract).
