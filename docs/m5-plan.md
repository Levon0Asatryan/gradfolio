# M5 frontend plan: teams and notifications

Tracker 5.6 (team management) and 5.7 (notifications UI). Plan only; no code in this PR.
The API half is `gradfolio-api/docs/m5-plan.md` (tasks 5.1-5.5, Q4). This plan builds on M4's
merged project page and on the UI track's edit model; it duplicates neither.

**Status of inputs (2026-10-09).**

- M4 FE is on `main`: project form, edit, delete, attachments, Playwright smoke tests and the
  API-backed project page and list (gradfolio #61-#64). The tracker rows 4.6-4.10 still say
  `todo`; propose `done`.
- M4 API (a), (b), (c) and the verification record are merged (api #46-#49).
- The API M5 plan is not open yet. Every contract detail below marked **[API]** is an ask to
  that plan, not a fact. Nothing here is built until the generated types contain it (Q5).
- The approved prototype (`m3-ui-redesign-plan.md`) has **no** bell and **no** team UI. Layout
  below extends its components (cards, 44px targets, `dialog` modals, bottom toast, empty-state
  prompts, delete confirm naming the entry); it is not a reproduction of a mock.

## 1. Investigation

| Question                        | Finding                                                                                                                                                                                                                                                        | Consequence                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| What exists on the project page | `TeamList` renders `project.team` (accepted members: `id,name,role,avatarUrl,userId`), read-only, hidden when empty. `project.isOwner` already gates `OwnerBar`.                                                                                               | Team section becomes `TeamSection`: `TeamList` for everyone, owner controls only if `isOwner`.   |
| Edit model                      | `DeleteProjectDialog` (MUI Dialog, confirm naming the project, `useTransition`), `FlashToast` (`?flash=` after a redirect), `SectionEditor` (dialog, field errors from API codes, reload server list after success).                                           | Reuse the dialog and error-code pattern. In-page changes use a Snackbar, not `?flash=`.          |
| Navigation                      | `AppNavigation` (full from `lg`, rail below, hidden below `sm`), `PhoneNavigation` (4 primary items + More sheet). Both get `NavUser`; signed-out gets no user.                                                                                                | Bell lives in both; see §5.                                                                      |
| API access                      | `src/lib/api/client.ts` is `server-only`. The browser holds no token (Q11). `/auth/access-token` is off.                                                                                                                                                       | Browser code never calls the API. See §6.                                                        |
| Contract                        | `openapi.yaml` has no team write, user search or notification endpoint. `ProjectTeamMember` has no status.                                                                                                                                                     | Wait for API (a)/(b); sync with `scripts/sync-api-contract.sh <sha>`.                            |
| Playwright                      | M4 added `e2e/smoke.spec.ts`, `playwright.config.ts` (production build, throwaway Auth0 values, no login), `@axe-core/playwright`, a CI job.                                                                                                                   | Extend; do not add a second harness.                                                             |
| Comparable apps                 | GitHub (collaborator invite: search, pending shown to the owner, invitee accepts from a notification or the repo page), Google Docs share (search, role, remove naming the person), LinkedIn (bell: popover with the latest items, "view all", mark-all-read). | Dialog with typeahead; pending/declined visible only to the owner; bell panel with the latest N. |
| Hazards                         | Typeahead is an enumeration surface; notification text can contain another user's name; a notification link is data from the API; popover focus handling is the usual a11y regression.                                                                         | Min 2 chars, debounce, API rate limit [API]; link checked as a same-origin path; focus tests.    |

## 2. Contract needed from the API [API]

FE asks, to be reconciled with the API plan. Anything the API plan decides differently wins;
this section then changes in the first FE implementation PR.

1. **Team read for the owner.** `GET /v1/projects/{id}` (or a sibling) returns members with
   `status: pending | accepted | rejected`, `kind: user | external`, member `id` (the row id
   used by remove). A non-owner sees accepted members only (today's shape). An owner needs to
   tell pending from accepted from declined, so `team[]` for the owner carries `status`.
2. **User search** for the picker: `GET /v1/users/search?q=` returning minimal fields
   (`id, name, headline?, avatarUrl?`), public profiles only, excludes the owner and members
   already on the project (or marks them `alreadyMember`), rate-limited.
3. **Invite** (`userId`, optional `role`), **add external** (`name`, optional `role`),
   **remove member** (row id), **accept** and **reject** (invitee only). Stable error codes
   for: not found / not owner (404), duplicate, self-invite, limit reached, not pending.
4. **Notifications.** `Notification` in `components["schemas"]` with: `id`, a `type`
   discriminant (invite, accepted, rejected at least), `readAt | null`, `createdAt`, the
   params the sentence needs (actor name, project title), and a **link computed by the API
   from real ids** (S12). `list` (newest first, keyset cursor, as `GET /v1/me/projects`),
   `unread-count`, `mark one read`, `mark all read`. For an invite notification, whether it
   is still actionable (`pending`) so the FE can show Accept/Decline or the outcome.
5. **Deleted targets.** A notification whose project or user is gone arrives with a null
   name/title or a flag, never a 500 (tracker follow-up "notifications naming deleted users").
6. **Responding marks the notification read** in the same transaction (preferred; saves a call
   and a stale unread dot). If not, the FE calls mark-read after the response.

**`Notification` type (Q5).** `src/lib/api/types.ts` gains
`export type Notification = components["schemas"]["Notification"]` (plus the list/count
response aliases), exactly as `ProjectTeamMember` is named today. No hand-written copy of the
shape, none in components. `schema.test.ts` already fails on drift. An unknown `type` renders
the generic line ("You have a new notification") and a link, never crashes: the API may add a
type before the FE learns it.

## 3. Delivery method: **awaiting Levon's decision**

The API sub-agent recommends one; this is the FE side of the tradeoff. Q11 shapes all three:
the browser cannot call the API, so each option goes through a same-origin Next route handler
that attaches the token.

| Option                   | How                                                                                                              | Latency of a new invite       | Idle cost                                                                                                                      | FE complexity                                   | Verdict                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------- |
| **A. Refresh on events** | Fetch the count on mount, on route change, on tab focus/visibility, and after the user's own actions.            | Until the next click or focus | Zero while the tab is idle                                                                                                     | Low                                             | **FE preference.**                                                    |
| **B. A + polling**       | A, plus a 60 s interval for the count only while `document.visibilityState === "visible"`; list fetched on open. | Up to 60 s                    | 1 request per open tab per minute (Vercel invocation + Cloud Run call). Tens of users: negligible; keeps the min instance busy | Low-medium (timer cleanup, back-off on error)   | Take it if Levon wants the demo to feel live. One constant to change. |
| **C. SSE**               | Route handler streams from an API stream endpoint.                                                               | Seconds                       | One held connection per tab; Vercel function duration limits and Cloud Run request timeout force reconnect logic               | High (reconnect, auth expiry mid-stream, tests) | Not for v1 scale. Would need an API stream endpoint too.              |

**Preference: A, with B available behind one constant** (`POLL_MS`, 0 = off). Reason: the
only moment a user needs to see an invite quickly is when someone just told them to look, and
they are then clicking around, which A already covers. A never wakes the backend for an idle
tab. B costs one line and a test if the demo needs it. The unread count is a hint, never the
source of truth: the list is fetched fresh each time the panel opens.

Both A and B need the same API surface (count + list), so this decision does not block the
rest of the plan. **Levon decides A or B (or C).**

## 4. Project page: team section (tracker 5.6)

Replaces the `TeamList` panel in the right column of `src/app/projects/[id]/page.tsx`.

**Everyone.** Panel "Team": avatar, name (linked to `/profile/<userId>` only when `userId`
non-null, as today), role. Owner row not repeated (the header already shows the owner).
External members have a name and role, no link, a neutral initial avatar. Hidden when empty
for non-owners, as today.

**Owner only** (`project.isOwner`; the server component passes the flag, the client island
renders controls):

- Panel header action "Add teammate" (44px, primary outlined). Empty team shows the prototype's
  dashed empty-state prompt ("Add the people who built this with you") with the same button.
- **Rows** carry a status chip: _Pending_ (warning chip, "Waiting for {name} to answer"),
  _Declined_ (neutral chip), accepted rows have none. Row actions: _Remove_ (icon button with
  `aria-label` naming the person); declined rows also _Invite again_ (API re-invite by update, D6).
- **Add dialog** (MUI `Dialog`, `fullScreen` below `sm`): two tabs, `role=tablist`.
  1. _Find a user_: `Autocomplete`-style combobox (`role=combobox`, listbox, `aria-activedescendant`;
     arrow keys, Enter, Escape). 2+ characters, 300 ms debounce, stale responses dropped by a
     request counter. Result row: avatar, name, headline. Optional _Role_ field (API limit).
     Submit "Send invitation". Already-a-member results disabled with the reason.
  2. _Add by name_: _Name_ and _Role_, with a hint "They don't have an account, so they won't
     be notified." Submit "Add".
- **Remove confirm** (dialog, destructive button), naming the person and the project:
  accepted "Remove {name} from {project}?"; pending "Cancel the invitation to {name}?";
  external "Remove {name}?". Cancel is the default focus.
- **Toasts** (Snackbar, bottom centre, above the phone bar): "Invitation sent to {name}",
  "{name} added", "{name} removed", "Invitation cancelled".
- **Errors** shown in the dialog, keeping the form (as `SectionEditor`): duplicate, self,
  limit reached, user no longer found, network, "sign in again". Map by `code`, never message.
  Mapping table is untested until each class has come through the real transport (CLAUDE.md),
  so the real run provokes duplicate, 404 and limit once each.
- After any success: `router.refresh()` so the server list is the truth.
- **Non-owner.** No button, no row actions, no dialog code path rendered. The server action
  also re-checks nothing client-side: the API's 404 is the guard, and the Playwright forced-call
  check (§9) proves it.

**Invitee on the project page.** A pending invitee may only see the title (API, Q4), so the
primary place to answer is the bell. If the API lets the invitee open the project, the team
panel shows _Accept / Decline_ on their own pending row too (same action, same component).

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
- **Invite items** show _Accept_ and _Decline_ inline while actionable. During the call both
  disable and show progress. Afterwards the row shows the outcome ("You joined {project}" /
  "You declined") instead of the buttons, goes read, and the badge decrements at once.
  If the API says the invite is gone or already answered (404 / not pending), the row shows
  "This invitation is no longer available" and the list reloads.
- Accept also calls `router.refresh()` so pages already showing "my projects" update.
- **States:** loading (skeleton rows, `aria-busy`); empty ("You're all caught up", no illustration
  needed); list error (inline alert "Couldn't load notifications" + _Try again_; a 401 says
  "Sign in again" with a plain `<a href="/auth/login">`, never `<Link>`); count error (badge
  hidden, no noise); action error (row-level message, buttons re-enabled); "Load more" for the
  keyset cursor (first page 15).
- **Optimistic** mark-read with rollback and a row message if the call fails.
- **Deleted targets** (null title/name): "a project that no longer exists" fallbacks, no link.

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
| Reads from client islands: user search, notification list, count      | Route handlers `GET /api/users/search`, `/api/notifications`, `/api/notifications/unread-count`, calling `src/lib/api/client.ts`. `Cache-Control: no-store`. No session: 401 with the `UNAUTHENTICATED` code, no API call. Server actions are not used for reads: they run one at a time per client and would queue behind each other for a typeahead. |
| Page data: team with status                                           | Server component, `getProject` as today.                                                                                                                                                                                                                                                                                                               |
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
- Search combobox: debounce, 2-char minimum, a late response for an older query is ignored.
- Bell: badge hidden at 0/unknown, `99+` cap, aria-label plural forms in all three languages,
  panel focus trap and return, Escape, route change closes, list/empty/error/loading states,
  inline accept decrements the count, a second click during the call does nothing, answered
  row shows the outcome, unsafe `link` (`//evil`, `javascript:`) is not rendered as a link,
  unknown `type` and null project title render the fallbacks.
- Provider: refresh on focus and route change; with `POLL_MS > 0` the timer runs only while
  visible and is cleared on unmount.
- Route handlers: 401 without session and no API call; `no-store`; code passthrough.
- `locales.test.ts` extended by the new keys; coverage stays at or above the floor.

## 9. Playwright verification plan

Browsers in the sandbox: `export PLAYWRIGHT_BROWSERS_PATH=/Users/levon/Dev/university/.sandbox/ms-playwright`
(`npx playwright install chromium` only if missing). Extend M4's `e2e/smoke.spec.ts` and
`playwright.config.ts`; reuse its `setLanguage`/`watchConsole` helpers.

**In CI (no login, existing job).** Signed-out: no bell in any nav variant; `/api/notifications`,
`/api/notifications/unread-count` and `/api/users/search` answer 401 without redirecting;
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
   the external; B's count and list update; the other party's notifications are unreachable.
5. The same journey **once on production** after merge, with Levon's two accounts.
6. Non-owner sees no team controls; a forced API call still answers 404.
7. Light and dark, en / ru / am, 390 and 1440.
8. Guard proofs: each owner check, the link check, the stale-response guard and the double-click
   guard removed once and the matching test seen failing.

## 12. Not decided here / proposed tracker changes

- **Delivery method A / B / C: Levon.** Q4 (leave, private-project view, account deletion) is
  decided in the API plan and changes §4 only at the margin (invitee view, remove-self).
- A second test account is needed from Levon before any logged-in run.
- Propose: mark 4.6-4.10 done (merged #61-#64); add a follow-up for a `/notifications` full
  page if the panel's "load more" proves too small; add a follow-up for a notification link
  contract check (API `link` is always a relative path); ru/am native review includes the new strings.
- Out of scope: email or push delivery, per-type notification settings, role editing of a member,
  drag-reorder of the team, activities feed (M6, 5.5).
