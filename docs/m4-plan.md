# FE M4 plan: projects and media

Tracker 4.6–4.10, plus Playwright for browser checks. Companion to the API's
`docs/m4-plan.md` (gradfolio-api PR "M4 plan", commit 70f17e8, read-only here): the
contract below is that plan's §4.1, §5 and §10. Where the two differ, the API plan wins
and this one is corrected.

Claims marked **run** were executed on 2026-10-08 in a scratch directory outside the
repo: Tiptap 3.31.4, Lexical 0.52.0, React 19.3.0, esbuild 0.28.2, DOMPurify 3.4.16,
isomorphic-dompurify (jsdom 30.1.2), Playwright 1.64 with Chromium 156, axe-core 4.13
(`@axe-core/playwright`), Node 24.20. Repo facts were read from `origin/main` at cb48095.
**Not run:** anything that needs the API's M4 endpoints (none are deployed yet) or a
storage bucket (Q6 is open).

## Decisions (Levon, 2026-10-08)

- **Editor: Tiptap** (§1).
- **Playwright joins the repo**, as its own PR (PR 6), never stacked with a feature PR (§8).
- **Q6: Google Cloud Storage, private bucket, signed read URLs** (API plan option S; the
  API sub-agent builds it, the bucket is approved). The upload PR (PR 5) is on: §5 applies
  in its "S" form, and the "D, URL only" branch is dropped.

## 1. Editor: Tiptap or Lexical

Both were built into the same minimal editor (rich-text, history, lists, links; no
toolbar) and driven in real Chromium.

| Measure (run)                                                                            | Tiptap (`@tiptap/react` + `starter-kit` + `pm`)                                                              | Lexical (`lexical` + `@lexical/react` rich-text, list, link, html)                                                                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle, minified, React included                                                         | 629 KB raw, **198 KB gzip**                                                                                  | 614 KB raw, **199 KB gzip**                                                                                                                                                       |
| Over a React-only bundle (223/69 KB)                                                     | +129 KB gzip                                                                                                 | +130 KB gzip                                                                                                                                                                      |
| Typed `Hello world`, `Привет мир`, `Բարև աշխարհ`, `日本語 ։ ё` (keyboard + `insertText`) | All four kept, one `<p>` each                                                                                | All four kept, one `<p>` each                                                                                                                                                     |
| HTML emitted for bold, italic, list, heading                                             | `<strong>`, `<em>`, `<ul><li><p>`, `<h3>`, `<a href target rel>`: plain semantic tags                        | `<b><strong style="white-space: pre-wrap">`, `<span style="white-space: pre-wrap">` around **every** text run, `<li value="1">`, links get `about:blank` when the URL is refused  |
| Pasted payloads (8, see below)                                                           | Nothing executable survives; `javascript:` links lose the link, keep the text                                | Same, but a `javascript:` link becomes `href="about:blank"`; `<svg><script>` leaves the text `alert(1)` in the body                                                               |
| Tab from a paragraph and from a list                                                     | Leaves the editor on the next Tab (3 presses reach the next button); no keyboard trap                        | Same                                                                                                                                                                              |
| axe-core on the page with the editor                                                     | 0 violations (the editor needs `role=textbox`, `aria-multiline`, `aria-label`, passed through `editorProps`) | 0 violations                                                                                                                                                                      |
| Console errors / warnings                                                                | none                                                                                                         | none                                                                                                                                                                              |
| Fit to the API allow-list (API §4.1)                                                     | `h2 h3 h4 p br strong em u s code pre blockquote ul ol li a hr` is the StarterKit set; nothing to strip      | Output needs `style`, `value`, duplicate `b`/`strong` removed by the server: it passes, but the stored HTML is noisier and the server does the cleaning that the editor should do |

Pasted payloads (run, `ClipboardEvent` with `text/html`): `<img onerror>`, `javascript:`
link, entity-encoded `javascript:` link, `<script>`, `<svg><script>`, `style` plus
`onclick`, `<iframe srcdoc>`, MathML with `xlink:href`. Neither editor is a security
boundary and neither is treated as one: the API sanitizes on write and the page
sanitizes on render (§6). The editor only has to emit tags the allow-list keeps.

**Decision (recommended): Tiptap.** Same size and same measured a11y and input
behaviour; its output is clean semantic HTML that is already the API allow-list, and it
parses stored HTML natively when the edit page loads it (ProseMirror's schema drops
anything it does not know). The measured costs of Lexical are all on the output side.

