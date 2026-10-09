# M5 frontend verification (DRAFT)

Teams and notifications, tracker 5.6 and 5.7. Plan: `docs/m5-plan.md`. This is a **draft**: the
sections marked **PENDING** need the logged-in runs in section 3, which only Levon can start
(headed login per account). Nothing marked PENDING is claimed as verified.

## 1. What shipped

| PR  | What                                                                                       | Status                            |
| --- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| #66 | Plan                                                                                       | merged                            |
| #67 | Plan reconciled with API plan #50                                                          | merged                            |
| #69 | Notifications bell in every nav variant, polling, mark read, inline Accept / Decline (5.7) | merged                            |
| #71 | Team section: add, invite again, remove, leave (5.6); `TeamList` removed                   | open, in review (update on merge) |

Contract: gradfolio-api `4fe0930` (M5 a + b, deployed). `Notification` and the team types come
from the generated schema (Q5).

## 2. Evidence so far (no login, no real API)

- `npm run verify` (1027 tests at #71), coverage 89.7% lines / 84.7% branches (floor 48 / 46), knip, build.
- `npm run e2e` in CI with no login: `/api/notifications*` and `/api/users/lookup` answer 401 with a
  code and `no-store` without a session (and 400 for a short lookup), a visitor sees no bell and makes
  no notification request.
- Every guard removed once and a named test seen failing (listed in each PR body).
- Browser (production build, Chromium) on throwaway fixture pages with a patched `fetch`, since deleted:
  bell in sidebar, rail (800 px) and phone More sheet; team section for owner, member and empty team; add
  dialog both tabs; remove and leave confirms. en/ru/am x light/dark x 390/1440, axe 0 serious or
  critical, console clean. Screenshots were kept in the lead's scratchpad, not in the repo.

## 3. PENDING: logged-in verification

Specs exist and skip without a session: `e2e/notifications.spec.ts`, `e2e/team.spec.ts`.

| Check                                                                                                  | Account(s) | Result  |
| ------------------------------------------------------------------------------------------------------ | ---------- | ------- |
| Bell: badge equals the API count; panel opens, focus stays inside, Escape returns to the bell          | A          | PENDING |
| Bell screenshots, axe, console: en/ru/am x light/dark x 390/1440                                       | A          | PENDING |
| Marking one row read lowers the badge by one; mark all read gives 0; reload keeps the server's value   | B          | PENDING |
| Team section as owner: screenshots, axe, console (same matrix); keyboard-only invite flow              | A          | PENDING |
| Journey: A invites B; B sees the badge, opens the bell, accepts; project is on both profiles           | A and B    | PENDING |
| B declines a second invite; A sees Declined and invites again; A removes B; B's list shows "gone"      | A and B    | PENDING |
| A adds a name with no account and removes it; no notification is created                               | A          | PENDING |
| B accepts, then leaves; A gets the `team_left` notification                                            | A and B    | PENDING |
| Invite on a draft project shows the draft message (409 `PROJECT_IS_DRAFT`)                             | A          | PENDING |
| One real example of each error class through the real transport: 404, 409 (`ALREADY_MEMBER`), 429, 401 | A          | PENDING |
| Non-owner (B) sees no team controls on A's project; a forced API write answers 404                     | B          | PENDING |
| The same journey once on production after merge, with Levon's two accounts                             | A and B    | PENDING |

Local run: API stack `gradfolio-m5` on 3007, FE `npm run dev -- -p 3011`. Test accounts only; delete
what the run creates (projects, team rows, notifications) afterwards.

## 4. Not verified, known gaps

- The 404 / 409 / 429 / 401 mappings have unit tests but no real example yet (section 3).
- Whether the API marks the invitee's notification read on accept or reject is not in its contract;
  the FE marks it read afterwards and ignores a failure.
- ru and am strings are machine-drafted; native review is on the tracker follow-up list.
- Review receipts of #69 and #71 were written by hand (`method: manual`): the `/gradfolio-web-review`
  skill was not invocable from the sub-agent.

## 5. Proposed tracker changes

- 4.6-4.10 done (merged #61-#64); 5.6 and 5.7 done once #71 is merged and section 3 is filled.
- Follow-ups: a `/notifications` full page if the panel's Load more proves too small; pagination of
  the team list if a project passes 20 rows; native ru/am review of the new strings.
