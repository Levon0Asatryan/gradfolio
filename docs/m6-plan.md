# M6 frontend plan: discovery and dashboard

Tracker 6.8 (search page), 6.9 (browse and tag pages), 6.10 (dashboard), and SEO for the
public pages. Plan only; no code in this PR. The API half is `gradfolio-api/docs/m6-plan.md`
(tasks 6.1-6.7), still being written. This plan states what the frontend needs and wins nothing:
where the API plan disagrees, the API plan wins and this one changes.

**Status of inputs (2026-10-10).**

- M5 FE is on `main` (#66-#80). The follow-ups from M4 and M5 are open as gradfolio #81
  (Armenian hydration, token persist, duplicate invite rows, signed-out prefetch, 404 shift). This
  plan assumes them merged; §3.3 and §8 use two of them.
- The API M6 plan is not merged. Every endpoint name and field below is a **proposal for it to
  confirm**. Nothing is built before the generated types contain the contract (Q5).
- Levon's decisions needed before code: §10.

## 1. Investigation

| Question                      | Finding                                                                                                                                                                                                                                                                                                              | Consequence                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| What `/search` is today       | `ExplorePage` is a client component over `portfolios.mock.ts` (337 lines). It filters in the browser by name, headline, skills and project text, and the "Developers / Designers / Product Managers / Data Scientists / Researchers" chips match **keywords** against headline and skills (`ExplorePage.tsx:19-47`). | The page is rebuilt as a server page on the API. The mock and the keyword heuristic are deleted (§3.2).                                       |
| What `/projects` already does | URL-driven filters (`q`, `category`, `sort`, `cursor`) parsed by `parseListQuery`, first page on the server, "Load more" through a server action, debounced search box that `router.replace`s the URL.                                                                                                               | The browse pages reuse this pattern and `parseListQuery`; no second list mechanism.                                                           |
| Route policy                  | `routePolicy.ts`: `/search` is public; `/projects` and `/` are protected. The proxy fails closed for protected paths only.                                                                                                                                                                                           | New pages are public: `/browse/*`, `/tags/*`. A new route is public by default, so the policy test lists each one (§8).                       |
| Where tags appear             | `TechTags` (project page), `SkillsChips` (profile), tags and technologies on `ProjectCard`. None links anywhere.                                                                                                                                                                                                     | Clickable tags (§3.4). Inside a card that is itself a link, a tag cannot be a link (nested interactive); see §3.4.                            |
| Data rules                    | Q3: a private profile or project is a 404 to everyone but the owner and is **excluded from search and browse**. Q11: the API is called from the Next server only.                                                                                                                                                    | Search, browse and tag calls carry **no token**: they cannot return anything a signed-in user alone may see, and can be cached (§4).          |
| Short and mixed-case terms    | investigation D3: FULLTEXT ignores words under 3 characters (`ML`, `AI`, `Go`, `C#`). D4: JSON tag match is case-sensitive.                                                                                                                                                                                          | The API falls back for short terms and normalises case (6.1, 6.2). FE: `C#` and `c++` must survive the URL (§3.4); no client minimum below 2. |
| Anonymous rate limit          | Tracker follow-up (api, M6): every anonymous request from the frontend comes from Vercel's address and shares one rate-limit bucket (m2-plan §8.4).                                                                                                                                                                  | A crawler or a burst of visitors can 429 everyone. See §4.3: decided by the API plan, not here.                                               |
| Dashboard today               | `DashboardContent` renders `statsMock`, `projectsMock`, `activitiesMock`; only the welcome card is real. `ActivityFeed` prints `templates[key] ?? key`, so an unknown key shows the raw key.                                                                                                                         | §6. Both the mock and the raw-key fallback go.                                                                                                |
| SEO today                     | Root `metadata` has title template, description and Open Graph; `/projects/[id]` has `generateMetadata`; no `robots`, no `sitemap`, no canonical, `metadataBase` unset (the build warns). Language is a cookie, not part of the URL.                                                                                 | §7. No `hreflang`: there is one URL per page, and a crawler has no cookie, so it sees English.                                                |
| Comparable apps               | GitHub (search page with a type switch and counts; topics page and `/topics/<name>`), Behance (project gallery, tag chips, "load more"), LinkedIn (people results first, short list per group, "see all").                                                                                                           | Grouped results with counts and "See all", tag pages that reuse the search layout.                                                            |

## 2. Contract needed from the API (proposal for `gradfolio-api/docs/m6-plan.md`)

Types come from `openapi.yaml` through `scripts/sync-api-contract.sh <sha>`; the sync is the first
commit of each PR. No hand-written copy of a shape.

| Need                  | Proposed endpoint                                                 | What the FE reads                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global search (6.1)   | `GET /v1/search?q=&limit=`                                        | `{ people: { items[], total }, projects: { items[], total } }`, public only. Items are the list shapes the FE already has (see below).                                                                                     |
| Tag page (6.2)        | `GET /v1/tags/{tag}?limit=`                                       | `{ tag, projects: {items[], total}, people: {items[], total} }`; unknown tag is **200 with empty groups**, not 404 (a tag is a search).                                                                                    |
| Tag cloud (6.4)       | `GET /v1/tags?limit=`                                             | `[{ tag, count }]`, skills and technologies merged, canonical spelling, sorted by count.                                                                                                                                   |
| Browse projects (6.3) | `GET /v1/projects?q=&category=&tag=&sort=&cursor=&limit=`         | `{ items: ProjectSummary[], nextCursor }`; sort `newest` always, `most_viewed` only if 6.6 lands.                                                                                                                          |
| Browse people (6.3)   | `GET /v1/users?q=&school=&major=&gradYear=&skill=&cursor=&limit=` | `{ items: UserSummary[], nextCursor }` ordered by name then id (keyset) by default, public profiles only. **Requested API change:** `sort=name                                                                             | newest`(default`name`; `newest`is account creation, newest first, id as the tie-break, still keyset) so the landing can show the newest people.`UserSummary` need not expose the timestamp. |
| Filter values         | in the people response or `GET /v1/users/facets`                  | The distinct schools, majors and graduation years that exist, so the filter shows real options, never free text.                                                                                                           |
| Dashboard (6.5)       | `GET /v1/me/dashboard`                                            | `{ counts: { projects, drafts, ... }, recentProjects[], recentActivityCount }`; the feed itself is `GET /v1/me/activities` (M5 5.5).                                                                                       |
| Activities            | `GET /v1/me/activities?limit&cursor` (merged in M5)               | `{ id, type, translationKey, translationParams, timestamp }`. Keys: `projectCreated`, `projectPublished`, `projectDeleted`, `teamInvited`, `teamMemberJoined`, `teamMemberDeclined`, `teamJoined`, `teamLeft`, `newSkill`. |

Not assumed: a total for browse (keyset has none cheaply), a view count (6.6 is stretch), a
similar-projects endpoint (6.7 is stretch; the project page gets no new section in this plan).

`UserSummary` needs at least `id, name, headline, avatarUrl, verified, school?, major?, topSkills[]`
(spec §6: "name, photo, school/major, and a couple of top skills"). The people card is the
existing `PortfolioCard` re-typed to it.

## 3. Pages

### 3.1 Routes

| Route              | Rendering                                                          | Who       | Indexed                                                           |
| ------------------ | ------------------------------------------------------------------ | --------- | ----------------------------------------------------------------- |
| `/search`          | Server page; `q` in the URL                                        | public    | landing (no `q`): yes; with `q`: no                               |
| `/browse/projects` | Server page; `q`, `category`, `tag`, `sort`, `cursor`              | public    | first page and filtered by category/tag: yes; `q` or `cursor`: no |
| `/browse/people`   | Server page; `q`, `school`, `major`, `gradYear`, `skill`, `cursor` | public    | first page: yes; any query or cursor: no                          |
| `/tags/[tag]`      | Server page                                                        | public    | yes, canonical lowercase                                          |
| `/` (dashboard)    | Server page, protected, unchanged route                            | signed-in | never (§7)                                                        |

The nav item "Explore" keeps pointing at `/search`; with no `q` that page is the landing of
discovery (§3.3), so nothing is added to the sidebar, and its two links lead to the browse pages.

### 3.2 `/search` (6.8)

- **Server page.** `searchParams.q` is trimmed, cut to 100 characters (`MAX_QUERY_LENGTH`, shared
  with `parseListQuery`) and passed to `searchAll(q)` in `src/lib/api/client.ts` with `auth: "none"`
  (§4.1). The page is `force-dynamic`, like `/projects`.
- **The URL is the state.** A `<form role="search" method="get" action="/search">` with one
  `type="search"` input: it works without JavaScript, and Enter submits. A client island adds the
  debounced `router.replace` to **`/search?q=…`** (300 ms; the hook of `/projects`, extracted to
  `src/components/shared/useDebouncedUrlQuery.ts`, takes the base path as a parameter, so the
  target is `/search` here and `/browse/…` on the browse pages; it never navigates to `/projects`,
  which is protected) so typing updates the results. A pasted URL
  `…/search?q=iot` shows the same results for anyone: that is the "can be shared" requirement.
- **Grouped results.** Two sections with a heading and a count, **People** then **Projects**
  (matches LinkedIn and GitHub; a recruiter searches names as often as work). Each shows up to 6
  cards and a "See all N" link to `/browse/people?q=` or `/browse/projects?q=` (those pages carry
  the full list and the filters). A group with no hits is not rendered, and the page says which
  groups were empty ("No people match").
- **States, each a distinct screen.**
  - _Landing_ (no `q`): tag cloud, the 6 newest projects, the 6 newest people (needs the API change in §2: a `sort=newest`
    on the people list; if the API declines, the section is labelled "People" in name order and
    never "newest"), two "Browse" links. This is
    also the empty-box state, so there is no blank page.
  - _Loading_: `loading.tsx` skeleton with the same card heights (CLS), and the input stays
    interactive; a `useTransition` pending flag shows a thin progress bar on a replace.
  - _No results_: the sentence with the query, two suggestions: check spelling, or open a tag from
    the cloud (it is shown here). Never an error look.
  - _One character_: **sent to the API, no "too short" state** (decided against the API contract
    during PR 3). `openapi.yaml` takes `q` of 1 to 100 characters, and a single character matches
    an exact skill, technology or tag (`R`, `C`): a hint instead would hide a real search. An
    empty or whitespace-only query is the landing.
  - _Error_: `ApiError` becomes an error panel with a Retry link (same URL): 429 "Too many
    searches, wait a moment", 503/unreachable "Search is unavailable". **An API error is never an
    empty result** (AGENTS "Rendering and data").
- **The role heuristic: drop it.** It matches English keywords on mock headlines, so it would
  silently hide every Armenian or Russian headline and any student who wrote "student". Replaced by
  filters the API can answer: project category on projects, skill/tag from the cloud. The five role
  chips, `FilterBar.tsx`, `portfolios.mock.ts`, `ExplorePage.tsx` and the `search.categories` keys
  are deleted.
- **Highlight.** `HighlightedText` stays (it escapes the query, F7). It only highlights the literal
  substring; a stem or fallback hit that has no literal match shows unhighlighted, which is fine.

### 3.3 Browse pages (6.9)

**Projects gallery** `/browse/projects`

- Filter chips: category (the six API values, as `/projects`), a **tag** chip when `tag` is set
  (removable), sort (newest; most viewed only if 6.6 is merged). Search box as §3.2.
- Cards: the existing `ProjectCard` (hero, category, title, summary, up to 4 technologies). It
  also needs the author's name (spec §6: "title, author name(s) and university"): the list shape
  gains `owner: { id, name }`; one line under the title, not a link (the card is the link).
- **Pagination or infinite scroll: cursor pagination with a visible "Next page" link; no infinite
  scroll.** The reason, in order of weight:
  1. **Keyboard and screen reader.** An infinite feed loads under the user's focus, pushes the
     footer and the mobile bottom bar out of reach, and has no place for focus after new items
     arrive. A link has a name, a target and a focus ring.
  2. **A page is a URL.** `?cursor=` is server-rendered, shareable, survives reload and back; an
     appended list lives in client state and is lost on reload (today's `/projects` "Load more"
     has that problem, acceptable for a private management list, not for a public gallery).
  3. **The API gives keyset cursors, not offsets** (`/me/projects` today): numbered pages with
     "page 7 of 40" are not possible without a total, so "Next page" and "First page" is the
     honest control.
  4. **CLS.** Replacing a page at a fixed card height is predictable; appending is where shifts
     come from. A "Load more" button (what `/projects` does) is a fair third option and stays
     the choice for the owner's own list.
     Cost: no Previous link. The browser's Back is the previous page; "First page" is always shown.
     Levon decides (§10, D1).
- Page size 12 (`PROJECTS_PAGE_SIZE`). Empty and error states as §3.2.

**People directory** `/browse/people`

- Filters: school, major, graduation year (`<select>`s fed by the API's facets, so the options are
  real; "Any" first), skill (from the tag cloud or typed through `tag`-style chip), name search.
- Card: `PortfolioCard` re-typed to `UserSummary` (photo, name, verified badge, school and major
  line, up to 3 top skills, headline excerpt). The whole card is one link to `/profile/<id>`.
- Ordered by name, then id. Same pagination as projects. Opt-out is the profile's privacy flag:
  a private profile never appears (Q3), and the page says nothing about who is hidden.
- No contact data is read here (AGENTS "Private fields"): the type has no `contactEmail`.

**Tag pages** `/tags/[tag]`

- The segment is `encodeURIComponent` of the **canonical** tag (`C#` is `C%23`, `c++` is
  `c%2B%2B`); the page decodes it, trims and caps at 60 characters, and asks the API, which matches
  case-insensitively (D4). If the canonical spelling differs from the URL, the page renders the
  canonical spelling and sets `<link rel=canonical>` to it (§7).
- Layout is §3.2's result layout: heading `#Tag`, People and Projects groups, "See all" links to
  `/browse/projects?tag=` and `/browse/people?skill=`. An unknown tag is the "No results" state
  with the cloud, status 200 (a crawler gets no soft 404 loop; the page is `noindex` then, §7).

**Tag cloud**

- A list of links (`<ul>`; each `<a>` has the tag and its count in the accessible name), up to 40
  tags, three size steps from the count (a CSS class per step, never a computed `font-size` from
  data), sorted alphabetically for scanning, with the size carrying popularity. Size is never the
  only carrier: the count is in the text for screen readers and as a tooltip. Colour contrast
  holds in both themes. It sits on `/search` (landing and no-results) and the browse pages' sidebar
  row on desktop; below `sm` it is a horizontally wrapping block above the list.
- Data: `GET /v1/tags`, cached 5 minutes (§4.2).

### 3.4 Clickable tags

- A shared `TagLink` (`src/components/shared/TagLink.tsx`): MUI `Chip` as a Next `Link` to
  `/tags/<encoded canonical>`. Used on the project page (`TechTags`), the profile (`SkillsChips`),
  and the result headers.
- **In a card that is itself a link, tags stay plain chips.** A link inside a link is invalid HTML
  and a screen-reader trap. The project and profile pages are where a visitor follows a tag.
- Tests: `C#`, `C++`, `.NET` and an Armenian tag round trip through `encodeURIComponent` and back;
  a tag with `/` or `%` never changes the route.

## 4. Data flow (Q11)

### 4.1 Calls

All calls are in `src/lib/api/client.ts`, which is `server-only`: `searchAll`, `getTag`,
`listTags`, `browseProjects`, `browsePeople`, `getDashboard`, `listActivities`. They share the
existing `request` helper, with a new `auth: "none"` for the five public ones: no
`getAccessToken()` call, no `Authorization` header. A public search with a user's token would let
the API answer differently per user, and would make a cached response unsafe (AGENTS "Caching").
Query values are validated by one parser per page (`parseSearchQuery`, `parseBrowseQuery`, the
existing `parseListQuery`): unknown keys are dropped, lengths are capped, `cursor` is opaque and
length-checked. "Next page" is a plain link, so no server action is needed for browse; the only
action is the dashboard's feed "load more" (§6).

### 4.2 Caching

| Call                | Cache                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| search, tag, browse | `no-store` (the key space is unbounded; results change as people publish) |
| tag cloud           | `next: { revalidate: 300 }`, no token, same for every visitor             |
| dashboard, activity | `no-store`, with the token (user data; never in a shared cache)           |

### 4.3 Rate limits

Public search is the one place a user can generate many calls. The FE does: 300 ms debounce, the
replace-not-push navigation (no history spam), no prefetch of result
links in a list of 6 to 12 cards that is not in view, and 429 handled as a message with Retry. The
shared-bucket problem (all anonymous traffic from Vercel's address) is the API's to fix: forward
the visitor's address (`X-Forwarded-For`) with `TRUST_PROXY` set, or a separate budget for the
frontend's server. **FE asks the API plan for the decision in writing**; if it is "forward", the
FE adds the header in `request` for `auth: "none"` calls only.

## 5. Strings (en / ru / am)

New dictionary groups, each in all three languages in the commit that adds the component, checked
by `locales.test.ts` (no empty string, no invented or dropped `{placeholder}`):

- `search`: landing title and subtitle, placeholder, group headings with `{count}`, "See all {count}",
  no-results with `{query}`, too-short hint, error 429 and 503, Retry, `peopleEmpty`, `projectsEmpty`.
- `browse`: page titles and subtitles, filter labels (school, major, graduation year, skill, tag,
  category, sort), "Any", "Next page", "First page", result-summary with `{count}`, empty states.
- `tags`: page title `{tag}`, "Projects tagged {tag}", "People with {tag}", cloud heading,
  cloud item name `{tag}, {count} projects`.
- `dashboard.activity`: the nine keys of §2 (§6), plus `unknown`.
- Removed: `search.categories.*`, `search.featuredProjects`, and `dashboard.activity` keys the API
  never writes (`projectUpdated`, `profileViewed`, `newConnection`, `newFollower`).

Tag names, project titles and people's names are data and are never translated.
**ru and am are machine-drafted**; the native review is queue row OR-T6. Text is never assembled
by concatenating translated fragments (counts and queries go through `{placeholders}`).

## 6. Dashboard (6.10)

- **Server component, API-backed.** `DashboardLoader` already loads `getMyProfile()`; it also calls
  `getDashboard()` and `listActivities({ limit: 10 })` in parallel. Each failure is independent and
  **shows its own error line** ("Couldn't load your activity") with the rest of the page intact; a
  failed stat is never `0`. The welcome card keeps its soft fallback.
- **Stats.** The tiles show what the API returns: projects, drafts (or published), recent
  activity. **`githubStars` and `linkedinConnections` are removed from the UI** until M7 produces
  the data: a tile that says "No data" forever is noise, and a made-up number is a wrong result
  (AGENTS). `DashboardStats` takes an array of `{ label, value }` so M7 adds tiles without a rewrite.
- **Recent projects.** The three newest from `recentProjects[]` (title, category, technologies,
  `updatedAt`), each linking to `/projects/<id>`; empty state "No projects yet" with the New
  project action. Drafts are marked.
- **Activity feed from i18n keys.** `ActivityFeed` renders `t.dashboard.activity[translationKey]`
  with `translationParams`. An unknown key (the API may add one before the FE learns it) renders a
  neutral line (`activity.unknown`), **never the raw key**. The registry of keys is mirrored in the
  dictionary type, so the compiler lists a key the FE lacks only if the API's enum is generated
  into types; until then `locales.test.ts` checks the nine. Dates through `formatDay` (UTC, hydration
  safe, #81).
- **Load more.** "Show more" asks `loadMoreActivitiesAction` (a server action; takes no user id) and appends.
  Its argument is `unknown`: it must be an object whose `cursor` is a string of 1 to 600 characters
  (the limit `parseListQuery` uses), otherwise it answers `VALIDATION_FAILED` without calling the
  API; any other key is dropped. 10 per load; no auto-scroll.
- **Deleted:** `src/data/dashboard.mock.ts`, the `Project`, `Activity` and `DashboardStats` types in
  `dashboard.types.ts` that the API types replace, and `DashboardContent`'s mock imports. `knip`
  proves nothing is left (it runs in CI).

## 7. SEO for the public pages

| Item                 | Decision                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metadataBase`       | Set from `APP_BASE_URL` in the root layout (removes the build warning; makes Open Graph URLs absolute).                                                                                                                                                                                                                                                                                                                   |
| Titles, description  | `generateMetadata` on each new page: `Explore`, `Browse projects`, `Browse people`, `#tag`, with a one-sentence description. Titles are in the request's language (`requestDictionary`), as the dashboard's already is; a crawler has no cookie, so it gets English.                                                                                                                                                      |
| Open Graph / Twitter | `og:title`, `og:description`, `og:type=website`, `og:url` = canonical, `og:site_name`; the root's `opengraph-image.png` is the image. Project and profile pages keep their own metadata and gain `og:type=article`/`profile` and `og:image` = hero when it is `https`.                                                                                                                                                    |
| Canonical            | Every public page sets `alternates.canonical` to its **clean** URL: no `cursor`, no `q`; tag pages use the canonical tag spelling. Filter-only pages (`category`, `tag`) canonicalise to themselves.                                                                                                                                                                                                                      |
| Robots               | `robots: { index: false, follow: true }` on: any page with `q`, any page with `cursor`, an empty tag page, and every result page in the **error** state. `index: true` on the landing, first browse pages and non-empty tag pages. An opaque `cursor` page is never indexed: cursors are not stable.                                                                                                                      |
| Private content      | Never indexed, by construction and by header: search, browse and tag calls carry no token and the API excludes private rows (Q3), so a page can never contain one; protected pages (`/`, `/projects`, `/teams`, `/account`, `/integrations`, `/profile`, new/edit) answer a redirect to login; the project page of the **owner's own** draft or private project sets `noindex, nofollow` (it renders for the owner only). |
| `robots.txt`         | `src/app/robots.ts`: allow `/`, disallow `/auth/`, `/api/`, `/projects/new`, `/teams`, `/account`, `/integrations`, `/settings`; point to the sitemap if there is one. `robots.txt` is a hint: the headers above are the guarantee.                                                                                                                                                                                       |
| Sitemap              | **Stretch, not in the plan's PRs.** `sitemap.ts` would need the API to list public ids; with hundreds of projects the browse pages are crawlable by links alone. Proposed as a follow-up row.                                                                                                                                                                                                                             |
| `hreflang`           | Not possible: the language is not in the URL. Recorded; adding `/ru/...` is a larger change than M6.                                                                                                                                                                                                                                                                                                                      |
| Structured data      | Out of scope for v1.                                                                                                                                                                                                                                                                                                                                                                                                      |

Tests: a unit test per `generateMetadata` (title, canonical, robots for each state in the table,
including the cursor and error cases), and a Playwright check that a protected page answers a
redirect and a search page with `q` carries `noindex`.

## 8. Tests

**Unit and component (Vitest, jsdom)** beside the file, each guard proved by removing it:

- `parseSearchQuery`, `parseBrowseQuery`: unknown keys dropped, 100-character cap, `cursor` length,
  array values, `C#`/`c++`, a 1-character query.
- `client.ts` public calls: **no `Authorization` header and no `getAccessToken` call** (the guard that
  keeps them cacheable and user-independent); `ApiError` mapping; 429.
- Search page: grouped sections with counts, "See all" hrefs carry the query, group omitted when empty,
  landing without `q`, no-results with the query shown escaped, error is not the empty state, the
  a one-character query is sent to the API (no too-short state), and an empty or whitespace-only query makes no call.
- Browse: a filter change produces the expected URL; "Next page" is a link whose `href` has the
  cursor and the same filters; "First page" drops the cursor; empty and error states.
- `TagLink`: href encoding round trip; not rendered as a link inside a card.
- Tag cloud: size step from count, accessible name has the count, order, 40-item cap.
- `loadMoreActivitiesAction`: rejects, without a call to the API, a non-object input, a missing
  or non-string cursor, an array, a 601-character cursor and an empty cursor (negative tests; the
  guard removed makes them fail); forwards a valid cursor and nothing else.
- Dashboard: each of the three sections fails alone and shows its error line; an unknown activity
  key shows `activity.unknown`, not the key; activity params interpolated with their placeholder;
  a hydration test for the feed date (the #81 pattern).
- Route policy test lists `/browse/projects`, `/browse/people`, `/tags/x`, `/search` as public, and
  `/` as protected.
- `locales.test.ts` covers the new groups.

**Contract stub.** A tiny Node server (`e2e/fixtures/api-stub.mjs`) serves canned answers for the
public endpoints, typed with `satisfies components["schemas"][...]` from the generated types, so a
contract change fails the type check instead of the browser run. It lets CI run the anonymous
specs with results, empty and error states; it is started by `playwright.config.ts` beside
`next start` (`API_BASE_URL` points at it). It is a fixture, not a mock of behaviour: the real API
runs in the verification record's logged-in and production runs (§9.3).

## 9. Playwright verification plan

Playwright and axe are in the repo since M4; this extends `e2e/smoke.spec.ts` and the
`playwright.config.ts` webServer. Browsers: `PLAYWRIGHT_BROWSERS_PATH=/Users/levon/Dev/university/.sandbox/ms-playwright`.

### 9.1 Matrix, every changed page

Pages: `/search` (landing; with results; no results; error), `/browse/projects`, `/browse/people`
(with filters), `/tags/<tag>` (with results; unknown), and the dashboard.
Dimensions: 390 and 1440 wide, light and dark, en / ru / am = **12 views per page state**.

| Check        | Assertion                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| axe          | 0 serious or critical (`@axe-core/playwright`), per view                                                                                            |
| Console      | No `error` or `warning`, no hydration message; the only allowed failure is `/_vercel/*`                                                             |
| Layout shift | CLS < 0.1 from a `PerformanceObserver` (a shared helper `e2e/helpers/cls.ts`, from the #81 404 spec), measured after `networkidle` and a 1 s settle |
| Navigation   | No request to `/auth/login` from an anonymous page (#81)                                                                                            |
| Armenian     | Run in `am` with the default browser ICU data: it is the configuration that exposed #80 and #81                                                     |

### 9.2 Keyboard walkthrough (search, filters, results)

One spec per page, only `Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`:

1. Skip link, then the search box is reachable; typing and `Enter` loads results; focus stays in the
   box (or moves to the results heading on a form submit: decided in review; one rule for the site).
2. Filter chips and selects reachable in a logical order, with a visible `:focus-visible` ring; a
   chip toggles with `Space` and `Enter`; the URL changes.
3. Each result card is one stop; a tag link in the cloud is one stop; "Next page" is reachable after
   the last card; no trap.
4. `aria-live="polite"` region announces "Results: {count}" after a search.
5. Reduced motion: no transition longer than the user's preference allows.

### 9.3 Runs

| Run                         | What                                                                                                                                                                                                  | Where                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| CI, anonymous               | §9.1 and §9.2 for search, browse and tag pages against the stub; the smoke spec's 404 and public-page checks                                                                                          | GitHub Actions, no secrets     |
| Local, anonymous, real API  | The same, against the API stack from `gradfolio-api` (own Docker project and ports) with a few seeded public and private rows: **private rows must be absent** from search, browse, tag and the cloud | developer machine              |
| Logged-in                   | Dashboard numbers equal the API's for the test account; activity feed text in three languages; the invite journey still passes                                                                        | queue row M6-T1 (headed login) |
| Production after each merge | Anonymous search, a tag page and browse; the dashboard through the queue row                                                                                                                          | deployed site                  |

Proposed queue rows (for `manual-testing.md`; the lead adds them):

| ID    | What Levon does                                                                                               | Time  | Then      | Fills in                      |
| ----- | ------------------------------------------------------------------------------------------------------------- | ----- | --------- | ----------------------------- |
| M6-T1 | Headed login of the test account for the dashboard run (`storageState` in the scratchpad, deleted afterwards) | 2 min | FE agent  | `fe-m6-verification.md` §dash |
| M6-T2 | Native check of the new ru/am strings (search, browse, tags, dashboard), or name a reviewer (extends OR-T6)   | —     | FE fix PR | tracker follow-ups            |
| M6-T3 | Decide D1-D5 of §10                                                                                           | 5 min | FE agent  | this plan, tracker            |

## 10. Decisions for Levon

| #   | Decision                                     | Recommendation and reason                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Pagination or infinite scroll on the gallery | **Cursor pagination with a "Next page" link** (§3.3): keyboard and screen-reader access, a URL per page, and the API's keyset cursors have no page numbers. Infinite scroll is rejected; "Load more" stays for the owner's list.                                                                                                                                                                               |
| D2  | Drop the role-chip heuristic                 | **Drop.** English keyword match on mock data; wrong for ru/am and for anyone who wrote "student". Replaced by category, tag and school/major filters.                                                                                                                                                                                                                                                          |
| D3  | `githubStars` and `linkedinConnections`      | **Remove the tiles until M7.** A permanent "No data" tile is noise; a number is a wrong result. The stats component takes a list so M7 adds them back.                                                                                                                                                                                                                                                         |
| D4  | A landing page at `/` for visitors           | **Yes, small**, tracker follow-up (fe, 2.10). `/` renders the dashboard for a session and, for a visitor, the `/search` landing (cloud, newest projects and people) instead of a login redirect; `routePolicy` stops protecting `/`. It gives crawlers a home page and fixes the 404 "Home" button landing in Auth0. Cost: one policy change and its test; folded into PR 4. Alternative: leave `/` protected. |
| D5  | Anonymous rate-limit bucket                  | **The API forwards the visitor's address** (§4.3). Asked of the API plan; the FE adds one header.                                                                                                                                                                                                                                                                                                              |

## 11. Order, gates, PRs

| PR  | Content                                                                                                           | Starts when                                                   | Merges when                                           |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | #81, the follow-ups                                                                                               | now                                                           | both reviewers, CI green, Levon                       |
| 2   | This plan                                                                                                         | now                                                           | one review round, then Levon                          |
| 3   | **Search and tags (6.8, 6.2 FE):** contract sync, `/search`, `/tags/[tag]`, `TagLink`, strings, tests, CI specs   | API (a) merged **and** Deploy on `main` green (`/readyz` 200) | the API PR it calls is live; both reviewers; CI green |
| 4   | **Browse and the cloud (6.9, 6.4 FE):** `/browse/*`, cloud, filters, SEO metadata and `robots.ts`, D4 if approved | API (b) merged and deployed                                   | same                                                  |
| 5   | **Dashboard (6.10):** API-backed dashboard, `dashboard.mock.ts` deleted, activity strings                         | API (c) merged and deployed                                   | same                                                  |
| 6   | FE M6 verification record (`docs/fe-m6-verification.md`): matrices, runs of §9.3, production                      | PRs 3-5 merged                                                | one review round                                      |

Rules from CLAUDE.md for each code PR: four phases; the first push is a finished PR (gate run,
guards removed once and seen failing, a real run in the browser); split commits by logical change
with tests beside the code; both reviewers on every push (`sh scripts/request-review.sh <pr>`), two
rounds then fix-now only and one confirmation round on the head; a PR that calls a new endpoint
never merges before its API PR is live; Vercel previews use the production API and database, so
test data only and deleted afterwards. The contract sync is the first commit of PRs 3, 4 and 5.

## 12. Requirement walk (normative sentences to the implementing section)

| Sentence                                                                         | Where                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------ |
| Private content never appears in search, browse or a tag page (Q3; M6 exit)      | §4.1 (no token), §8 (guard), §9.3 (seeded) |
| Searching "IoT", "ML" or an Armenian name finds what it should (M6 exit)         | §3.2 (2-char minimum, no heuristic), §9.3  |
| The query is in the URL, so a search can be shared                               | §3.2                                       |
| Empty, error and loading states exist and an error is never an empty state       | §3.2, §3.3, §6                             |
| Clickable tags lead to tag pages                                                 | §3.4                                       |
| All API calls are server-side only (Q11)                                         | §4.1                                       |
| Every string in en / ru / am                                                     | §5                                         |
| `dashboard.mock.ts` is deleted; the feed is rendered from i18n keys              | §6                                         |
| Private content is never indexed                                                 | §7                                         |
| 390 and 1440, light and dark, en / ru / am; axe; CLS < 0.1; keyboard walkthrough | §9.1, §9.2                                 |
| Anonymous specs run in CI without a login                                        | §8 (stub), §9.3                            |

## 13. Not decided here / proposed tracker changes

- The endpoint names and fields of §2 are the API plan's to set.
- Propose: mark 6.8-6.10 `in progress` when PR 3 opens; add rows for the sitemap (stretch),
  `hreflang` / language in the URL (M9 or later), a similar-projects block on the project page
  (6.7, stretch), and a native ru/am review of the M6 strings (extends OR-T6).
- Out of scope: saved searches, sorting people by anything but name, a public activity feed,
  recommendations, structured data, view counts (6.6) in the UI until the API ships them.