How it is used:

- `StarterKit.configure`: headings H2–H4 only; keep bold, italic, underline, strike,
  code, code block, blockquote, bullet and ordered list, horizontal rule, link. **No
  image, no table, no link `target`/`rel` options** (the API sets them; API §10).
  Link protocols `http`, `https`, `mailto`; no autolink.
- Loaded with `next/dynamic` (`ssr: false`) in the form and edit routes only. The list,
  detail and every other route do not download it. The 129 KB gzip is measured
  with the extension set above; the real figure is measured again in PR 4 (`next build`
  route sizes) and the PR states it.
- Accessible name from the field label (`aria-labelledby`), `role=textbox`,
  `aria-multiline`, a visible focus ring on the editor surface, and a toolbar as
  `role=toolbar` with toggle buttons (MUI `ToggleButton`, `aria-pressed`, a name each,
  44 px targets, roving focus with arrow keys, one Tab stop). Ctrl/Cmd+B/I/U work as in
  every editor. The toolbar and a "Tab leaves the editor" hint are in all three languages.
- Characters: input goes straight to the browser's contenteditable, so ru and am (and
  IME composition) are the browser's; the Playwright check types them (§8).
- The size cap (`PROJECT_DESCRIPTION_MAX_BYTES`, 100 000) is shown as a counter on the
  HTML the editor would send; the API measures the sanitized value and has the last word.

## 2. Form layout

**The approved prototype has no project form or project detail screen** (its screens:
dashboard, profile, projects list, account, navigation). The form is therefore built
from the prototype's form primitives and the UI track's edit model, and is the one new
design in M4. The acceptance reference for the screenshots (§8) is the prototype's
field, chip, error, switch, modal and toast styles plus the existing projects list.

Edit model (`docs/ui-plan.md`, UI-4): per-section dialogs fit the profile's short
entries. A project is one record with a long description and ~12 fields, so create and
edit are **one full page** with section cards, a sticky action bar, and the profile's
rules for feedback.

Page structure (`ProjectForm`, one component for create and edit; `PageContainer` 800 px):

| Section card | Fields                                                                                                                                                                     | Mirrors (API §5.4)                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Basics       | Title (required), Summary (multiline, helper text), Category (six colour chips in the prototype's category colours, radio group), Status (ongoing / completed / archived)  | `title` ≤ 500 trimmed; `summary` text; `category`, `status` enums   |
| Description  | Rich-text editor (§1) with counter                                                                                                                                         | `descriptionHtml` ≤ 100 000 bytes after sanitizing                  |
| Details      | Start date, End date (native `type=date`, so the browser supplies the picker and the locale), Course, Professor                                                            | `YYYY-MM-DD`; `endDate ≥ startDate` or 400; course/professor ≤ 500  |
| Skills       | Technologies (≤ 30) and Tags (≤ 20): chip inputs (MUI `Autocomplete` `freeSolo` + `multiple`), Enter or comma adds, Backspace on empty removes, each chip removable by key | `termList`: trimmed, case-insensitive duplicates merged, ≤ 255 each |
| Links        | Live demo URL, Repository URL, extra links (label + URL rows, ≤ 10)                                                                                                        | `httpUrl`; `linkList` ≤ 10                                          |
| Media        | Hero image, attachments (list with type, title, URL, up/down reorder, remove; add dialog by type)                                                                          | §5; `PROJECT_MAX_ATTACHMENTS` (20); https only for media            |
| Visibility   | Public / Private radio with one-line explanations; on a draft (imported) project an extra "Publish" action                                                                 | `isPublic`; `isDraft` (false = publish)                             |

- Sticky bottom bar: **Save** (busy state at once, disabled while saving) and **Cancel**
  (back to the project, or the list on create). The bar sits above the phone bottom
  navigation at 390 px.
- Validation runs on the client with the same limits (`src/lib/projects/limits.ts`, same
  shape as `src/lib/profile/limits.ts`; values are the API's config defaults, pinned to
  the API commit, and a test pins each number to the generated OpenAPI limits once the
  API publishes them, a tracker follow-up already). **The server action checks again**
  and the API checks last; the API's 400 field errors are shown on the field.
- Errors by field under the input (`aria-invalid`, `aria-describedby`), an error summary
  at the top on submit that takes focus, and a toast on success. A failed save keeps
  every edit and says so; it never shows as an empty state.
- `useUnsavedGuard` (reused) while the form is dirty. Browser Back is not covered (same
  known limit as the profile; tracker follow-up).
- Fields the API owns are never sent: ids, `thumbnailUrl`, `aiSummary`, `source`,
  `repo*` metadata (API §10). To clear a field the form sends `null`.
- Create writes in this order from one server action: `POST /projects` (core fields),
  then each attachment `POST /projects/:id/attachments`. If an attachment fails the
  project exists: the action returns the id plus which attachments failed, and the page
  moves to the edit route with an error summary rather than losing the work.

Labels: the field the mock calls "AI Summary" is the user's **Summary** (API §5.1).
Every string is added to `en`, `ru` and `am` in the same commit; the attachment form's
hardcoded English (`placeholder="e.g. https://..."`, the type labels) moves into i18n
in PR 3 (4.10).

## 3. Edit route and delete (4.7)

- `src/app/projects/[id]/edit/page.tsx`, a server component:
  1. no session: the middleware (proxy) redirects to login, as for every protected route;
  2. `GET /projects/:id` with the caller's token from the server only;
  3. 404, or `isOwner === false`, gives `notFound()`.
- **The UI is not the guard.** Step 3 is presentation: the PATCH and DELETE actions send
  only the path id and the body, with the caller's token; the API answers 404 to a
  non-owner and the action returns that as a not-found result. A test calls the actions
  with a second user's project id (API 404 mocked from a real response) and expects the
  not-found result; a second-account check runs against the local API (§9).
- The detail page shows **Edit** only when `isOwner`. A private project is visible to
  its owner only (Q3 = A): `GET` returns 404 to everyone else, and the page shows the
  existing not-found.
- **Delete:** a button in the edit page's danger card opens a MUI `Dialog` (focus moves
  in and returns): "Delete _Project name_?", the body says attachments and uploaded
  files are removed and it cannot be undone; actions Cancel (default focus) and
  **Delete project**. The server action calls `DELETE /projects/:id`; success redirects
  to `/projects` with a toast (`?deleted=1`, a flag only, no user text in the URL).
  A failed delete keeps the dialog open with the error.
