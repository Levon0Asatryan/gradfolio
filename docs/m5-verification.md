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

| Check                                                                                                 | Result                                                |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Bell matrix, A: en/ru/am x light/dark x 390/1440: screenshots, axe, console                           | pass: 12/12, axe 0 serious or critical, console clean |
| Team matrix, A (project with a team row): same matrix incl. add dialog (both tabs) and remove confirm | pass: 12/12, axe 0 serious or critical, console clean |
| Keyboard only: Tab to bell, open, focus stays inside, Escape returns to the bell                      | pass                                                  |
| Keyboard only: open Add, focus stays inside, Escape returns to the button                             | pass                                                  |
| Non-owner (B) on A's project: no team controls                                                        | pass                                                  |
| Journey: A creates a public project; adds a name with no account (no link, no notification)           | pass                                                  |
| A invites B (search by 3+ letters, pick, send); row shows Pending                                     | pass                                                  |
| A invites B again: real 409 `ALREADY_MEMBER`, shown in the dialog                                     | pass                                                  |
| B: badge rises, bell lists the invite, Accept inline, outcome shown, badge 1 to 0                     | pass                                                  |
| The project is in B's list; A sees B accepted                                                         | pass                                                  |
| B (member) sees Leave and no owner controls; B leaves, toast "You left the project"                   | pass                                                  |
| A receives the `team_left` notification                                                               | pass                                                  |
| A invites B again; B declines; A sees Declined; A invites again; B accepts                            | pass                                                  |
| A removes B behind a confirm naming the person and the project; Cancel has the focus; axe on it       | pass (after the fix in #75, see below)                |
| A removes the no-account name; mark all read: badge 0 for A and B                                     | pass                                                  |
| Test data deleted (projects created for the run)                                                      | done, 0 left                                          |

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
- The local API stack (3007) was not used: the real issuer is needed; the run used the production API.
- The matrix ran on the dev server; the console check ignores Next's dev-only logo LCP hint.
- Pre-existing: `/projects` in Armenian logs a hydration mismatch (project card dates in the browser
  locale vs the server). Not M5; proposed follow-up. `DeleteAccount` and `DeleteProjectDialog` use the
  same `autoFocus` pattern as the bug above and probably share it: proposed follow-up.
- Whether the API marks the invitee's notification read on accept is not in its contract; the FE marks
  it read afterwards (the journey showed the badge going 1 to 0).
- ru and am strings are machine-drafted; native review stays on the tracker follow-up list.
- Review receipts were written by hand (`method: manual`): the `/gradfolio-web-review` skill was not
  invocable from the sub-agent.

## 5. 5.9 Teams page

PENDING: planned after API 5.8 (`GET /v1/me/teams`) is merged and deployed. Section to be filled with the
same matrix (390/1440, light/dark, en/ru/am, keyboard walkthrough, axe, console) and the leave / invite /
cancel journey.

## 6. Proposed tracker changes

- 4.6-4.10 done (merged #61-#64); 5.6 and 5.7 done once #75 merges and the production run is filled in.
- Follow-ups: native ru/am review; `/notifications` full page if Load more proves too small; hydration
  warning on `/projects` (am); the `autoFocus` pattern in `DeleteAccount` and `DeleteProjectDialog`;
  duplicate invite notifications for one project (collapse or hide stale ones).
