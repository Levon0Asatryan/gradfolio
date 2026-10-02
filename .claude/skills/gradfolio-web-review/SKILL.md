---
name: gradfolio-web-review
description: Review gradfolio (Next.js frontend) changes against this repository's own rules in .review/rules/ and AGENTS.md, before pushing. Passes — mechanical checks, the rule corpus, a pass that traces one page from request to pixels (server/client boundary, auth, data, i18n, accessibility), then an adversarial pass. Use before the first push of a PR, and after fixing review findings. Scoped entirely to this repository.
---

# gradfolio-web-review

The review that runs **before** the first push, so the reviewer sees finished
work. Every finding here is a review round that never happens.

**Scope.** Reads `.review/rules/`, `AGENTS.md`, `CLAUDE.md`, the plan the branch
implements (`docs/*-plan.md` here, or `gradfolio-api/docs/mN-plan.md`), and the
API's `openapi.yaml` when the change calls the API. It reads and writes no rule
corpus outside this repository.

Invoked:

- `/gradfolio-web-review`: the branch diff against `origin/main`
- `/gradfolio-web-review --fix-round`: pass 0 plus the blast radius of the fix
- `/gradfolio-web-review <path>`: one file or directory

## Pass 0: mechanical (always, a minute)

Run from `CLAUDE.md` → "Commands" and report failures as a block: **verify**,
**coverage ≥ floor**, **knip**, **build**. Then the `**Check:**` regexes in
`.review/rules/gradfolio-web.md` against the changed files, reporting file:line
plus the message. A match is a pointer for pass 1 to judge, not a failure by
itself: correct code can match. Every command must have run; one that did not is
not clean. If a command fails, stop: there is no point reviewing code that does
not build.

## Pass 1: the rule corpus

For each rule in `.review/rules/gradfolio-web.md`, and each rule in `AGENTS.md`'s
"Security", "Rendering and data", "i18n" and "Accessibility" sections, ask whether
this diff could violate it; check the ones that apply. Weight the ones that leak a
token, render unsanitized HTML, or lose an edit.

## Pass 2: one page, request to pixels

For each page or component the change touches, trace it hop by hop and say what the
change alters at each:

- **Route and middleware:** is the route public or login-required (tracker 2.10)?
  Does the middleware fail closed on it?
- **Server side:** which server component, route handler or server action runs;
  where the caller comes from (the Auth0 session, never an argument); what it asks
  the API for, with which token; what is cached, and whether the cache key includes
  the user.
- **The boundary:** every prop that crosses into a `"use client"` component is
  serialized into the HTML. Name each one; none may be a token or a private field.
- **Rendering:** user HTML through the allow-list sanitizer only; user URLs
  scheme-checked; user strings never built into a `RegExp` or selector unescaped;
  errors shown as errors, not empty states.
- **Text:** every new string in `en`, `ru` and `am`; placeholders intact.
- **Accessibility:** each new interactive element has a role, a name, keyboard
  access and visible focus; dialogs move and return focus; contrast holds in both
  themes.
- **Walk the plan's normative sentences** ("must", "is excluded from") and point at
  the implementing line. A missing one is a finding.

## Pass 3: adversarial

Knock down your own findings. Is the premise true: verify Next.js, React, MUI and
Auth0 behaviour against the installed source (`node_modules`) or by running it,
not from memory. Would the test actually fail: for every guard, name the test and
what removing the guard makes fail. Is it a nit the severity contract excludes?

**A reviewer that mutates the tree runs alone**, never alongside one that reads it,
or the reading one reports defects that do not exist.

## Output

PASS 0 / PASS 1 / PASS 2 / PASS 3 summary, then FINDINGS ranked by severity
(file:line, one sentence, then the concrete failure: input → wrong output), then
NOT CHECKED. "Nothing" is a valid finding list.

## The receipt: this is what unblocks the push

Write `.review/.last-review.json` **every time**, with the real count:
`{"sha": "<git rev-parse HEAD>", "at": "<ISO timestamp>", "findings_open": <N>, "method": "gradfolio-web-review"}`

- `N` is every finding still open: each FINDING above, plus one per pass 0 failure.
  `scripts/require-review.sh` refuses the push unless it is `0`.
- `N` reaches `0` only by fixing (then re-running this review on the new commit) or
  by an explicit deferral recorded in the PR with a proposed tracker row. Deferring
  is a decision to record, not a way to reach zero.
- A pass that did not run (pass 0 stopped early, NOT CHECKED items) is not clean:
  say so, and do not write `0` for it.
- A hand-written receipt uses an honest `method`, and the PR says which passes ran.

## After the review

Fix what holds up before the first push. A recurring finding not yet in the corpus
is added there with its `**Why:**` and source PR.
