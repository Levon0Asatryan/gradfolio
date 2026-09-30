# Review instructions for GitHub Copilot

gradfolio is the Next.js 16 frontend (App Router, React 19, MUI 7, Auth0 v4, on
Vercel) of Gradfolio, a student portfolio platform (university coursework). **The
full review contract is `AGENTS.md`, section "Code Review Rules"**, the same one Codex
follows. Apply it; the essentials:

Report a finding **only** if it is one of:

- a wrong result a user would read and trust;
- a security hole: user HTML rendered without an allow-list sanitizer (the regex
  `sanitize` in `ProjectDescription.tsx` does not count); an Auth0 token reaching a
  client component, browser storage, a URL or a log; the API called from browser
  code instead of the Next.js server; a write whose only authorization is hidden UI;
  middleware that lets a request through on error; a user URL rendered without an
  `http(s):` scheme check; an open redirect; user data in a shared cache;
- a user's edit lost without warning;
- an accessibility regression: no accessible name, not keyboard-reachable, a focus
  trap, colour-only information;
- a user-facing string missing from `en`, `ru` or `am`;
- a broken build or test, or a test that cannot fail;
- code contradicting a plan, the API's `openapi.yaml`, or the requirements.

Do **not** report: formatting, naming, import order or type errors (CI blocks those);
"consider"/"cleaner"/"more idiomatic" suggestions; visual design or copy wording;
defensive code for inputs the types rule out; hardening only useful at a scale this
project will never reach; anything already deferred in `gradfolio-api/docs/tracker.md`
or a known issue F1–F6 in code the change does not touch.

One comment per defect. State the concrete failure (input, wrong behaviour, why) and
cite any fact you assert (a default, a limit, how Next.js or Auth0 behaves); the
author checks premises and pushes back with evidence when one is wrong.
