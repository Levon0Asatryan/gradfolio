# M7 frontend plan: integrations, GitHub import, LinkedIn export import

Tracker 7.9 (LinkedIn wizard), 7.10 (FE half), 7.11 (integrations page, GitHub wizard) and 7.12
(badges), plus the re-sync UX of 7.4. Plan only; no code in this PR. The API half is
`gradfolio-api/docs/m7-plan.md` (tasks 7.1-7.8), written in parallel. Where it disagrees with this
plan, **the API plan wins and this one changes**.

**Status of inputs (2026-10-11).**

- M6 FE is on `main` (#81-#88). The mock integrations page and the mock connections stepper are
  still what ships.
- The API M7 plan is not merged. Every endpoint, field and error code below is a **proposal for it
  to confirm** (section 2). Nothing is built before `openapi.yaml` carries the contract (Q5); the
  contract sync is the first commit of each implementation PR.
- Decisions needed from Levon before code: section 12.

## 1. Investigation

| Question                         | Finding                                                                                                                                                                                                                                                                                                       | Consequence                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What `/integrations` is today    | `IntegrationsPage` is a client component over `integrations.mock.ts`: GitHub starts "connected, synced 2025-01-15", connect and disconnect are `useState`. A user sees a connection that does not exist.                                                                                                      | Rebuilt as a server page on the API; the mock and its fake state are deleted (3).                                                                                                                   |
| What `/integrations/connections` | A four-step `Stepper` (welcome, basic info, experience text, repos text) over local state; the two "import" buttons are `setTimeout`; `handleFinalComplete` is a `console.log`. Nothing is saved. `OnboardingDialog` sends "Connect accounts" here.                                                           | The page keeps its route and the `Stepper` look, and gets real steps (7). The fake steps and `initialProfileForm` go.                                                                               |
| Where the 4.5 MB limit bites     | A Vercel function's request body is capped near 4.5 MB (M4 lesson). A server action that receives the ZIP fails in production and passes locally.                                                                                                                                                             | The ZIP never passes through Next. Same pattern as M4: `signUploadAction` asks the API for a signed URL, the browser `PUT`s with `putFile` (XHR, progress), the token stays on the server (6.3).    |
| Upload plumbing that exists      | `src/lib/uploads/{actions,putFile,rules}.ts`: host allow-list (`storage.googleapis.com`, https, `PUT`), type and size rules per purpose, `putFile` with progress, abort and a separate "unreachable" result (missing CORS). `signUploadAction` only knows `avatar`, `hero`, `attachment` and image/PDF types. | A sibling action for the export (own purpose, own type and size rule), reusing `putFile` and the host check; the existing action is not widened.                                                    |
| Dates and hydration              | `formatDate` uses the browser locale; server Node has Armenian ICU data and Playwright's Chromium has none (M5 #80). `dateHydration.test.tsx` already covers `IntegrationCard`.                                                                                                                               | Every new date (last synced, repo pushed-at, import preview dates) goes through the helper used by #80 and gets a case in `dateHydration.test.tsx` (11).                                            |
| Route policy                     | `/integrations` and `/integrations/*` are a protected prefix (`routePolicy.ts`). A new route under it is protected without a change.                                                                                                                                                                          | `/integrations/github/import` and `/integrations/linkedin/import` need no policy edit; a test lists them (11).                                                                                      |
| Plurals                          | No plural machinery in the dictionaries; Russian has three forms.                                                                                                                                                                                                                                             | No sentence with a counted noun. Counts use the "label: number" form (`Selected: {count}`); the `locales.test.ts` placeholder check covers them.                                                    |
| `source` and repo data on the FE | `ProjectDetail` already has `source: "manual" \| "github"` and `repo { url, stars, forks, language, latestCommitDate, readmeUrl }`. `ProjectSummary` (list cards) has neither. `DiscoveryProject` is documented as "never repository data".                                                                   | The detail page and the owner's `/projects` cards can badge GitHub-sourced projects; `ProjectSummary` needs `source` from the API (2). Public discovery cards get no badge unless the API adds one. |
| Stepper component                | `Stepper` takes `canProceed(step)` and fixed Back/Next; it cannot express "Next is Upload, and only after the file is verified", or an async step.                                                                                                                                                            | The wizards are a small state machine (`useReducer`) rendered with the existing `StepIndicator` and visual language; `Stepper` itself stays for the onboarding flow only (7).                       |
| Testing a logged-in page in CI   | The e2e job never logs in; logged-in specs are skipped without a `storageState` (M4-M6). The M5 follow-up "seeded-session CI job" is open.                                                                                                                                                                    | Section 11.2: mint a session cookie with the SDK's `generateSessionCookie` (`@auth0/nextjs-auth0/testing`, 4.30.0) and a canned API stub. **A claim to run first, not assume.**                     |
| Comparable apps                  | GitHub's own import-from-repo pickers (searchable list, "already imported" rows disabled); Vercel's "Import Git Repository" (list, one button per row, then a progress page); LinkedIn's own "Download your data" page (request, wait, email, download).                                                      | Pick -> import -> review as three visible steps; LinkedIn instructions say plainly that the file arrives later (6.1).                                                                               |

## 2. Contract needed from the API (proposal for `gradfolio-api/docs/m7-plan.md`)

Types come from `openapi.yaml` via `scripts/sync-api-contract.sh <sha>`. Paths, field and code
names below are proposals; shapes are what the FE needs, not what it dictates.

| Need                | Proposed endpoint                                                       | What the FE reads                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status (7.11, 7.10) | `GET /v1/me/integrations`                                               | `{ github: { status: connected \| not_connected \| needs_reconnect, login, connectedAt, lastSyncedAt }, linkedin: { status, via: signin \| import \| null, lastSyncedAt } }`. **Never** a token or scope list.                                            |
| Connect (7.2)       | `POST /v1/me/integrations/github/connect`                               | `{ authorizeUrl }`; the API binds a single-use `state` to the caller.                                                                                                                                                                                     |
| Connect result      | the API's callback redirects to `/integrations?github=connected\|error` | A **hint only** (toast); the card shows what `GET` says (4.2). If the API prefers the callback on a Next route, the FE adds `/integrations/github/callback`, a route handler that forwards `code` and `state` with the session. Q: which? (section 12)    |
| Disconnect (7.2)    | `DELETE /v1/me/integrations/github`                                     | 204; and whether `verified` changed, so the page can say so (4.4).                                                                                                                                                                                        |
| Repo picker (7.3)   | `GET /v1/me/integrations/github/repos?cursor&limit&q`                   | `{ items: [{ githubRepoId, fullName, description, language, stars, forks, pushedAt, isPrivate, isFork, isArchived, importedProjectId \| null }], nextCursor }`. Rate-limit state as an error code with `retryAfter` seconds.                              |
| Import (7.3)        | `POST /v1/me/integrations/github/import` `{ githubRepoIds: [] }`        | `{ results: [{ githubRepoId, status: created \| existing \| failed, projectId, code }] }`; at most N ids per call (N stated by the API; the FE mirrors it like `limits.ts`). A double submit gives `existing`, not a second project.                      |
| Re-sync (7.4)       | `POST /v1/me/projects/{id}/resync`                                      | `{ syncedAt, updated: [{ field, from, to }], kept: [{ field, githubValue? }], unchanged: [field] }`. `githubValue` only for short text fields, never the README. Fields: `title`, `summary`, `description`, `technologies`, `stars`, `forks`, `language`. |
| LinkedIn upload     | `POST /v1/me/imports/linkedin/uploads` `{ size, contentType }`          | `{ importId, uploadUrl, method: PUT, headers, expiresAt }`; `uploadUrl` on `storage.googleapis.com`. The bucket CORS must allow `application/zip` and the signed headers.                                                                                 |
| LinkedIn preview    | `POST /v1/me/imports/linkedin/{importId}/preview`                       | `{ positions[], education[], skills[], certifications[], skippedColumns[], warnings[] }`; every item `{ itemId, label, subtitle, start, end, duplicate, problem? }`. Items are **held server-side**, keyed by `importId`, with a TTL.                     |
| LinkedIn confirm    | `POST /v1/me/imports/linkedin/{importId}/confirm` `{ itemIds: [] }`     | `{ added: { positions, education, skills, certifications }, skipped, lastSyncedAt }`. The FE sends ids, never content: the API cannot trust content that round-trips through a browser.                                                                   |
| LinkedIn cancel     | `DELETE /v1/me/imports/linkedin/{importId}`                             | 204; deletes the ZIP and the held preview ("Cancel" and "I changed my mind").                                                                                                                                                                             |
| Badges (7.12)       | `ProjectSummary.source`                                                 | **Change requested:** add `source` to `ProjectSummary` (the owner's list and the dashboard's recent projects). Optional: `ProfileSummary.verifiedVia: email \| github` so the badge can say why.                                                          |

Proposed error codes (the FE branches on `code`, never on `message`): `GITHUB_NOT_CONNECTED`,
`GITHUB_RECONNECT_REQUIRED` (token revoked or expired), `GITHUB_RATE_LIMITED` (+ `retryAfter`),
`GITHUB_UNAVAILABLE`, `GITHUB_REPO_GONE`, `IMPORT_TOO_MANY`, `LIMIT_REACHED` (a profile cap),
`IMPORT_IN_PROGRESS` (409 on a concurrent re-sync), `LINKEDIN_ZIP_TOO_LARGE`,
`LINKEDIN_ZIP_INVALID` (not a zip, a bomb, traversal, no CSV), `LINKEDIN_ZIP_EMPTY` (a zip with none
of the four data files), `IMPORT_EXPIRED`, `IMPORT_NOT_FOUND`, `STORAGE_UNAVAILABLE` (exists),
`TOO_MANY_REQUESTS` (exists). Every code gets a mapped message in all three languages (10); an
unknown code gets a generic message plus the retry affordance, never a blank state.

Not assumed: a webhook or background sync (re-sync is manual), a per-repo import progress stream, a
way to import an organisation's repos, push-to-GitHub, a LinkedIn "connected" state from anything but
the sign-in identity and a past import.

## 3. The integrations page (7.11)

### 3.1 Route and data

`/integrations` becomes a **server page**: `getIntegrations()` in `src/lib/api/client.ts`
(`import "server-only"`, the caller's token, never cached). A failed load is an **error panel with
Retry**, never an empty state (AGENTS: "an error shown as an empty state"). `integrations.mock.ts`
and `IntegrationsPage.test.tsx`'s fixtures are deleted; `IntegrationCard` stays as a presentational
component fed by API data. Metadata title through `requestDictionary()` like `/integrations/connections`
(today it is a hardcoded English string).

### 3.2 Cards

| Card     | States                                                                                    | Actions                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| GitHub   | not connected / connected (`@login`, connected on, last synced) / needs reconnect (alert) | Connect (or Reconnect); Import repositories -> `/integrations/github/import`; Disconnect (confirm dialog)    |
| LinkedIn | not connected / connected via sign-in / imported (last imported) / both                   | Import from LinkedIn export -> `/integrations/linkedin/import`. No connect or disconnect: there is no token. |

- Status is **text plus an icon**, never colour alone. "Last synced" is `<time dateTime>` through
  the shared helper; `null` prints "Never", not a 1970 date.
- LinkedIn's card says what "connected" means here: "You signed in with LinkedIn. We use your name
  and photo; your headline and history come from the export" (spec: LinkedIn sign-in returns no
  headline, m2-plan 8.2). No wording suggests an API sync that does not exist (Q8).
- The info panel "no integrations connected" stays, as `role="status"`, only when both are
  `not_connected`.

### 3.3 Connect

`startGithubConnectAction()` is a server action: no arguments, the session decides who connects. It
returns `{ ok, authorizeUrl }`. Before the browser follows it, the host is checked against an
allow-list (`github.com`, or the Auth0 tenant host if Levon picks option A for 7.1): a URL from an
API response is still a redirect target (AGENTS: open redirects). Navigation is
`window.location.assign`, so Back from GitHub returns to `/integrations`.

### 3.4 Return from GitHub

- The page reads `?github=connected` or `?github=error&reason=<code>` **once**, shows a toast
  (`FlashToast`, exists) and `router.replace("/integrations")` strips it.
- The toast is a hint: "GitHub connected" shows only if the status loaded in the same render is
  `connected`. A forged `?github=connected` on a disconnected account shows the card as
  disconnected and no success toast. Test by removal.
- Reasons mapped to messages: user denied access, state expired or reused, GitHub unavailable,
  already linked to another Gradfolio account (if the API says so).
- A session that expired during the GitHub round trip goes through `/auth/login?returnTo=...`
  (the proxy already does this for the `/integrations` prefix); the query survives `returnTo`.

### 3.5 Disconnect

A MUI `Dialog` (focus moves in and returns), title names the account: "Disconnect @login?", body
states exactly what the API does: stored tokens are deleted and revoked at GitHub; imported projects
and their data stay; re-sync stops working until reconnected; and, if the API says so, that the
verified badge may go. Primary action is "Disconnect" with the Cancel button focused first (the #75
pattern). Failure keeps the dialog open and says so.

## 4. GitHub import wizard (7.11)

Route `/integrations/github/import`, a full page: URL-addressable, the Back button works, and the
onboarding flow can embed the same component (7). Component: `GithubImportWizard`.

### 4.1 State machine

```
gate -> pick -> importing -> review
 |        ^         |
 |        '---------'   (all failed: back to pick, selection kept)
 '-> not connected / needs reconnect (panel with Connect)
```

- **gate**: server component checks status; not connected renders the Connect panel in place of the
  picker (no dead end), needs-reconnect likewise.
- **pick** (step 1 of 3): server-fetched first page; "Load more" through a server action with the
  API's cursor (the `/projects` pattern; no infinite scroll). A debounced search box filters through
  `q` on the API (same hook as `/projects`). Rows are one checkbox each, accessible name =
  full name; description, language, stars, pushed-at, and chips for private, fork, archived. A repo
  with `importedProjectId` is **disabled** with "Imported" and a link to its project, so it cannot
  be picked twice. A counter `Selected: {count} / {max}` is a live region; past the cap further
  boxes disable and say why. Primary "Import selected" is disabled at zero.
- **importing** (step 2): the button disables at the click (a second click is a no-op), the page
  shows "Importing {count} repositories" with `aria-busy`, indeterminate bar. It is one API call
  (the results come back together), so no fake per-repo percentages. Leaving mid-call is warned
  (`beforeunload`); the API's dedupe makes a retry safe, and the plan says so in the copy: "If this
  page closes, open it again: repositories already imported are marked."
- **review** (step 3): one row per result. `created` rows show title, a **Draft** chip, "Edit and
  publish" (`/projects/{id}/edit`) and "Open" (`/projects/{id}`); `existing` rows say "Already
  imported"; `failed` rows say why in words per code, with "Try again" that returns to pick with the
  failed ones still ticked. Nothing is published automatically: the README is untrusted content the
  owner should read first. No bulk publish in v1 (12, D4).

### 4.2 Failure states

| Cause                                   | Shown                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `GITHUB_RATE_LIMITED`                   | "GitHub's limit is reached. Try again in {minutes} min" using `retryAfter`; Retry disabled until then |
| `GITHUB_RECONNECT_REQUIRED`             | Alert with Reconnect; selection kept in memory                                                        |
| `GITHUB_UNAVAILABLE`, `API_UNREACHABLE` | Error panel with Retry; never "No repositories"                                                       |
| zero repos                              | The only real empty state: "No repositories on this GitHub account" with a link to GitHub             |
| all repos imported                      | "Everything is imported" with a link to `/projects`                                                   |
| `LIMIT_REACHED` (project cap)           | The cap message from M4, naming how many fit                                                          |

## 5. Re-sync UX (7.4)

Placement: the **owner's project page** (`OwnerBar` area), not the edit form. A re-sync changes
server values; a form open at the same time would hold stale ones, and saving it could overwrite the
sync. Putting it on the detail page removes that interaction.

- A card "GitHub repository" shown only to the owner of a `source === "github"` project: repo link,
  stars, forks, language, latest commit, "Last synced {date}", and **Sync from GitHub**.
- Click -> server action `resyncProjectAction(projectId)` (id validated as a UUID before any call, as
  `getProfile` does). On success: `router.refresh()` and a dialog, `role="status"` announced, focus
  returns to the button:

  | Section                | Content                                                                                             |
  | ---------------------- | --------------------------------------------------------------------------------------------------- |
  | Updated from GitHub    | field name, old -> new value (stars and forks as numbers; text fields truncated at 80 chars)        |
  | Kept: you edited these | field name, "Your version was kept." and, where the API sends it, GitHub's current value, read-only |
  | Unchanged              | one line: "{count} fields already match GitHub"                                                     |

- Nothing updated and nothing kept: "Already up to date." (a state, not an error).
- **Fields kept because the user edited them** are the whole point of 7.4 and are never overwritten;
  the FE has no "use GitHub's version" button in v1 (12, D5). The user can copy by hand.
- Errors: `GITHUB_REPO_GONE` ("the repository was deleted, renamed away or is no longer visible
  to your GitHub account"; the project and its data stay), `GITHUB_NOT_CONNECTED` and reconnect
  (link to `/integrations`), `GITHUB_RATE_LIMITED`, `IMPORT_IN_PROGRESS` ("a sync is already
  running"), network. The button re-enables after every outcome.
- Stale page: the sync button always sends the project id and the API decides ownership (404 for
  everyone else); the card's visibility is presentation, not a guard.

## 6. LinkedIn export import wizard (7.9)

Route `/integrations/linkedin/import`; component `LinkedinImportWizard`, embeddable (7).

### 6.1 Steps

```
1 Get your export  ->  2 Upload  ->  3 Review  ->  4 Done
 (instructions)       (ZIP, progress)  (checkboxes)   (counts)
```

**Step 1, instructions.** What the user must know, in order:

1. LinkedIn does not hand the file over at once. It is requested, then arrives by email, typically
   within about 24 hours but sometimes longer (M7-T1 measured 24-72 h; the copy gives the range the
   real runs show). The wizard therefore has two entry points: "I have my file" and "I need to
   request it". The second explains the request, then **ends in a calm "come back when the email
   arrives"** with a link to this page; it is not a dead end and not a blocking step in onboarding.
2. The request path (labels exactly as LinkedIn shows them, checked against real accounts in
   M7-T1): profile menu -> Settings & Privacy -> Data privacy -> Get a copy of your data -> choose
   the larger archive (the one that lists every file) -> Request archive -> confirm the password
   (on LinkedIn, never here).
3. The download: email "Your LinkedIn data archive is ready" -> Download -> a `.zip`. **Do not
   unzip it**; upload as it is.
4. Privacy line: "The file stays private. We read only positions, education, skills and
   certifications; nothing is saved until you confirm; the file is deleted afterwards" (wording
   confirmed against the API's deletion behaviour).

**Screenshots, described per language.** Static images under `public/linkedin-export/<lang>/`, each
with alt text from the dictionary. The set is the same in all three languages; what differs is the
language of LinkedIn's own labels in the picture:

| #   | Picture (all languages)                                                                 | `en`                | `ru`                                                   | `am`                                                                                       |
| --- | --------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | Profile menu open, "Settings & Privacy" highlighted                                     | LinkedIn in English | LinkedIn in Russian ("Настройки и конфиденциальность") | English labels, circled. LinkedIn's interface may not offer Armenian: **verify in M7-T1**. |
| 2   | Data privacy page with "Get a copy of your data" highlighted                            | English             | Russian                                                | English labels; the caption in Armenian names them in quotes                               |
| 3   | The archive options: larger archive selected, "Request archive" button                  | English             | Russian                                                | English labels                                                                             |
| 4   | The "ready" email with the Download button, and the downloaded `.zip` in a file manager | English             | Russian                                                | English labels                                                                             |

- Screenshots can only be taken from a real LinkedIn account, so **Levon captures them** (queue
  row M7-T7) with a throwaway or fully cropped view: no name, photo, email or connection count may
  appear. They are reviewed before commit; an image with personal data is a blocker.
- The wizard **ships without them if they are late**: each image is optional, the numbered text
  steps stand alone, and a missing file is a build-time check (a list in code), not a broken image.
- The instruction text carries "as of {date}" and a link to LinkedIn's own help article, because
  LinkedIn changes its menus.
- Images use `next/image` with explicit width and height (no layout shift), `loading="lazy"`,
  and are decorative-plus-described: alt text says what to click, not "screenshot".

**Step 2, upload.**

- One drop zone that is also a real `<button>` opening the file input (keyboard and screen reader
  reachable; drag-and-drop is an addition, never the only way). `accept=".zip,application/zip"`.
- Client checks before any request: extension `.zip`, size above 0 and at or under the API's cap
  (mirrored in `src/lib/linkedin/limits.ts`, "copied from the API like `limits.ts`"). The browser's
  MIME type for zips is unreliable (empty on some systems, `application/x-zip-compressed` on
  Windows), so the **API's** type and content checks are authoritative and the FE does not refuse a
  `.zip` by MIME alone. A refused file says why and keeps the picker open.
- Flow: `startLinkedinUploadAction({ size })` -> signed ticket -> `putFile` with a progress bar
  (`role="progressbar"`, value, and the percentage in text) -> `previewLinkedinImportAction({
importId })` -> "Reading your file" (indeterminate, `aria-busy`) -> step 3.
- **Cancel** during upload aborts the XHR (`AbortSignal`, exists) and calls the delete endpoint so
  the half-uploaded object is not left; Cancel during "Reading" calls delete as well.
- Failure mapping: `LINKEDIN_ZIP_TOO_LARGE` (shows the cap in MB), `LINKEDIN_ZIP_INVALID` ("This is
  not a LinkedIn data archive. Upload the .zip as downloaded"), `LINKEDIN_ZIP_EMPTY` ("We found none
  of the four lists we import"; says which files are looked for), `STORAGE_UNAVAILABLE`,
  `unreachable` (the CORS case, previews: "Uploads work on the main site only"), 403 from the bucket
  (the signature expired: "Try again" asks for a new ticket), rate limit. Each one keeps the user
  on step 2 with the file chosen and Retry.

**Step 3, review.**

- Four sections (Positions, Education, Skills, Certifications), each a `<fieldset>` with a
  `<legend>`, a section "Select all" checkbox with `indeterminate`, and one checkbox per item:
  label = title, then organisation and dates as a description (`aria-describedby`). Counts in the
  legend: `{selected} / {total}`.
- Defaults: new items **ticked**; `duplicate` items **unticked and disabled** with "Already on your
  profile"; items with a `problem` (an unreadable date) unticked and disabled with the reason.
  Nothing is hidden.
- A collapsed "What we skipped" lists `skippedColumns` (header names only, no cell data) and
  `warnings`, so a column we did not recognise is visible, not silently ignored (7.7).
- Sticky action bar (bottom on phone): "Selected: {count}", **Add selected** (disabled at zero),
  "Start over". Leaving with a selection warns before the tab closes.
- The preview lives only in component memory: not in `localStorage`, the URL, a cookie or the
  query string (personal data; 9). A refresh loses it and says "Upload the file again" on return.
- If every item is a duplicate: "Nothing new in this file" with Done; Add is absent. That is the
  second-identical-import case from the exit criterion.

**Step 4, done.** Counts added per section (labels with numbers, no plurals), "Skipped as
duplicates: {count}", last imported date, links to the profile and to the next onboarding step.
Errors on confirm: `LIMIT_REACHED` (names the section and how many fit; selection kept),
`IMPORT_EXPIRED` ("This preview expired. Upload the file again."), `IMPORT_NOT_FOUND`.

### 6.2 Server actions

All are public endpoints (AGENTS): they take **no user id**; they validate their arguments before
forwarding (`importId` a UUID, `itemIds` an array of at most the API's cap, each a string of at
most 64 chars, de-duplicated; size an integer within the cap); they return `{ ok, ...}` or
`{ ok: false, code }`; they never return or log an item's content or a token.

## 7. Onboarding (the stepper redesigned in M3)

`OnboardingDialog` and `OnboardingGate` are unchanged: first login still offers "Connect accounts",
which goes to `/integrations/connections`. That page is the **onboarding flow** and keeps the
`Stepper` look; its steps become real:

| Step | Content                                                                                | Skippable            |
| ---- | -------------------------------------------------------------------------------------- | -------------------- |
| 1    | Connect GitHub and import repositories: `GithubImportWizard`, embedded                 | yes ("Skip for now") |
| 2    | LinkedIn: sign-in status, and `LinkedinImportWizard`, embedded; "I will do this later" | yes                  |
| 3    | Summary: what was connected and imported, links to profile and `/projects`             | -                    |

- Every step is skippable and every outcome is shown; skipping marks nothing as done. The user is
  never asked to finish before using the site (`completeOnboarding` already happened when the dialog
  closed).
- A user who arrives with GitHub already connected (sign-in via GitHub) starts at the picker.
- A user with no LinkedIn export yet sees step 1 of the wizard's instructions and the "come back
  later" exit, so the LinkedIn wait does not stall onboarding.
- The embedded wizards use the same component and state machine as the standalone pages; a test
  renders both and compares behaviour, so the two cannot drift.
- The fake basic-info, experience and repos steps are deleted with `initialProfileForm` and their
  tests (knip enforces no leftover exports). Profile fields are edited on the profile, which is
  real since M3.

## 8. Badges (7.12) and LinkedIn sign-in state (7.10 FE half)

- **GitHub source badge.** A chip with the GitHub icon and the text "GitHub" (text, not icon alone;
  `aria-label` via the text) on: the project page header, and `ProjectCard` in the owner's
  `/projects` and the dashboard's recent projects, driven by `source === "github"`. On the detail
  page it sits beside the repo link. Public discovery cards: only if the API exposes `source` there
  (2). A badge never renders from the URL (`repoUrl` on a manual project does not make it
  "GitHub-sourced"); a test pins that.
- **Verified badge.** The existing `VerifiedBadge` gets an accessible description of how it is
  earned: "email confirmed" and/or "GitHub linked" (generic copy if the API sends no `verifiedVia`).
  The account page's help text names both ways. After disconnecting, the page tells the user if
  `verified` changed (3.5).
- **LinkedIn connected.** Shown on the integrations card from the API's status (3.2); the FE
  computes nothing about identities itself. `AccountSummary`'s linked-accounts list is unchanged.

## 9. Security and privacy

- **Q11.** Every API call is server-side (server components, server actions, route handlers) with
  the token from `auth0.getAccessToken()`. The only browser-to-third-party request is the ZIP's
  `PUT` to a signed URL, whose host the server action has already checked (`https`,
  `storage.googleapis.com`, `PUT`). The signed URL is the credential: it is not logged, not put in
  a URL of ours, and not kept after the upload.
- **No token, scope or secret** reaches a client component's props; the status payload has none.
  Props are serialised into HTML, so the status passed to client components is the narrow
  `{ status, login, lastSyncedAt }` shape, not the API response object.
- **Redirects.** `authorizeUrl` host allow-list (3.3); the return `reason` is mapped through a
  fixed table and never rendered raw.
- **Personal data.** The LinkedIn archive and preview are personal data: never in browser storage,
  URLs, logs or analytics events; Vercel Analytics custom events carry no content (none are added).
  Errors show codes' messages, never file names from inside the ZIP.
- **Authorization UI is not the guard.** The re-sync card and import buttons are presentation; the
  API answers 404 for another user's project or import.
- **Untrusted README text** is sanitised by the API; the FE renders it through the existing
  DOMPurify path (`ProjectDescription`, server component). No new `dangerouslySetInnerHTML`.
- **Caching.** None of these calls may use `fetch` caching or `unstable_cache`; the repo list,
  status and previews are per user.
- **Rate limits.** Imports are rate-limited tighter by the API. The FE disables controls during a
  call and renders `retryAfter`; it does not auto-retry.

## 10. i18n

Every string exists in `en`, `ru` and `am` in the same commit. New dictionary namespaces:
`integrations.status`, `integrations.github` (connect, disconnect, picker, review, errors),
`integrations.resync`, `integrations.linkedin` (instructions, screenshots' alt text, upload,
preview, done, errors), `integrations.setup` (rewritten for the new steps), `project.sourceGithub`,
and the verified badge's description. Rules:

- No concatenated fragments in English word order, no counted nouns (no plurals): "Selected:
  {count}".
- Placeholders in all three languages (`{count}`, `{login}`, `{minutes}`, `{date}`); `locales.test.ts`
  checks them.
- Error codes map to messages in one table per feature, with a test that **every code in the
  proposed list has a message in all three languages**.
- ru and am are drafted by the agent and listed for native review (OR-T6), as in M3-M6.
- The LinkedIn menu labels are quoted exactly as LinkedIn shows them in that interface language
  (6.1), not translated by us.

## 11. Test plan

### 11.1 Unit and component (Vitest, `npm run verify`, coverage at or above the floor)

- API client functions: success, each error code, `API_UNREACHABLE`, no token -> `UNAUTHENTICATED`.
- Each server action: refuses a missing session, a malformed id, an over-long id list, a bad size;
  returns the code, never the message; asserts no token in the return.
- Integrations page: connected, not connected, needs reconnect, never synced, error panel (and that
  an error is **not** the empty state), the `?github=` hint with and without a matching status.
- Wizards: every state of 4.1 and 6.1 including each failure code; the double-click guard; the
  counter and the cap; duplicates disabled; select-all indeterminate; "nothing new"; leaving warns.
- `putFile` progress with a fake XHR (progress events cannot be asserted through Playwright's
  route-fulfilled request, 11.2).
- Hydration: `dateHydration.test.tsx` gains the integration card's last synced, a repo row's
  pushed-at, the re-sync card, and the LinkedIn preview dates, all in Armenian.
- Route policy test lists `/integrations/github/import` and `/integrations/linkedin/import` as
  protected.
- Dictionary tests as in 10.

**Guards proven by removal** (each must be seen failing, then restored): authorizeUrl host
allow-list; disabled double submit; `?github=connected` shown only when the status agrees; host
check on the signed upload URL (existing, re-proved for the new action); itemIds cap and UUID check;
duplicate rows disabled; `source`-only badge; re-sync button absent for non-owners and for manual
projects; preview not written to storage; every error code has a message.

### 11.2 Playwright (`PLAYWRIGHT_BROWSERS_PATH=/Users/levon/Dev/university/.sandbox/ms-playwright`)

**Runs in CI with synthetic fixtures.**

- The existing API stub (`e2e/fixtures/api-stub.ts`) grows the M7 endpoints, typed with the app's
  own types, with magic values like the discovery stub: a repo named `rate-limited`, `gone`,
  `already-imported`; an export size marker for too-large; a preview with duplicates and problems.
  Synthetic data only; **no real personal data and no real export** is ever committed.
- **Logged-in specs in CI** by minting a session cookie with `generateSessionCookie` from
  `@auth0/nextjs-auth0/testing` (4.30.0, in `package-lock.json`) with the e2e job's throwaway
  `AUTH0_SECRET`, a far-future `tokenSet.expiresAt` and a fake access token the stub accepts. **To be
  run in PR 2 before anything relies on it**; if it fails, the logged-in specs stay behind
  `storageState` like M4-M6 and CI keeps the component tests plus the anonymous redirect checks.
  The minted cookie holds no real credential and never leaves the test.
- The ZIP's `PUT`: the stub returns an `https://storage.googleapis.com/e2e-bucket/...` URL, which
  passes the real host check; Playwright `page.route` fulfils it (200 with CORS headers). No
  test-only bypass exists in shipped code.
- Anonymous visits to each new route redirect to login (proxy, fail closed).

**Matrix, every changed page.** Pages and states: `/integrations` (not connected, connected,
needs reconnect, error); `/integrations/github/import` (pick, importing, review, rate-limited);
`/integrations/linkedin/import` (instructions, upload in progress, preview, done, error);
`/integrations/connections` (each step); a GitHub-sourced project page with the re-sync card and
result dialog; `/projects` with a GitHub badge. Each x **390 and 1440 px** x **light and dark** x
**en, ru, am**. For each view:

- axe: 0 serious or critical (dialogs measured after their fade, via `settled`);
- no console errors or warnings, no hydration warnings, no page errors (`DEV_ONLY` allow-list as in
  the M5/M6 specs);
- cumulative layout shift 0 (images with dimensions, no late-inserted banners);
- no horizontal scroll at 390.

**Keyboard walkthrough, both wizards** (a spec, not a manual look): Tab order matches reading
order; every control reachable and operable with Enter/Space; Escape closes dialogs and focus
returns to the trigger; the file picker opens from the keyboard; checkboxes toggle with Space and
the live counter updates; the sticky bar is reachable; focus lands on the step heading after each
step change; focus is never lost when a state replaces the focused element (importing -> review);
no keyboard trap; visible focus ring in both themes.

### 11.3 Real runs (queue rows, headed login by Levon)

`login.mjs` in the scratchpad opens a headed browser; Levon logs in **by hand**; the agent saves
`storageState` outside the repo and deletes it afterwards. Never a password, token or secret in chat.

| Row   | Run                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------- |
| M7-T6 | Real GitHub: connect, pick two repos, import, edit one and publish, re-sync, disconnect                 |
| M7-T6 | Real LinkedIn: the real export (Levon's own) previews, a subset confirmed, a second upload adds nothing |
| M7-T7 | Levon captures and redacts the instruction screenshots (6.1)                                            |

Local API for the end-to-end runs: the API agent's stack (`MYSQL_HOST_PORT=3315`,
`API_HOST_PORT=3009`, Docker project `gradfolio-m7`, not mine to tear down). Auth0 allows only
`localhost:3000` as a callback locally (M5 note), so the logged-in dev run uses port 3000, not 3013.

### 11.4 Final test (per CLAUDE.md "Before calling it done")

`npm run verify`; `npm run test:coverage`; `npm run build`; the Playwright suite (CI-safe specs
local and in CI); both wizards end to end against the local API; fresh clone for the PRs that touch
pages and the last PR; the deployed site after each merge (anonymous matrix in `docs/fe-m7-
verification.md`, logged-in as far as Levon's run allows); the M7 exit from the tracker checked on
production: GitHub linked, two drafts imported, one edited and published, re-sync keeps the edit,
disconnect removes the connection; a real export previews, only selected items added, no duplicates
on a second import, a malformed ZIP refused with its code.

## 12. Pull requests, order, decisions

| PR  | Content                                                                                                                                              | Needs                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | This plan                                                                                                                                            | -                              |
| 2   | Contract sync; `/integrations` on the API; GitHub connect, return and disconnect; mock and fake connections stepper removed; CI session minting spec | API (a) live                   |
| 3   | GitHub import wizard; re-sync card and dialog; GitHub badge, `ProjectSummary.source`; verified description; onboarding step 1                        | API (b) live                   |
| 4   | LinkedIn wizard (instructions, upload, preview, confirm); onboarding step 2; LinkedIn card action                                                    | API (c) live and 7.6's headers |
| 5   | `docs/fe-m7-verification.md`                                                                                                                         | all of the above merged        |

An FE PR that calls a new endpoint merges only after its API PR has merged and Deploy is green
(`/readyz` 200). Between PR 2 and PR 4 the LinkedIn card shows status only; there is no disabled
"coming soon" button.

Decisions for Levon (defaults chosen if no veto):

- **D1 Onboarding shape.** `/integrations/connections` stays the onboarding page with three
  skippable steps (7). Alternative: delete it and send "Connect accounts" to `/integrations`.
- **D2 GitHub return path.** API-side callback and redirect to `/integrations?github=...` (default),
  or a Next route handler. Follows the API plan's 7.1 choice; FE supports either.
- **D3 Screenshots.** Levon captures them, redacted (M7-T7); the wizard ships without if late.
- **D4 No bulk publish.** Imported drafts are published one at a time from the edit form.
- **D5 No "use GitHub's version".** A kept field stays the user's; there is no per-field overwrite.
- **D6 Badge scope.** GitHub badge on the owner's lists and the project page, not on public
  discovery cards unless the API adds `source` there.

Questions to the API plan (affect the FE): the callback target (D2); whether `GET repos` includes
private repos (7.1) and a `private` chip; the per-call import cap; `ProjectSummary.source`; whether
`kept` carries GitHub's value; the preview TTL; whether disconnect reports a `verified` change; the
LinkedIn ZIP's content type and the bucket CORS for it; the cap in bytes.

## 13. API changes I need (summary for the report)

1. `ProjectSummary.source` (and keep `DiscoveryProject` free of repo data unless asked).
2. The endpoints and error codes of section 2, in `openapi.yaml`, with typed responses.
3. A re-sync response that separates `updated`, `kept` and `unchanged`.
4. A preview that holds items server-side and a confirm that takes ids.
5. CORS on the upload bucket for `application/zip`; the signed ticket's headers listed explicitly.
6. A way to cancel an import (delete the object and the held preview).
7. Optional: `verifiedVia`, and a `verified` flag in the disconnect response.

## 14. Not verified yet, and risks

- The SDK's `generateSessionCookie` working with `next start`, the proxy and `getAccessToken` in
  the e2e job: **run in PR 2**, not assumed (11.2).
- LinkedIn's current menu labels and its Armenian UI availability: M7-T1 and M7-T7.
- Real browser upload of a multi-megabyte ZIP to the bucket with this CORS (the M4 evidence was
  curl and fetch only); previews cannot upload (no CORS wildcard).
- Safari and Firefox file-drop behaviour; screen readers beyond axe and the keyboard spec.
- Native review of ru and am strings (OR-T6).
- Vercel production differs from local: the specs run with `--no-experimental-require-module`
  as the others do; new dependencies are checked against it before use. This plan adds none.
