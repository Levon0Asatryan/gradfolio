# FE M4: verification

Projects and media, frontend. Run 2026-10-09 on `main` at 42ba98c (after #58 to #66). #65 (be9df17) merged after the gate in section 1 and changes only `e2e/` and `playwright.config.ts` plus one test's timing.
Written by the FE sub-agent. The API's own record is in `gradfolio-api`.

PRs in this milestone: #59 plan, #60 list and detail, #61 form, edit and delete,
#62 attachments and uploads, #63 Playwright groundwork, #64 production fix.

## 1. Gate on current main

A fresh clone of `main` (not the working tree), `npm ci`, then:

| Step                    | Result                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`        | pass (format, lint, types, tests)                                                                                   |
| `npm run test:coverage` | 82 files, 878 tests pass. Statements 87.21, branches 83.68, functions 81.12, lines 88.45. Floors: 48 / 46 / 38 / 48 |
| `npm run knip`          | pass                                                                                                                |
| `npm run build`         | pass; `/projects`, `/projects/[id]`, `/projects/[id]/edit`, `/projects/new` are dynamic                             |
| `npm run e2e`           | 14 passed (2.8 s), at 42ba98c; 15 on main now                                                                       |

The smoke specs (`e2e/smoke.spec.ts`, no login, production build, fake Auth0 tenant): 14 ran at the gate; #65 added a 15th, listed last.

- the 404 page: one h1, translated, `<html lang>`, axe clean, console clean (en, ru, am);
- `/settings` and `/search`: render, axe clean, console clean (en, ru, am);
- `/settings` in the dark theme: axe clean;
- a protected page (`/projects`, `/projects/new`, `/account`, `/`) without a session answers a
  307 to `/auth/login?returnTo=<path>` as an HTTP response (not followed);
- `/projects/<id>/edit` is protected too and keeps its return path;
- a public page needs no login;
- choosing a language changes `<html lang>` and the text, and survives a reload;
- (#65, not in the 14) a project page loads its server code (sanitizer, jsdom) and shows the
  API error screen, not a 500, with the server run without `require(esm)` like Vercel.

## 2. Plan walk (docs/m4-plan.md, "must" and "is excluded" sentences)

| Requirement                                                                                                   | Where it is implemented, and how it was checked                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor is Tiptap, loaded on the form routes only, H2 to H4, http(s) links, no autolink                        | `RichTextEditor.tsx`, `RichTextEditorLazy.tsx` (`next/dynamic`, `ssr: false`); unit tests; XSS paste: PENDING, section 4                                          |
| The editor emits only tags the allow-list keeps                                                               | paste of script, iframe, img onerror, `javascript:` link: nothing survives in the editor (PENDING, section 4; the sanitizer corpus covers render)                 |
| One form for create and edit; errors under the field; summary takes focus; toast                              | `ProjectForm.tsx`; `ProjectForm.test.tsx` (28 tests)                                                                                                              |
| Fields the API owns are never sent (ids, `thumbnailUrl`, `aiSummary`, `source`, `repo*`)                      | `src/lib/projects/form.ts`; `form.test.ts`                                                                                                                        |
| Create: project first, then each attachment; a failed attachment goes to the edit page with its values        | `actions.ts`, `ProjectForm.tsx` (`failedKey`); `actions.test.ts`, `ProjectForm.test.tsx`                                                                          |
| `useUnsavedGuard` while dirty                                                                                 | `ProjectForm.tsx`; test "warns before the tab closes"; guard proved (section 3)                                                                                   |
| Edit page: 404 or `isOwner === false` gives `notFound()`; the UI is not the guard                             | `edit/page.tsx`; `page.test.tsx`; actions send only the path id and body, the API answers 404 (action tests)                                                      |
| Edit link on the detail page only when `isOwner`                                                              | `app/projects/[id]/page.tsx`, `OwnerBar.tsx`; `page.test.tsx`; production check PENDING, section 4                                                                |
| A private project is 404 to everyone but the owner                                                            | API owns it; page shows not-found; production check PENDING, section 4 (anonymous, no second account)                                                             |
| Delete: dialog names the project, Cancel has the focus, failure keeps the dialog open                         | `DeleteProjectDialog.tsx`; tests; keyboard check PENDING, section 5                                                                                               |
| Description is sanitized on the server at render, fails closed without a DOM                                  | `src/lib/sanitize.ts`; `sanitize.test.ts`, `sanitize.load.test.ts`                                                                                                |
| User URLs reach `href` and `src` as https only (http(s) for demo, repo, description links)                    | `safeHttpUrl.ts`; tests with `javascript:`, `data:`, `//host`                                                                                                     |
| Uploads: the token stays on the server; the browser PUTs to the signed URL; only a GCS https host is accepted | `uploads/actions.ts`; `actions.test.ts`; production PUT statuses PENDING, section 4                                                                               |
| `STORAGE_UNAVAILABLE` shows "uploads not available, paste a link"                                             | `UploadControl`; unit test. Bucket is configured in production, so not seen live                                                                                  |
| Every string in en, ru, am                                                                                    | `Dictionary` type, `locales.test.ts`; look matrix PENDING, section 5                                                                                              |
| Playwright smoke suite in the repo and in CI (PR 6)                                                           | #63; section 1                                                                                                                                                    |
| Second-account check on the edit URL (plan section 8.7, section 9)                                            | **Skipped.** Covered by the anonymous check, the unit tests that call the actions with a non-owner id, and the API's own tests. Not run with a real second login. |

## 3. Guards proved by removal

Each change below was made in the fresh clone of `main`, the named test file run, and the
change reverted.

| Guard removed                                                                | Result                                                         |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `sanitizeDescription` throws without a DOM (made it `return html`)           | 1 test fails                                                   |
| `safeHttpUrl` scheme check (made it return the input)                        | 2 tests fail                                                   |
| Edit page `if (!project.isOwner) notFound()`                                 | 1 test fails                                                   |
| Upload URL host check (`STORAGE_HOST.test`)                                  | 2 tests fail                                                   |
| `setBaseline` and `setLeaving` after a save in `ProjectForm` (unsaved guard) | 1 test fails (#65 fixes the test's timing)                     |
| Sanitizer href check **alone**, or `ALLOWED_URI_REGEXP` **alone**            | **No test fails.** The two are redundant layers on one threat; |
| Both removed together                                                        | 11 tests fail                                                  |

The last two rows are honest about overlap: either layer alone is enough for the current
corpus, so a regression in one would not be caught until the other also regresses. Not
changed; the layers are deliberate (the API sanitizes on write with a different engine).

## 4. Production round trip (logged in, deployed site)

**PENDING. Not run.** Levon deferred the logged-in runs; a small follow-up PR fills this
section and section 5.

What: on `https://gradfolio-navy.vercel.app` as the test account, create a project with
every field and a link attachment, paste hostile HTML into the editor, reload, upload a
cover, an image and a PDF (browser PUT to the signed URL), reorder attachments, make the
project private and check an anonymous visitor gets not-found, upload and restore the
avatar, check no access token appears in any HTML or RSC response, then delete everything
through the UI.

Why pending: it needs a real login (Auth0), which only Levon can do by hand; no credential
is ever typed or stored by a script. Everything the run creates is named
`E2E-M4-<timestamp>` and deleted at the end; the bucket prefix `u/<userId>/` is then
checked empty with the sandboxed gcloud (`CLOUDSDK_CONFIG=/Users/levon/Dev/university/.sandbox/gcloud`).

Command (scripts are in the FE agent's scratchpad, `m4run/`, not in the repo):

```sh
export PLAYWRIGHT_BROWSERS_PATH=/Users/levon/Dev/university/.sandbox/ms-playwright
node login.mjs       # Levon: headed Chromium, log in by hand; saves state.json
node roundtrip.mjs   # agent: the run above; writes out/result.json and screenshots
rm state.json
```

What exists instead, so far: the same flows are covered by unit and component tests
(section 2), the 15 no-login smoke specs (section 1), and #64's findings came from an
earlier manual run of the deployed site (section 6).

## 5. Pages and looks

**PENDING. Not run**, for the same reason as section 4 (list, new, edit and both dialogs
need a login). It runs inside `roundtrip.mjs` step 7: list, detail, new, edit, the delete
dialog and the add-attachment dialog, in en / ru / am, light / dark, 390 / 1440 px (72
views). Each gets a screenshot and is judged on: no horizontal overflow, axe 0
serious/critical, `<html lang>` right, layout shift under 0.1 (list, detail), and no
console error or warning over the whole run. Also the keyboard check on the delete dialog.

Already covered without a login: `/search`, `/settings` (light and dark) and the 404
page in en / ru / am for axe and console (section 1).

## 6. Findings

Both were found by running the real thing, not by the unit tests or CI at the time.

| Finding                                                                                                                                                                                                   | Severity       | Fixed                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| Every project page answered 500 in production. `isomorphic-dompurify` pulled jsdom 30, which needs `require(esm)`; Vercel's Node runtime does not provide it. Local dev and CI ran a Node where it works. | P1             | #64 (jsdom 26 pinned; `sanitize.load.test.ts`)                                |
| Clicking Add in the attachment dialog submitted the project form: the dialog is a portal, but React bubbles its submit event through the portal to the form around it.                                    | P2             | #64 (`AttachmentDialog.tsx` stops the bubble; test in `ProjectForm.test.tsx`) |
| `ProjectForm` "warns before the tab closes" test was flaky on CI: it asserted before React released the listener.                                                                                         | P3 (test only) | #65                                                                           |

Why CI missed the first: no check loaded a project page on a runtime without `require(esm)`.
#65 adds one (the e2e server runs with `--no-experimental-require-module` and loads a
project page).

## 7. Not verified

- A second real account: the edit URL of someone else's project, and a private project
  seen by a second signed-in user. Covered by anonymous checks and unit tests only.
- Browsers other than Chromium; real devices; screen readers.
- Contrast beyond axe's automatic rules.
- Empty, loading and error states of the live API cannot be forced on demand.
- Reduced-motion and forced-colors modes.
- `STORAGE_UNAVAILABLE` against production (the bucket is configured).
- Sections 4 and 5: the whole logged-in production run, the look matrix (screenshots at 390/1440, light/dark, en/ru/am), layout shift and the console on the project pages.
- Keyboard walk (part of that run) covers the delete dialog only; the form's full tab order and the
  add-attachment dialog's focus return were not walked in a browser (unit tests only).
- Screenshots are kept locally in the run output; they are not committed.