- Metadata: `generateMetadata` uses the project title (text, no HTML) and the tab title
  follows the UI language like the dashboard's (`requestDictionary`).

## 4. Field mapping (API plan §5.1)

Frontend type today (`project.mock.ts`, `project-new/types.ts`) on the left; the
generated types from `openapi.yaml` replace it (Q5: bump the pinned API commit in PR 3).

| Frontend today                                          | API field                                                                                            | Handling                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id: "ecoroute"` slug, random attachment ids            | UUIDs from the server                                                                                | Routes use the id; the form never invents ids                                                                                                                        |
| `aiSummary` (form label "AI Summary")                   | `summary` (user text); `aiSummary` read-only, null                                                   | Field renamed Summary; display `summary ?? aiSummary`                                                                                                                |
| `descriptionHtml`                                       | `descriptionHtml` (sanitized on write)                                                               | Editor in, DOMPurify on render (§6)                                                                                                                                  |
| `heroImageUrl?`                                         | `heroImageUrl` nullable, https or our object                                                         | Media section; upload per §5                                                                                                                                         |
| `liveDemoUrl?`, `repo.url`, form `repoUrl`              | `liveDemoUrl`, `repoUrl` (write); `repo{url,latestCommitDate,readmeUrl,stars,forks,language}` (read) | Write `repoUrl` only; the rest is shown read-only when set                                                                                                           |
| `metadata{startDate,endDate,category,course,professor}` | same nesting; dates `YYYY-MM-DD`                                                                     | Form Details section; `endDate ≥ startDate`; `null` end = ongoing                                                                                                    |
| `category` six values                                   | ENUM, same six                                                                                       | No mapping. The stale 4-value type in `profile.mock.ts` goes with the mock                                                                                           |
| (no status in form)                                     | `status` ongoing / completed / archived                                                              | Added to Basics                                                                                                                                                      |
| (no visibility)                                         | `isPublic`, `isDraft`                                                                                | Visibility section; new project public, published (API default)                                                                                                      |
| `technologies[]`, tags                                  | `technologies`, `tags` (≤ 30 / ≤ 20, canonical spelling)                                             | Chip inputs; the response is the stored spelling and replaces the form value after save                                                                              |
| `links[]`, `files[]`                                    | `links` ≤ 10; `files` overlaps pdf attachments                                                       | Form edits `links` and attachments only; `files` shown read-only if present                                                                                          |
| `attachments[]{type,url,title,thumbnailUrl}`            | `attachments[]{id,type,url,title,thumbnailUrl,embedUrl}`                                             | **Never send `thumbnailUrl`** (the form's random Unsplash one goes). Video: render `embedUrl` only, never `url.replace()`                                            |
| `team[]`                                                | read-only `team[]`, `owner`                                                                          | No team writes before M5; `userId` null gives no profile link                                                                                                        |
| sort `newest`/`oldest` by start date                    | `sort`: newest, oldest (by **creation**), updated, name_asc, name_desc                               | Same query values; the label wording changes from start date to added date; the list drops its client-side sorting for the API's (keyset cursor, "Load more" button) |
| list filter by category / search                        | `category`, `status`, `state`, `tag`, `technology`, `q`                                              | Category chips and search box call `/me/projects` through a server action; no client `fetch` to the API                                                              |

## 5. Upload UX (Q6)

Q6 is decided: GCS with signed reads. Signed read URLs change about every 50 minutes, so
the FE never stores or caches an image URL it was given.

- **GCS, signed reads (decided):** next to the URL field each image/PDF control gets **Upload a file**.
  Flow (API §3.4; the token never reaches the browser):
  1. the browser sends type and size to a server action (no file bytes);
  2. the action calls `POST /me/uploads` with the caller's token and returns
     `{uploadUrl, headers, fileUrl}`;
  3. the browser `PUT`s the file to `uploadUrl` with **exactly** the returned headers
     (`XMLHttpRequest` for progress);
  4. the form puts `fileUrl` in the field; it is saved by the normal write, where the API
     checks the object.
- UI states per upload: choosing (limits shown: image ≤ 5 MB png/jpeg/webp/gif, PDF ≤
  20 MB), uploading (determinate progress, `role=progressbar` with a name, Cancel),
  done (thumbnail or file name), failed (the reason, Retry; the form keeps its other
  edits). Client checks type and size first, so the common failures never leave the
  browser; the signature enforces them anyway.
- **Uploads need an existing project** (`hero` and `attachment` take a `projectId`,
  API §3.5). On `/projects/new` the Media section is URL-only with a note; file upload
  appears on the edit page, where a new project lands after the first save. Avatars
  upload from the account page in PR 5 (same component).
- **Previews cannot upload** unless the preview origin is in the bucket CORS (API §3.1,
  no `*.vercel.app` wildcard). The upload control checks `NEXT_PUBLIC_*`-free server
  state: the server action returns `UPLOAD_UNAVAILABLE` on a failed signing, and the
  control shows "Uploads are not available on this site" with the URL field still usable.
- A dropped or interrupted PUT leaves an orphan object; the API's sweep removes it (API
  §3.5). Nothing for the FE to clean.
- Keyboard: the picker is a real `<input type=file>` behind a button; drag-and-drop is an
  addition, never the only path.

## 6. Rendering: DOMPurify second layer and images (4.8, 4.9)

- `ProjectDescription` drops the regex `sanitize` (F1) and calls
  `sanitizeDescription(html)` in `src/lib/sanitize.ts`. The helper uses **DOMPurify with
  `ALLOWED_TAGS` equal to the API allow-list** and `ALLOWED_URI_REGEXP`
  `^(?:https?|mailto):` (API §10), `ALLOWED_ATTR` `href`, `target`, `rel`, `class` on
  `code`; links forced to `rel="noopener noreferrer nofollow" target="_blank"` in an
  `afterSanitizeAttributes` hook.
- **DOMPurify needs a DOM.** Run: `require("dompurify")` in plain Node has no
  `sanitize` at all (it fails closed, it does not pass input through), and
  `isomorphic-dompurify` (DOMPurify + jsdom) sanitizes on the server correctly
  (`<img onerror>` removed, `javascript:` href dropped, `https` link kept). Plan: the
  detail page is a server component and calls the helper on the server with
  `isomorphic-dompurify`, so no unsanitized HTML reaches the browser and no script
  loads for it. jsdom is ~7 MB installed, server-only. PR 3 proves it builds and runs
  on the Vercel preview (`serverExternalPackages` if Next 16 bundles jsdom badly) and
  falls back to sanitizing in a client component if it cannot. The helper throws if no
  DOM is available; it never returns its input unsanitized.
- The XSS corpus the API uses becomes a test of `sanitizeDescription` (62 vectors; the
  FE test file imports the same vectors as a fixture copy and says so), including
  idempotence: `sanitize(sanitize(x)) === sanitize(x)`.
- **Images.** `AttachmentsGallery` and `ProjectHeader` use `next/image` with
  `remotePatterns`; an attachment image may be **any https URL**, which `remotePatterns`
  cannot list. User media therefore renders `unoptimized` (as `ProjectCard` already
  does): the browser fetches the URL directly, nothing is proxied through Vercel's
  optimizer, and signed URLs that change every 50 minutes do not fill its cache.
  4.9 becomes: remove `i.pravatar.cc` and `images.unsplash.com` (mock only) and add no
  host for user media; the storage host is added only if an optimized image remains
  (none is planned). F5 is closed by this, not by a host entry. Allowed `src` is
  `https:` only, checked in one helper (`safeMediaUrl`), also for `href`.
- Video: `<iframe src={embedUrl}>` where `embedUrl` is one of the API's two
  `youtube-nocookie.com` / `player.vimeo.com` prefixes (checked again on the client
  side of the server render), `sandbox` and `referrerpolicy` set, a `title`.

## 7. List and detail on the API (4.10) and states

- `/projects`: server component reads `/me/projects` (every state); filters and sort as
  query params; empty state ("No projects yet", with the New project action) only when
  the API answered an empty page; **an API error is an error state** with Retry, never
  the empty state. `loading.tsx` skeleton with the cards' dimensions (no layout shift).
- `/projects/[id]`: `GET /projects/:id`; owner sees Edit and a "Private" / "Draft"
  chip; `notFound()` on 404 (also for a private project of someone else; same page, so
  existence is not revealed); an unreachable API shows an error with Retry.
- The dashboard's recent projects already come from the profile response; unchanged.
- `project.mock.ts`, the `getProjectById` path and its test fixtures are deleted in PR 3;
  nothing imports them afterwards (knip).
- All API calls are server-side through `src/lib/api/client.ts` (Q11). Server actions
  take no user id: the caller is the Auth0 session, the project id comes from the path
  and goes to the API, which decides ownership.

## 8. Playwright

Rule from the brief: use it where seeing the real page beats reading code; scratch
scripts by default; the repo gets `@playwright/test` only as its own PR.

**Checks that run in the feature PRs (scratch scripts, results in the PR and in
`docs/fe-m4-verification.md`):**

1. Screenshots of every changed page (`/projects`, `/projects/[id]`, `/projects/new`,
   `/projects/[id]/edit`, the delete dialog, the upload states) at 390 and 1440 px, light
   and dark, en / ru / am, attached to the PR; compared with the prototype's list and
   form styles (there is no prototype form, §2).
2. Keyboard-only walkthrough of the form and the edit page: tab order follows the
   visual order, a visible focus ring everywhere, the editor and chip inputs are left with
   Tab, the delete dialog and the add-attachment dialog trap focus and return it.
3. `@axe-core/playwright`: 0 serious or critical violations per changed page and per
   open dialog. (Run on the bare editor today: 0.)
4. No console errors, no hydration warnings, in each language.
5. No layout shift when data loads: record `layout-shift` entries (PerformanceObserver)
   during load of the list and detail; the skeleton must hold the layout.
6. XSS: the payloads of §1 pasted into the real editor, saved, and rendered; no dialog,
   no network request to a test canary, no `javascript:` href in the DOM.
7. Create → reload → edit → delete against the local API (`gradfolio-m4` stack, port
   3006); a second account gets not-found on the edit URL.

**Setup (sandbox only):** `export PLAYWRIGHT_BROWSERS_PATH=/Users/levon/Dev/university/.sandbox/ms-playwright`
then `npx playwright install chromium` (WebKit only if a check needs it; none planned).
Chromium headless shell 156 is already installed there from this plan's runs. Nothing in
`~/Library/Caches` is touched by these runs.

**Login:** no Auth0 credential is ever scripted. For the logged-in pages Levon logs in
once in a headed browser; the saved `storageState` (session cookies: a secret) lives in
the scratchpad outside the repo and is deleted at the end. Until Levon does that, the
logged-in checks (1–7 on `/projects*`) cannot run; the public parts can.

**Proposal for Levon: add Playwright to the repo, as its own PR (PR 6), not stacked with
a feature PR.** Scope: `@playwright/test` and `@axe-core/playwright` as devDependencies,
`playwright.config.ts` (Chromium only, baseURL from env, `PLAYWRIGHT_BROWSERS_PATH`
honoured), 3 smoke specs that need **no login**: the 404 page and the sign-in redirect
render and pass axe in en/ru/am; the public profile page of a seeded public user passes
axe and has no console errors; the language switch changes `<html lang>`. A CI job runs
them against `next build && next start` with fake Auth0 variables (pages render without
them, `CLAUDE.md`). Browsers are downloaded in CI (cached), never committed. It is
groundwork for tracker 9.6; the logged-in journey stays in 9.6. Approved by Levon.

## 9. Security properties and how each is proved

| Property                                                                     | Proof                                                                                                                                                       |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token never reaches the browser (Q11)                                        | Actions and `client.ts` are `server-only`; a test greps the client bundle output for the token env names; the browser `PUT` carries only the signed headers |
| No project write trusts the UI                                               | Action tests: a non-owner id gives not-found; an action with no session fails; removing the session check fails the test                                    |
| A private or draft project stays private (Q3)                                | Page tests with a mocked 404; Playwright with a second account; the list never renders a project the API did not return                                     |
| Stored HTML is inert on render                                               | `sanitizeDescription` corpus tests (+ idempotence) and the Playwright paste check; remove the sanitizer and the tests fail                                  |
| No unsanitized fallback                                                      | Test: with no DOM the helper throws                                                                                                                         |
| User URLs reach `href`/`src` only as `https:` (or `mailto:` in descriptions) | `safeMediaUrl` tests with `javascript:`, `data:`, `//host`, `http:`, credentials in the URL                                                                 |
| Form limits equal the API's                                                  | Table test over `limits.ts`; boundary values (N and N+1) for each field; the API's 400 field errors render on the field                                     |
| An edit is not lost silently                                                 | Failed save keeps the form and shows the error; `useUnsavedGuard` while dirty (tests)                                                                       |
| Every string exists in en/ru/am                                              | `Dictionary` type and `locales.test.ts`; the Playwright run in ru and am                                                                                    |
| Upload cannot be abused from the UI                                          | Client checks are convenience; the signature and `accept()` enforce (API §3.5); an over-size file attempt is shown in the PR                                |

