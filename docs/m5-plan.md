# M5 frontend plan: teams and notifications

Tracker 5.6 (team management) and 5.7 (notifications UI). Plan only; no code in this PR.
The API half is `gradfolio-api/docs/m5-plan.md` (tasks 5.1-5.5, Q4). This plan builds on M4's
merged project page and on the UI track's edit model; it duplicates neither.

**Status of inputs (2026-10-09).**

- M4 FE is on `main`: project form, edit, delete, attachments, Playwright smoke tests and the
  API-backed project page and list (gradfolio #61-#64). The tracker rows 4.6-4.10 still say
  `todo`; propose `done`.
- M4 API (a), (b), (c) and the verification record are merged (api #46-#49).
- The API M5 plan is open (gradfolio-api PR #50, `docs/m5-plan.md`). §2 and §3 are reconciled
  with it; it wins on any disagreement. Levon delegated Q4 and the delivery method to its
  recommendations. Nothing here is built until the generated types contain the contract (Q5).
- The approved prototype (`m3-ui-redesign-plan.md`) has **no** bell and **no** team UI. Layout
  below extends its components (cards, 44px targets, `dialog` modals, bottom toast, empty-state
  prompts, delete confirm naming the entry); it is not a reproduction of a mock.

## 1. Investigation

| Question                        | Finding                                                                                                                                                                                                                                                        | Consequence                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| What exists on the project page | `TeamList` renders `project.team` (accepted members: `id,name,role,avatarUrl,userId`), read-only, hidden when empty. `project.isOwner` already gates `OwnerBar`.                                                                                               | Team section becomes `TeamSection`: `TeamList` for everyone, owner controls only if `isOwner`.                            |
| Edit model                      | `DeleteProjectDialog` (MUI Dialog, confirm naming the project, `useTransition`), `FlashToast` (`?flash=` after a redirect), `SectionEditor` (dialog, field errors from API codes, reload server list after success).                                           | Reuse the dialog and error-code pattern. In-page changes use a Snackbar, not `?flash=`.                                   |
| Navigation                      | `AppNavigation` (full from `lg`, rail below, hidden below `sm`), `PhoneNavigation` (4 primary items + More sheet). Both get `NavUser`; signed-out gets no user.                                                                                                | Bell lives in both; see §5.                                                                                               |
| API access                      | `src/lib/api/client.ts` is `server-only`. The browser holds no token (Q11). `/auth/access-token` is off.                                                                                                                                                       | Browser code never calls the API. See §6.                                                                                 |
| Contract                        | `openapi.yaml` has no team write, user search or notification endpoint. `ProjectTeamMember` has no status.                                                                                                                                                     | Wait for API (a)/(b); sync with `scripts/sync-api-contract.sh <sha>`.                                                     |
| Playwright                      | M4 added `e2e/smoke.spec.ts`, `playwright.config.ts` (production build, throwaway Auth0 values, no login), `@axe-core/playwright`, a CI job.                                                                                                                   | Extend; do not add a second harness.                                                                                      |
| Comparable apps                 | GitHub (collaborator invite: search, pending shown to the owner, invitee accepts from a notification or the repo page), Google Docs share (search, role, remove naming the person), LinkedIn (bell: popover with the latest items, "view all", mark-all-read). | Dialog with typeahead; pending/declined visible only to the owner; bell panel with the latest N.                          |
| Hazards                         | Typeahead is an enumeration surface; notification text can contain another user's name; a notification link is data from the API; popover focus handling is the usual a11y regression.                                                                         | 3 chars minimum, debounce, the API's own lookup budget and 429 handling; link checked as a same-origin path; focus tests. |

## 2. Contract from the API plan (gradfolio-api PR #50, `docs/m5-plan.md`)

Reconciled with that plan; where this plan and the API plan disagree, the API plan wins and
the FE changes. Nothing is built before the generated types contain it (Q5).

| Need                    | API contract (PR #50)                                                                                                                                                                                                                                                                                                                                                                                                                     | FE use                                                                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Team read (owner)       | `GET /v1/projects/{id}/team`: all rows, every status, `{id,name,role,status,userId,avatarUrl,createdAt}`. Non-owner, a teammate included: 404. Public `team[]` on the project stays accepted-only.                                                                                                                                                                                                                                        | `TeamSection` fetches it server-side for the owner only. A teammate sees the public `team[]`, no controls.                                                                                                    |
| User lookup             | `GET /v1/users/lookup?q=`: prefix match, `q` 3-50 chars after trim, at most 8 `{id,name,headline,avatarUrl}`, public profiles only, own `lookup` rate budget (30 per window, separate from M6 search).                                                                                                                                                                                                                                    | Combobox needs 3 characters, 300 ms debounce, 429 handled (see §4).                                                                                                                                           |
| Invite / external       | `POST /v1/projects/{id}/team` `{userId, role?}` (201, pending, notifies). `POST .../team/external` `{name, role?}`: **201 accepted row with `userId` null**, no notification.                                                                                                                                                                                                                                                             | An external row is just an accepted row with no link; there is no "external" kind and no status for it.                                                                                                       |
| Remove                  | `DELETE .../team/{memberId}` (owner, any status, 204).                                                                                                                                                                                                                                                                                                                                                                                    | Remove / cancel invitation.                                                                                                                                                                                   |
| Invitee                 | `POST .../team/me/accept`, `POST .../team/me/reject` (200 member), addressed by project id; caller implied.                                                                                                                                                                                                                                                                                                                               | Bell buttons use `params.projectId`.                                                                                                                                                                          |
| Leave                   | `DELETE /v1/projects/{id}/team/me` (accepted teammate, 204), notifies the owner with type `team_left`.                                                                                                                                                                                                                                                                                                                                    | "Leave project" on the teammate's own row (§4).                                                                                                                                                               |
| Conflicts (409)         | `ALREADY_MEMBER`, `INVITE_NOT_PENDING`, `TEAM_FULL` (20 rows, any status), `PROJECT_IS_DRAFT`. Self-invite or inviting the owner: 400 `VALIDATION_FAILED`. Unknown or non-public `userId`: 404. Also 429 and 503.                                                                                                                                                                                                                         | One message per code, in en/ru/am. Draft: "Publish the project before inviting people."                                                                                                                       |
| Notifications           | `Notification = {id, type, title, params, read, createdAt, link, invite}`. `type`: `team_invite \| team_accepted \| team_rejected \| team_left` (others arrive as `general`). `params`: `{actorId?, actorName, projectId, projectTitle, role?}` snapshots. `title` is an English fallback only. `link`: relative path or `null`, computed at read time. `invite` (invite type only): `{status: pending \| accepted \| rejected \| gone}`. | **The FE renders the sentence from `type` + `params` in the user's language**; `title` is used only for an unknown type. Buttons only when `invite.status === "pending"`; `gone` shows "no longer available". |
| Endpoints               | `GET /v1/me/notifications?limit&cursor` (`{items,nextCursor}`, newest first), `GET .../unread-count` (`{count}`), `POST .../{id}/read` (204; other user's id 404), `POST .../read-all` (`{updated}`).                                                                                                                                                                                                                                     | List on bell open, count poll, mark one / all.                                                                                                                                                                |
| Deleted project or user | The row survives; `link` and `invite` degrade (`null`, `gone`); `params` keep the snapshot names.                                                                                                                                                                                                                                                                                                                                         | Sentence from the snapshot; no link; no buttons.                                                                                                                                                              |

Not in the contract, so the FE does not rely on it: whether accept/reject marks the
notification read (the FE calls mark-read after a response unless the generated types or API
docs say it is done in the transaction, and ignores a failure of that call). Read state is
`read: boolean` there, not `readAt`.

**`Notification` type (Q5).** `src/lib/api/types.ts` gains
`export type Notification = components["schemas"]["Notification"]` (plus the list/count
response aliases), exactly as `ProjectTeamMember` is named today. No hand-written copy of the
shape, none in components. `schema.test.ts` already fails on drift. An unknown `type` renders
the generic line using `title` and a link, never crashes: the API may add a type before the FE
learns it.

## 3. Delivery method: decided (API plan §6)

Levon delegated this decision to the API plan's recommendation, which this plan adopts:

- the unread **count** is polled every **60 s only while `document.visibilityState === "visible"`**;
- the count is also refreshed on **route change** and on **tab focus/visibility**, and after the
  user's own accept, reject or mark-read;
- the **list** loads when the bell opens (fresh each time), and "Load more" follows the cursor;
- **no SSE, no websockets** in v1.

Q11 shapes it: the browser cannot call the API, so the poll goes to a same-origin Next route
handler that attaches the token. Cost: one tiny indexed `COUNT(*)` per open visible tab per
minute, tens of users, well inside the API's default 120/min budget (one tab uses the poll plus
its navigations). The poll interval is one constant (`POLL_MS = 60_000`). On a failed poll the
badge keeps its last value, the next tick retries, and after three consecutive failures the
interval doubles up to 5 min (reset on success or focus). The timer is cleared on unmount and
on `visibilitychange` to hidden.

## 4. Project page: team section (tracker 5.6)

Replaces the `TeamList` panel in the right column of `src/app/projects/[id]/page.tsx`.

**Everyone.** Panel "Team": avatar, name (linked to `/profile/<userId>` only when `userId`
non-null, as today), role. Owner row not repeated (the header already shows the owner).
External members are accepted rows with `userId` null: name and role, no link, a neutral initial avatar. Hidden when empty
for non-owners, as today.

**Owner only** (`project.isOwner`; the server component passes the flag, the client island
renders controls):

- Panel header action "Add teammate" (44px, primary outlined). Empty team shows the prototype's
  dashed empty-state prompt ("Add the people who built this with you") with the same button.
- **Rows** carry a status chip: _Pending_ (warning chip, "Waiting for {name} to answer"),
  _Declined_ (neutral chip, the API's `rejected`), accepted rows have none. Row actions:
  _Remove_ (icon button with `aria-label` naming the person); declined rows also _Invite
  again_ (the same invite call; the API turns the row back to pending, D6).
- **Add dialog** (MUI `Dialog`, `fullScreen` below `sm`): two tabs, `role=tablist`.
  1. _Find a user_: `Autocomplete`-style combobox (`role=combobox`, listbox, `aria-activedescendant`;
     arrow keys, Enter, Escape). 3+ characters (API minimum), 300 ms debounce, stale responses dropped by a
     request counter. Result row: avatar, name, headline. Optional _Role_ field (API limit).
     Submit "Send invitation". The lookup does not mark existing members, so a duplicate
     comes back as 409 `ALREADY_MEMBER` and is shown in the dialog.
  2. _Add by name_: _Name_ and _Role_, with a hint "They don't have an account, so they won't
     be notified." Submit "Add".
- **Remove confirm** (dialog, destructive button), naming the person and the project:
  accepted "Remove {name} from {project}?"; pending "Cancel the invitation to {name}?";
  external "Remove {name}?". Cancel is the default focus.
- **Toasts** (Snackbar, bottom centre, above the phone bar): "Invitation sent to {name}",
  "{name} added", "{name} removed", "Invitation cancelled".
- **Errors** shown in the dialog, keeping the form (as `SectionEditor`): duplicate, self,
  `TEAM_FULL` (20 rows), `PROJECT_IS_DRAFT` ("Publish the project before inviting people":
  the Add button is also disabled with that hint when `project.isDraft`), `INVITE_NOT_PENDING`,
  user no longer found (404), 429 ("Too many searches, wait a moment"), network, "sign in
  again". Map by `code`, never message.
  Mapping table is untested until each class has come through the real transport (CLAUDE.md),
  so the real run provokes duplicate, 404, draft and (on local) limit once each.
- **Leave (teammate).** An accepted teammate sees _Leave project_ on their own row (the server
  component compares the member's `userId` with `getMe().id`; no other row gets it). A
  confirm "Leave {project}? {owner} will be told." calls `DELETE /projects/{id}/team/me`; on
  success redirect to `/projects?flash=left` with the generic message "You left the project" (the redirect carries only the fixed key, so no project name; the confirm dialog before it names the project), because a non-draft private
  project may no longer be readable.
- After any success: `router.refresh()` so the server list is the truth.
- **Non-owner.** No button, no row actions, no dialog code path rendered. The server action
  also re-checks nothing client-side: the API's 404 is the guard, and the Playwright forced-call
  check (§9) proves it.

**Invitee on the project page.** A pending invitee sees the title and owner name only inside
their notification, and the notification has no link while pending (API §5.1). The bell is
the only place to answer; the project page shows no invitee controls.

## 5. Notifications bell (tracker 5.7)

**What it shows.**

- Button with `NotificationsOutlined`; unread badge (number, `99+` cap), hidden at 0 and while
  unknown. `aria-label` = "Notifications, {n} unread" (translated, plural-safe in ru), so the
  count is not colour or visual-only. The badge is absolutely positioned: appearing causes no
  layout shift.
- Panel header: "Notifications", _Mark all as read_ (disabled at 0 unread).
- Item: unread dot (plus visually-hidden "Unread"), sentence from the dictionary by `type`
  with params, relative time (`formatDate` rules apply), actor/project name as plain text.
  Click or Enter on the item marks it read and follows `link` (checked: starts with `/`, not
  `//`, no scheme; otherwise the item is not a link). A separate _Mark as read_ icon button per
  unread item gives keyboard and screen-reader users the action without navigating.
- **Invite items** (`type: team_invite`) show _Accept_ and _Decline_ inline while
  `invite.status === "pending"` (calls `POST /projects/{params.projectId}/team/me/accept|reject`). During the call both
  disable and show progress. Afterwards the row shows the outcome ("You joined {project}" /
  "You declined") instead of the buttons, goes read, and the badge decrements at once.
  `invite.status` `accepted`/`rejected` shows the outcome; `gone`, a 404, or 409
  `INVITE_NOT_PENDING` on click shows
  "This invitation is no longer available" and the list reloads.
- Accept also calls `router.refresh()` so pages already showing "my projects" update.
- **States:** loading (skeleton rows, `aria-busy`); empty ("You're all caught up", no illustration
  needed); list error (inline alert "Couldn't load notifications" + _Try again_; a 401 says
  "Sign in again" with a plain `<a href="/auth/login">`, never `<Link>`); count error (badge
  hidden, no noise); action error (row-level message, buttons re-enabled); "Load more" for the
  keyset cursor (first page 15).
- **Optimistic** mark-read with rollback and a row message if the call fails.
- **Sentences** come from `type` + `params` in the user's language (the API sends no message):
  `team_invite` "{actorName} invited you to {projectTitle}" (+ role), `team_accepted`
  "{actorName} joined {projectTitle}", `team_rejected` "{actorName} declined to join
  {projectTitle}", `team_left` "{actorName} left {projectTitle}". `params` are snapshots, so a
  deleted project or user still reads correctly; `link: null` means no link, no buttons.

**Placement, every variant** (signed-in only; nothing for visitors):

| Variant                      | Control                                                                                        | Panel                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Full sidebar (`lg`+ / full)  | A nav-style row "Notifications" with icon, label and a count chip, above the user card         | `Popover` anchored to the row, opening to the right, 380 px, max-height 70 vh, scrolls inside |
| Rail (`sm`-`lg` / rail mode) | Same row as an icon-over-label item with a corner badge (same pattern as the other rail items) | Same `Popover`                                                                                |
| Phone bar (< `sm`)           | First row of the **More** sheet, plus a dot badge on the More tab when unread > 0              | Bottom `Drawer` (the sheet swaps content; Back returns to More). Full width, max-height 80 vh |

Why not a phone top bar: it adds permanent chrome and shifts the page padding, for one icon.
The bar has five slots and four are primary places; a bell there would displace one. The
badge on More keeps the unread signal visible without that.

**Focus and keyboard.** Trigger is a button with `aria-haspopup="dialog"`, `aria-expanded`.
The panel is a labelled dialog (MUI `Popover`/`Drawer` give the focus trap and Escape);
focus goes to the panel heading, Tab cycles inside, Escape closes and returns focus to the
trigger. Route change closes it. Targets are 44px. Reduced motion is respected.

**State ownership.** One `NotificationsProvider` (client) mounted beside `AppNavigation` and
`PhoneNavigation`, so the two nav variants share one count (both are in the DOM; one is
`display: none`). It owns count, list, fetch, mark-read and respond, and the refresh triggers
from §3. The initial count is fetched on the client after mount, not in the layout: a slow or
failing API must not slow or break every page, and the layout then stays cacheable-neutral.

## 6. Data flow (Q11)

Nothing in the browser calls gradfolio-api.

| Need                                                                  | Mechanism                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Writes: invite, external, remove, accept, reject, mark read, mark all | Server actions in `src/lib/team/actions.ts` and `src/lib/notifications/actions.ts`. They take **no user id**; the session token tells the API who writes. Inputs validated before forwarding (id is a UUID, name/role trimmed and length-checked against `limits.ts`).                                                                                 |
| Reads from client islands: user lookup, notification list, count      | Route handlers `GET /api/users/lookup`, `/api/notifications`, `/api/notifications/unread-count`, calling `src/lib/api/client.ts`. `Cache-Control: no-store`. No session: 401 with the `UNAUTHENTICATED` code, no API call. Server actions are not used for reads: they run one at a time per client and would queue behind each other for a typeahead. |
| Page data: project; owner's team with status                          | Server component: `getProject` as today; **for the owner only** (`isOwner`) also `GET /v1/projects/{id}/team` (a second call; the public `team[]` is accepted-only). A failed team fetch shows an inline error with retry in the panel, never an empty team.                                                                                           |
| Errors                                                                | `ApiError.code` passes through as `{ ok: false, code }`; messages are the FE's own, from the dictionary.                                                                                                                                                                                                                                               |

Route handlers are same-origin and carry the session cookie; they add no CORS and no token
exposure. They are exempt from the page route policy only in the sense that they answer 401
themselves; `routePolicy.ts` must treat `/api/*` as non-redirecting (a redirect to the login
page is the wrong answer for a `fetch`). Checked and tested in the notifications PR.

## 7. Strings (en / ru / am)

New `team` and `notifications` groups in `Dictionary` (`src/data/locales/types.ts`); all three
languages in the same commit as the component; `locales.test.ts` covers placeholders and empty
strings. Needed: section title, add button, both tab labels, field labels and hints, status
chips, the three confirm texts, five toasts, every error code, panel title, mark-all, mark-one,
Accept/Decline, outcome lines, empty, error, retry, load more, relative-time-free fallbacks,
one sentence per notification type plus the unknown-type line, aria-labels (including the
bell with count). **Plurals:** the unread label uses a function of `n` (ru has three forms:
1 / 2-4 / 5+; am and en two), as the prototype's `yrs` does. Armenian and Russian are machine-
drafted; native review stays on the tracker's follow-up list.

## 8. Tests (unit and component)

Vitest + Testing Library, beside the code. Each guard is proved by removing it.

- Team actions: owner-only is the API's job, so assert that no user id is sent, that bad
  ids/over-long names are refused before any request, and that each error code maps.
- `TeamSection`: owner sees controls; `isOwner=false` renders none (guard: remove the check,
  test fails); pending/declined chips; remove confirm names the person; Cancel is the default
  focus; failed invite keeps the form.
- Search combobox: debounce, 3-char minimum (no request at 1-2 characters), a late response for an older query is ignored.
- Bell: badge hidden at 0/unknown, `99+` cap, aria-label plural forms in all three languages,
  panel focus trap and return, Escape, route change closes, list/empty/error/loading states,
  inline accept decrements the count, a second click during the call does nothing, answered
  row shows the outcome, unsafe `link` (`//evil`, `javascript:`) is not rendered as a link,
  unknown `type` and null project title render the fallbacks.
- Provider: refresh on focus and route change; with `POLL_MS > 0` the timer runs only while
  visible and is cleared on unmount.
- Route handlers: 401 without session and no API call; `no-store`; code passthrough.
- Leave: only the viewer's own accepted row shows it; the flash key `left` is added to
  `FlashToast` (a fixed word, never user text) and to all three languages.
- Poll: 60 s tick only while visible, paused on hidden, back-off after three failures, and
  the badge keeps its last value on a failed tick.
- Draft project: Add is disabled with the hint; a forced 409 `PROJECT_IS_DRAFT` shows its message.
- `locales.test.ts` extended by the new keys; coverage stays at or above the floor.

## 9. Playwright verification plan

Browsers in the sandbox: `export PLAYWRIGHT_BROWSERS_PATH=/Users/levon/Dev/university/.sandbox/ms-playwright`
(`npx playwright install chromium` only if missing). Extend M4's `e2e/smoke.spec.ts` and
`playwright.config.ts`; reuse its `setLanguage`/`watchConsole` helpers.

**In CI (no login, existing job).** Signed-out: no bell in any nav variant; `/api/notifications`,
`/api/notifications/unread-count` and `/api/users/lookup` answer 401 without redirecting;
a public project page shows no team controls; axe and console checks on those pages.

**Local and preview, logged in (not in CI).**

- _Login:_ never scripted. Levon logs in once per account in a headed browser; the
  `storageState` files for account A (owner) and B (invitee) live in the session scratchpad,
  outside the repo, and are deleted at the end. Specs read the paths from
  `E2E_STORAGE_STATE_A` / `_B` and skip when unset, so CI stays green.
- _Matrix:_ each changed view at **390 and 1440**, **light and dark**, **en / ru / am**
  (12 shots per view). Views: project page as owner (empty team; mixed accepted / pending /
  declined / external), add dialog (results, no results, error, external tab), remove
  confirm, bell closed with badge, bell open (list, empty, error, loading, many items),
  phone More sheet with dot, project page as a non-owner. Attached to the PR.
- _Keyboard-only walkthrough, recorded in the PR:_ Tab to Add, open, type a name, arrow to a
  result, Enter, Tab to Send, Enter, toast; Tab to a row's Remove, Enter, Escape (focus
  returns); Tab to the bell, Enter, focus in the panel, Tab cycles, Accept via Enter, Escape,
  focus back on the bell. Visible focus ring on every stop.
- _Axe:_ `@axe-core/playwright` on each state above, **0 serious or critical**.
- _Console / layout:_ no console error, warning or hydration warning; no layout shift when the
  badge appears (CLS measured via `PerformanceObserver` on the project page and the nav).
- _Unread count:_ with B signed in, count = N; accept one → N-1 without reload; decline one →
  N-2; mark all → 0; reload keeps the server's value.
- _Non-owner:_ B opens A's project: no team controls in the DOM; a forced call of the invite
  action from the page context gets the API's 404.
- Extra: widths 768 and 1024 for the nav rail/full switch with the bell row; Armenian label
  wrapping in the rail (the existing rule: labels wrap, never truncate).

## 10. Order, gates, PRs

| PR  | Content                                                                                                                   | Starts when                                                                                  | Merges when                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | This plan                                                                                                                 | now                                                                                          | one review round, then Levon                                                                                                                                                                                        |
| 2   | **Step 2, notifications (5.7):** types, provider, bell in all three nav variants, route handlers, actions, strings, tests | API (a) (contract + reads: list, count) **merged and deployed** (`/readyz` 200)              | API PR it calls merged **and** Deploy on `main` green. Accept/decline buttons need API (b); until it is live they are hidden behind the type having an actionable state, or the PR is split (read-only bell first). |
| 3   | **Step 3, team management (5.6):** `TeamSection`, dialogs, actions, strings, tests                                        | API (b) (invite, accept, reject, remove) merged **and** M4 FE 4.10 merged (**already true**) | API (b) merged and Deploy on `main` green                                                                                                                                                                           |
| 4   | FE M5 verification record                                                                                                 | PRs 2-3 merged and run on production                                                         | review round                                                                                                                                                                                                        |

Rules from CLAUDE.md apply to each: four phases, rebase on `main` before every push, both
reviewers on every push (`sh scripts/request-review.sh <pr>`), two rounds then fix-now only
plus one confirmation round, a PR that calls a new endpoint never merges before its API PR is
live. Vercel previews hit the production API and database: test accounts only, delete what is
created. Migrations are not mine; the contract sync (`sh scripts/sync-api-contract.sh <sha>`)
is the first commit of PRs 2 and 3.

## 11. Final test list

1. `npm run verify`, `npm run test:coverage` (at or above the floor), `npm run build`, `npm run knip`.
2. Fresh clone: `git clone` the checkout, install, verify, coverage, build, real run.
3. Playwright (§9) on every changed page.
4. **Two-account journey on the local API** (the `gradfolio-m5` stack, API on 3007; FE dev
   server on 3011): A invites B; B sees the badge, opens the bell, accepts; the project shows on
   both profiles; A invites B again after a decline; A adds an external name; A removes B and
   the external; B accepts a third invite and leaves (A gets the `team_left` notification);
   an invite on a draft project shows the 409 message; B's count and list update; the other party's notifications are unreachable.
   **Recorded deviation (decided by the lead, 2026-10-10):** this journey ran against the
   **production API** with real tokens (Playwright specs and the invite journey: 32 of 33 tests
   passed and every journey step passed), not on the local stack with the FE on :3011. The draft
   409, `TEAM_FULL` and 429 codes were not provoked through the FE; they are covered by the API's
   integration tests and the 53/53 real-token roundtrip (gradfolio-api #59, #61), and by the FE's
   unit tests of the error mapping. The local :3007 FE journey was not run.
5. The same journey **once on production** after merge, with Levon's two accounts.
6. Non-owner sees no team controls; a forced API call still answers 404.
7. Light and dark, en / ru / am, 390 and 1440.
8. Guard proofs: each owner check, the link check, the stale-response guard and the double-click
   guard removed once and the matching test seen failing.

## 12. Not decided here / proposed tracker changes

- Q4 and the delivery method are decided by the API plan (PR #50), adopted in §2-§3. If that
  plan changes in review, this one follows.
- A second test account is needed from Levon before any logged-in run.
- Propose: mark 4.6-4.10 done (merged #61-#64); add a follow-up for a `/notifications` full
  page if the panel's "load more" proves too small; add a follow-up for a notification link
  contract check (API `link` is always a relative path); ru/am native review includes the new strings.
- Out of scope: email or push delivery, per-type notification settings, role editing of a member,
  drag-reorder of the team, activities feed (M6, 5.5).
