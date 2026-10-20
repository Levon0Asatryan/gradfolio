# M8 frontend verification

2026-10-20. Rebased on `origin/main` at `e0f3d53`. The API snapshot is pinned to
`0a80c0f`, which includes the M8 operations and migration `0012_email`.

## Delivered

- Owner profile resume download: sections and individual projects, explicit consent
  for private/draft work, server-side authenticated PDF request, en/ru/am copy.
- Signed-in Settings: invitation email preference and language saved through the API.
- Signed unsubscribe confirmation: no mutation on GET, bounded same-origin POST,
  fragment removed from the displayed URL.

## Checks

Node 24 Linux containers, current lockfile. All checks passed:

- ESLint, TypeScript, knip, and Prettier on tracked files.
- 1,635 unit/component/route tests in 148 files.
- Coverage: statements 89.74%, branches 85.75%, functions 86.20%, lines 91.03%.
- Next.js production build, including the new PDF/preferences/unsubscribe routes.
- API OpenAPI snapshot matches the backend document byte for byte.

The repository's npm hooks could not run on this host (npm is not on PATH).
The checks above ran explicitly, with npm in Docker, before publication.
The pre-existing untracked `docs/qa-production-ui-2026-10-18.md` is excluded from
the PR and the tracked-file formatting check.

## Review and remaining acceptance

Manual review traced browser input through the same-origin validators and server
API client to caller-scoped API operations. Auth0 tokens stay on the server;
responses use no-store; errors remain visible; new strings exist in all three
languages; MUI controls and dialog provide keyboard/focus handling. No outstanding
code defect was identified in that review. This is a manual review, not a claim
that the repository's agent workflow was run.

Not verified: a signed-in browser journey on the deployed site, exhaustive guard
mutation testing, real provider delivery, or a deployed unsubscribe round trip.
No production deployment is claimed. Merge and deploy the API PR first, then this
frontend PR. Keep email delivery disabled until a provider/domain is configured.

After deployment: log in, open your own profile, download selected sections in
en/ru/am, prove private work needs explicit selection, then change Settings and
reload to confirm persistence. The Download resume entry is on the owner profile,
not the project detail page.
