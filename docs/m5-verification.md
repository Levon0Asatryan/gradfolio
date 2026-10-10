# M5 frontend verification

Teams and notifications, tracker 5.6 and 5.7. Plan: `docs/m5-plan.md`. Section 3 is the logged-in
run of 2026-10-10 against the **production API** through a local dev server (`localhost:3000`, Auth0
allows only that port), with two disposable test accounts A and B signed in by the lead (no credential
or token is in any repo file, log or screenshot). The production-site run is still **PENDING**.

## 1. What shipped

| PR  | What                                                                                       | Status                            |
| --- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| #66 | Plan                                                                                       | merged                            |
| #67 | Plan reconciled with API plan #50                                                          | merged                            |
| #69 | Notifications bell in every nav variant, polling, mark read, inline Accept / Decline (5.7) | merged                            |
| #71 | Team section: add, invite again, remove, leave (5.6); `TeamList` removed                   | merged                            |
| #75 | Fix: confirm dialogs did not focus Cancel in a real browser (found by section 3)           | open, in review (update on merge) |

Contract: gradfolio-api `4fe0930` (M5 a + b, deployed). `Notification` and the team types come from
the generated schema (Q5).

## 2. Evidence without a login

- `npm run verify` (1034 tests), coverage 89.8% lines / 84.7% branches (floor 48 / 46), knip, build.
- CI `npm run e2e` with no login: `/api/notifications*` and `/api/users/lookup` answer 401 with a code
  and `no-store` without a session (400 for a short lookup); a visitor sees no bell and makes no
  notification request.
- Every guard removed once and a named test seen failing (each PR body lists them).
- Browser on throwaway fixture pages with a patched `fetch` (since deleted): bell in sidebar, rail and
  phone sheet; team section for owner, member and empty team; add dialog; confirms.

## 3. Logged-in run (accounts A and B, production API, dev server)

Specs: `e2e/notifications.spec.ts`, `e2e/team.spec.ts` (committed). The invite journey was a scratch
script (not committed; it creates and deletes data).

