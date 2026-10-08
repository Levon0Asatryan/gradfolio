# FE M3 and UI: verification

Final polish pass, 2026-10-08, on `main` at 9ed401b. Written by the polish worker.
Findings that were fixed are in PRs #53, #54, #55.

## What was run

- Gate on every PR: `npm run verify`, `npm run test:coverage` (at or above the floor),
  `npm run knip`, `npm run build`. Each new test was proved by removing its fix and
  watching it fail.
- Real run: `next dev` on port 3000 against the live API, signed in as the test
  account, in a Playwright browser.
- Pre-push review (`gradfolio-web-review`) on each PR; Copilot and Codex requested on
  every push.

## Pages checked

`/` (dashboard), `/profile` (redirect), `/projects`, `/projects/new`, `/search`,
`/integrations`, `/integrations/connections`, `/settings`, `/account`, a 404.

Automated sweep (en, ru, am x 390, 1024, 1440 px, light theme, rail sidebar): horizontal
overflow, elements past the viewport, ellipsis truncation, controls under 32px at 390,
tab title, h1 count, console errors and warnings. Dark theme and the expanded sidebar
were checked by eye on `/projects` (ru, dark, rail) and `/integrations/connections`
(en dark; am and en light, expanded and rail) with screenshots, and by the console sweep on `/`, `/projects`, `/integrations`, `/nope`
in all three languages.

## Findings fixed

| Finding                                                                                                                                                                                      | Severity | PR  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --- |
| 404 page English only, no h1                                                                                                                                                                 | P2       | #53 |
| Dates used the machine locale: hydration error in ru/am on the dashboard                                                                                                                     | P2       | #53 |
| Dashboard tab title was bare "Gradfolio" (now localized)                                                                                                                                     | P2       | #53 |
| DetailDialog close label hardcoded English                                                                                                                                                   | P2       | #53 |
| Setup stepper: step indicators were clickable divs (no keyboard, no name), hardcoded "Complete", blank card on finish, looping typing animation, heavy shadow, motion ignored reduced-motion | P2       | #54 |
| Collapsed rail clipped "Ինտեգրացիաներ" (am)                                                                                                                                                  | P2       | #55 |

No horizontal overflow was found at any width or language in the sweep.

## Deferred (P3)

- 404 tab title stays "Gradfolio" (a client `not-found` cannot set metadata).
- Static tab titles ("Projects", "Settings", ...) are English in ru/am; only the
  dashboard title is localized.
- `/integrations/connections` is still a local mock: nothing is imported or saved
  (the finish screen says so). Step 2 shows required-field errors before the user
  touches the fields.
- The collapsed-rail toggle is 30x30 px (above the WCAG AA 24px minimum, under 44px).
- `src/utils/helpers/formatDate.ts` is now unused apart from its own test.

## Not verified

- Dark theme and the expanded sidebar were not swept programmatically at every
  page, language and width; spot checks only.
- Contrast was judged by eye, not measured, in dark theme.
- Keyboard and focus: only the stepper was exercised (by test and by eye). Tab order,
  focus return on the other dialogs and the onboarding dialog were not walked.
- `/projects/<id>`, `/profile/<id>` as a visitor and the onboarding dialog were not
  visited in this pass; they were covered by their own PRs.
- Empty, loading and error states were not forced (no way to make the live API fail
  on demand).
- Screen reader behaviour: not run.
- Browsers other than Chromium; real devices.
- Review state of the PRs at the time of writing: Copilot hit its quota on #53;
  see each PR for the current state.
