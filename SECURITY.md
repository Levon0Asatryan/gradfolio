# Security policy

Gradfolio stores personal data about students: contact details, education history,
and links to their GitHub and LinkedIn accounts. This repository is the web app
that shows it, holds the login session, and renders rich text users write. That
makes security reports important, even though this is a university coursework
project.

## Reporting a vulnerability

**Do not open a public issue.** Report it privately through GitHub:

1. Go to the repository's
   [Security tab](https://github.com/Levon0Asatryan/gradfolio/security).
2. Choose **Report a vulnerability**.

That opens a private advisory that only you and the maintainer can see. Please
include:

- what an attacker can do;
- the steps that demonstrate it (the page, the input, the browser);
- the commit or deployment you tested against.

You can expect an acknowledgement within a week. A fix for a confirmed issue is
developed privately and released before the advisory is published. You are credited
unless you ask not to be.

## Supported versions

There are no releases. Only the latest commit on `main`, and its Vercel deployment,
is supported; fixes land there.

## What is in scope

- **Stored cross-site scripting.** Project descriptions are rich text rendered as
  HTML. Markup that runs script in another user's browser is in scope, as is any
  other user-supplied value (a link, a name, an attachment URL) that does.
- **Token handling.** An Auth0 access or refresh token, or the session secret,
  reaching the browser (page source, client JavaScript, browser storage, a URL) or a
  log.
- **Authentication and the auth UI.** Getting a session as someone else; a
  login-required page that renders without a session; a redirect after login to an
  attacker's site; a write that relies on hidden UI instead of a server-side check.
- **Private data** (birthday, phone, integration details) shown to anyone but its
  owner.

## Out of scope

- Findings that need an already-compromised device, browser extension or Vercel
  account.
- Denial of service by sheer volume.
- Missing hardening headers or best practices with no demonstrated impact.
- Vulnerabilities in dependencies with no exploitable path through this app.
  Dependabot tracks those.
- The API ([gradfolio-api](https://github.com/Levon0Asatryan/gradfolio-api)): access
  between users, server-side validation and sanitization. Report those there, the
  same way.