Each guard is proved by removing it, as in every PR since M2.

## 10. Pull requests

1. **Codex follow-ups from #53–#56** (gradfolio #58).
2. **This plan** (docs only; one review round, then it merges). Decided: Tiptap, Playwright (PR 6), GCS
   with signed reads (PR 5 on).
3. **Types, list and detail** (4.8, 4.9, 4.10 read side): bump the pinned API commit and
   regenerate types; `/projects` and `/projects/[id]` on the API; `sanitizeDescription`
   with the corpus; `safeMediaUrl`; mock removed; states; i18n of the leftover English.
   Needs API PR (a) merged **and** Deploy green. Merges after that, not before.
4. **Form, edit page and delete** (4.6, 4.7): Tiptap, `ProjectForm`, actions, limits,
   the unsaved guard, the delete dialog. Needs API PR (b) deployed.
5. **Uploads** (on: Q6 = GCS): the upload control, avatar on the account page. Needs
   API PR (c) and the bucket.
6. **Playwright groundwork** (approved; independent of 3–5, never stacked).
7. `docs/fe-m4-verification.md`: what ran, including the Playwright results per changed
   page and what was not verified.

Both reviewers on every push; two rounds, then fix-now only plus one confirmation round.
Previews use the production API and database: test data is made with a test account and
deleted.

## 11. Proposed tracker changes

- 4.6: editor = Tiptap (if approved), measured; the prototype has no project form, so
  the form is new design on the prototype's primitives.
- 4.9: no host entry for user media (arbitrary https images cannot be listed); render
  user media `unoptimized`; remove the two mock hosts. F5 closed by 4.9.
- 4.8: `isomorphic-dompurify` on the server (plain `dompurify` has no `sanitize` in Node).
- New rows: browser Back drops a dirty project form (same limit as the profile);
  `limits.ts` should be generated from API-published limits (existing follow-up);
  Playwright smoke suite (PR 6) as groundwork for 9.6; the `files` field is read-only in
  the FE until the API retires it; list sort `newest`/`oldest` now means creation date.
