# gradfolio

Frontend of **Gradfolio**, a student portfolio platform built as NPUA university
coursework. Students use it to show their projects, skills and achievements, with
evidence attached, to recruiters and peers. It is a Next.js 16 app (App Router,
React 19, MUI 7, Auth0 v4) deployed on Vercel, and it will read and write through
the API ([gradfolio-api](https://github.com/Levon0Asatryan/gradfolio-api)), which
owns the data and the plan of record (`docs/tracker.md` there).

- **Identity:** Auth0 (`@auth0/nextjs-auth0` v4, server-side SDK). The session lives
  in an encrypted cookie; the API accepts the Auth0 access token as
  `Authorization: Bearer`.
- **Today** every page reads mock data (`src/data/*.mock.ts`). Features move to the
  API milestone by milestone.
- **Three UI languages:** English, Russian, Armenian (`src/data/locales/`).
- **Scale:** university coursework. Tens of users, hundreds of projects.
- `npm run verify` runs format, lint, types and the tests; CI adds knip, coverage and
  the production build.

## Code Review Rules

Read by both reviewers of record: Codex (from this file) and GitHub Copilot (through
`.github/copilot-instructions.md`, which points here). Every push is reviewed by both.

### What to report, and what to leave alone

This is university coursework on a deadline. Every review round costs the author five
to seven minutes of waiting. A review that lists nine things, of which two matter,
costs more than one that lists only those two. So the bar is deliberately high.

**Report a finding only if it is one of these:**

- a **wrong result**: something a user would read and trust (a name, a count, a
  date, a status, whose profile this is) that is not what the data says;
- a **security hole**: XSS, a token or secret reaching the browser or a log, an
  authorization gap, an open redirect;
- **data loss**: a user's edit silently dropped or overwritten;
- an **accessibility regression**: something a keyboard or screen-reader user could
  do before and cannot now;
- a **broken build, a broken test, or a test that cannot fail**, including a test that
  passes for a reason other than the behaviour it names;
- a **documented contract violated**: the code contradicts a sentence in a plan
  (`docs/*-plan.md` here, or `gradfolio-api/docs/mN-plan.md`), the API's
  `openapi.yaml`, or the requirements.

**Do not report:**

- formatting, import order, naming style or type errors, because the formatter,
  linter and type checker already block on those in CI;
- suggestions phrased as "consider", "it might be cleaner" or "a more idiomatic way",
  or a preference between two correct ways of writing something;
- visual design, spacing or copy wording, unless it breaks one of the rules below;
- defensive code for inputs that the type system already rules out;
- performance or hardening that only pays off at a scale this app will never reach;
- missing tests for a case that is already covered, or coverage as a number rather
  than a named behaviour that isn't tested;
- anything already recorded as a deferred follow-up in the API's `docs/tracker.md`,
  or a known issue F1–F6 in code this change does not touch.

### Reviewing a design document

A plan is a **proposal**, not something that can be proved correct. It has no tests,
and each fix adds more prose and opens new surface.

On a plan, report only what changes the **design**:

- a contradiction with a requirement, a decision in the tracker, or measured
  evidence;
- an arithmetic or logical error in a stated invariant or bound;
- a security property missing from a page, route or surface it should cover;
- a test the plan specifies that could not fail.

Do **not** report wording, completeness or ordering. **One round on a plan, then it
merges.**

**Shape of a finding.** One comment per defect, not one per occurrence. State the
concrete failure: the input, the wrong behaviour that results, and why. A finding that
asserts a fact (a limit, a default, a specification, how Next.js, React or Auth0
behaves) must cite it, because the author is told to check the premise and push back
with evidence when it is wrong.

### Security

- **User HTML is rendered only after an allow-list sanitizer.**
  - Flag `dangerouslySetInnerHTML` (or `innerHTML`, `srcdoc`, `insertAdjacentHTML`)
    on any value a user can influence that has not gone through an allow-list
    sanitizer (DOMPurify, tracker 4.8).
  - **The current regex `sanitize` in `src/components/project/ProjectDescription.tsx`
    does not count** (F1): it leaves `<a href=javascript:alert(1)>` unchanged, among
    other bypasses. A new path that relies on it is a finding; so is any sanitizer
    built from regexes or a deny-list.
  - Not user HTML: Emotion's style tag in `ThemeRegistry.tsx`.
- **Access tokens stay on the server.** Flag an Auth0 access or refresh token (or the
  result of `auth0.getAccessToken()`) that reaches a client component's props, a
  `"use client"` module, browser storage (`localStorage`, `sessionStorage`,
  IndexedDB, a readable cookie), a URL, or a log line. Props passed from a server
  component to a client component are serialized into the HTML.
- **The API is called from the Next.js server only** (Q11: server components, route
  handlers, server actions). Flag a `fetch` to the API from browser code, and an API
  base URL or secret in a `NEXT_PUBLIC_*` variable.
- **Authorization UI is never the guard.** Hiding an edit button, or checking
  `isOwnProfile`, is presentation. Flag a write (server action, route handler) whose
  only authorization is that the UI did not offer it: the server must get the caller
  from the Auth0 session and let the API decide ownership.
- **Server actions and route handlers are public endpoints.** Flag one that trusts
  its arguments (a user id, an owner flag, a URL) instead of the session, or that
  does not validate its input.
- **The middleware (proxy) fails closed.** Flag an error path that lets a request
  through to a protected route (F2), and a matcher change that leaves a protected
  route unmatched.
- **URLs from users** (profile links, project demo and repo URLs, attachments) are
  rendered as `href`/`src` only with an `http:` or `https:` scheme. Flag
  `javascript:`, `data:` or a scheme-relative URL reaching the DOM.
- **Open redirects:** flag a `returnTo`, `redirect` or `next` parameter used in a
  redirect without checking it is a same-origin path.
- **Caching:** flag user-specific data (the session, a private profile, anything
  fetched with the user's token) in a cache shared across users (`fetch` caching,
  `unstable_cache`, `"use cache"`, a module-level variable).
- **Private fields:** flag `birthday`, `phone`, integration tokens or `auth0_id`
  rendered anywhere but the owner's own settings.

### Rendering and data

- Flag a hydration mismatch the user can see: server and client rendering different
  text (a date formatted in two time zones, `Math.random()`, `Date.now()` in render).
- Flag an error from the API shown as an empty state ("no projects yet"), which the
  user would read and trust. Errors are shown as errors.
- Flag an edit that can be lost without warning: a form whose save fails silently,
  or a navigation that discards unsaved inline edits.
- Flag a user-controlled string used to build a `RegExp`, a selector or a route
  without escaping (F7 was a crash on `C++`).
- Flag a `"use client"` boundary that pulls a server-only module (`src/lib/auth0.ts`,
  a secret) into the client bundle.

### i18n

- **Every new user-facing string exists in `en`, `ru` and `am`.** Flag a hardcoded
  English string in JSX, an `aria-label`, a `title`, a `placeholder` or `alt` text.
- Flag a translation that drops a data placeholder (`{name}`, `{count}`) or invents
  one; `locales.test.ts` checks the dictionaries, not strings built in code.
- Flag text assembled by concatenating translated fragments in English word order.

### Accessibility

Flag a change that makes something unreachable or unannounced:

- an interactive element that is not a button or link (a clickable `Box` or `div`)
  without a role, keyboard handling and focus;
- an icon-only button, input or image without an accessible name (`aria-label`,
  `<label>`, `alt`);
- a keyboard trap, or a dialog that does not move and return focus (MUI `Dialog`
  does this; a hand-built one usually does not);
- information carried by colour alone, or text below WCAG AA contrast in either
  theme;
- a removed focus outline with no replacement.

### Tests

- Flag a bug fix with no test that fails without it.
- Flag a focused or skipped test.
- Flag a new guard, check or validation with no test proving it **fails** when it
  should.
- Flag a test asserting on implementation detail (class names, internal state)
  rather than what the user sees (role, text, label).
- Flag a test that runs `git` or a hook script with the parent's `GIT_*` variables:
  inside a hook they point it at the real repository.

### Design docs and plans

- Flag a claim about library or runtime behaviour taken from memory instead of run,
  or run against a version the project does not pin.
- Flag a fix that duplicates the thing it was fixing instead of sharing it, and a fix
  applied to one instance of a pattern without checking the others.
- Flag a correction that was never itself reviewed as new work.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