| Check                                                                                                 | Result                                                                 |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Bell matrix, A: en/ru/am x light/dark x 390/1440: screenshots, axe, console                           | pass: 12/12, axe 0 serious or critical, console clean (see note below) |
| Team matrix, A (project with a team row): same matrix incl. add dialog (both tabs) and remove confirm | pass: 12/12, axe 0 serious or critical, console clean (see note below) |
| Keyboard only: Tab to bell, open, focus stays inside, Escape returns to the bell                      | pass                                                                   |
| Keyboard only: open Add, focus stays inside, Escape returns to the button                             | pass                                                                   |
| Non-owner (B) on A's project: no team controls                                                        | pass                                                                   |
| Journey: A creates a public project; adds a name with no account (no link, no notification)           | pass                                                                   |
| A invites B (search by 3+ letters, pick, send); row shows Pending                                     | pass                                                                   |
| A invites B again: real 409 `ALREADY_MEMBER`, shown in the dialog                                     | pass                                                                   |
| B: badge rises, bell lists the invite, Accept inline, outcome shown, badge 1 to 0                     | pass                                                                   |
| The project is in B's list; A sees B accepted                                                         | pass                                                                   |
| B (member) sees Leave and no owner controls; B leaves, toast "You left the project"                   | pass                                                                   |
| A receives the `team_left` notification                                                               | pass                                                                   |
| A invites B again; B declines; A sees Declined; A invites again; B accepts                            | pass                                                                   |
| A removes B behind a confirm naming the person and the project; Cancel has the focus; axe on it       | pass (after the fix in #75, see below)                                 |
| A removes the no-account name; mark all read: badge 0 for A and B                                     | pass                                                                   |
| Test data deleted (projects created for the run)                                                      | done, 0 left                                                           |

**Defect found by this run (fixed in #75).** In a real browser the confirm dialogs did not focus
Cancel: `autoFocus` is refused while MUI fades the dialog in (`visibility: hidden`), so focus fell to
the dialog frame. jsdom has no CSS and every component test passed; the e2e assertion caught it. The
add dialog's search field had the same problem. Fixed by focusing in `onEntered`.

**Observation.** Two invitations of the same project give two notification rows, and both show
Accept / Decline while the membership is `pending` (the API derives the state from the membership
now). Answering one leaves the other stale until the list reloads; a click on the stale one gets 409
`INVITE_NOT_PENDING` and the panel reloads. Acceptable at this scale; noted for the tracker.

## 4. Not verified, known gaps

- **Production site**: the same journey on `gradfolio-navy.vercel.app` after #75 merges. PENDING.
- 429 (`RATE_LIMITED`) and `PROJECT_IS_DRAFT` were not provoked against the real API (a draft cannot
  be created from the UI; 429 needs a burst). Both are unit-tested and mapped; no real example yet.
- `TEAM_FULL` (20 rows) not provoked.
- The plan's local two-account journey (step 4, incl. the draft 409) was NOT run. Recorded deviation (lead's
  decision, also in `docs/m5-plan.md` section 11): the journey ran against the production API with real tokens;
  the draft 409, `TEAM_FULL` and 429 codes are covered by the API's integration tests and its 53/53 real-token
  roundtrip (gradfolio-api #59, #61), not provoked through the FE; the local :3007 FE journey was not run.
- Console check, exact numbers. The first matrices (rows above) ran with the specs filtering the browser's
  `Failed to load resource` line, so "console clean" there was filtered. Re-run on #75's specs with
  that filter removed (it is removed in #75): the 24 matrix cases (12 bell, 12 team) all passed
  with axe 0 serious or critical: 22 on the first run and the other 2 (ru dark team, phone and desktop)
  on a re-run after timeouts under heavy machine load; 34 tests in all, 3 re-run, all passed. Only Next's
  dev-only LCP hint is ignored. One more message was ignored, locally and not committed: Auth0's
  `Failed to persist the updated token set` server log (the saved sessions' access tokens had
  expired; it appears on `/projects` too, so it is not from M5).
- Pre-existing: `/projects` in Armenian logs a hydration mismatch (project card dates in the browser
  locale vs the server). Not M5; proposed follow-up. `DeleteAccount` and `DeleteProjectDialog` use the
  same `autoFocus` pattern as the bug above and probably share it: proposed follow-up.
- Whether the API marks the invitee's notification read on accept is not in its contract; the FE marks
  it read afterwards (the journey showed the badge going 1 to 0).
- ru and am strings are machine-drafted; native review stays on the tracker follow-up list.
- Review receipts were written by hand (`method: manual`): the `/gradfolio-web-review` skill was not
  invocable from the sub-agent.

## 5. 5.9 Teams page (#78)

`/teams`: invites in and out, the team of each owned project (the project page's `TeamSection`, one
implementation), and the projects I joined (leave with a confirm naming the project). Data: `GET /v1/me/teams`,
server side only, contract pinned to gradfolio-api f7003fc. A signed-out request gets a 307 to login that keeps
`returnTo=/teams` (e2e, and 307 on production after the merge).

Run: accounts A and B (disposable), dev server, production API, before the sessions expired.

| Check                                                                                                                                      | Result                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Journey: A invites B; A sees the outgoing invite, the owned team (Pending chip, a no-account name)                                         | pass                                      |
| B sees the incoming invite (title only, no project link), accepts on `/teams`: toast, project under "Projects I'm on" with Owner and Leave | pass                                      |
| B keyboard: Tab reaches Leave, Enter opens the confirm, Cancel is focused, Escape returns focus to Leave                                   | pass (with #75's focus fix applied)       |
| B leaves: stays on `/teams`, "You left the project" toast, project gone from the list                                                      | pass                                      |
| B declines an invite: toast; A cancels a sent invite (confirm names B, Cancel focused); B's incoming list empty                            | pass                                      |
| Matrices (owner/outgoing, incoming, member views): en/ru/am x light/dark x 390/1440 = 12 each, 36 combinations                             | pass: axe 0 serious or critical in all 36 |
| `e2e/teams.spec.ts` matrix (account's own data, empty states included): 12 combinations, console, axe                                      | pass: 12/12                               |
| Nav: labelled Teams item in the sidebar, the rail, and under More on a phone                                                               | pass                                      |
| Test data (projects, invites) deleted afterwards: 0 left                                                                                   | pass                                      |

Found and fixed by this run: the in-text "Open project" link failed axe `link-in-text-block` (serious) with
hover-only underline; it is now underlined.

Review fixes on the head (cb0f3ef), each with a test that fails without it:

- Dates in the invite rows use the app language's locale and UTC, so server and browser print the same text
  (`formatDate` takes optional `locale` and `timeZone`; other callers unchanged).
- A next-page link carries only the cursor of the list being advanced, and the page keeps one cursor from a
  hand-edited URL, as the `MyTeams` contract says; the other lists restart from page one.
- The tab title is generated from the request language (Teams, Команды, Թիմեր; checked in a browser).

Hydration: `/teams` showed 0 hydration errors in en/ru/am; `/projects` in Armenian still does (pre-existing,
section 4).

Not verified here:

- The matrices ran before the review fixes (dates, cursor, title); only the title and hydration were re-checked
  in a browser after them. A logged-in re-run on the merged build is pending the sessions' refresh.
- The local-API two-account journey was not run (recorded deviation, section 4); production API only.
- A project with more than 10 team rows or a list past its first page (cursor links) was covered by unit tests,
  not by a real two-page list.
- The Auth0 refresh-token log (section 4 and the proposed tracker rows) shows on `/teams` as on every page.
- ru and am strings are machine-drafted.

## 6. Proposed tracker changes

- 4.6-4.10 done (merged #61-#64); 5.6 and 5.7 verified against the production API (through a local dev server; the deployed site run in section 4 is still pending), with the recorded deviation that the local-stack journey was not run (plan section 11, record section 4); 5.9 verified as in section 5.
- Follow-ups: native ru/am review; `/notifications` full page if Load more proves too small; hydration
  warning on `/projects` (am); the `autoFocus` pattern in `DeleteAccount` and `DeleteProjectDialog`;
  duplicate invite notifications for one project (collapse or hide stale ones).
