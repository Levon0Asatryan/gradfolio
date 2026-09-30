# Contributing to gradfolio

Gradfolio is a student portfolio platform built as NPUA university coursework. This
repository is its Next.js frontend. Issues and pull requests are welcome, with one
expectation up front: a change is judged on correctness and on the evidence behind
it, not on its size.

This file is the short version. The conventions themselves live in files that are
kept up to date with the code, so they are not repeated here:

| File                             | What it holds                                                      |
| -------------------------------- | ------------------------------------------------------------------ |
| [README.md](README.md)           | What Gradfolio is, running it locally                              |
| [CLAUDE.md](CLAUDE.md)           | How work is done, commands, structure, patterns, pages             |
| [AGENTS.md](AGENTS.md)           | What a review checks for. Read it before opening a PR.             |
| [docs/README.md](docs/README.md) | Where the plan of record (in gradfolio-api) and the other docs are |

## Reporting a bug or asking for a feature

Open an issue from one of the templates. For a bug, the most useful thing you can
give is the page, what you did, and a screenshot.

**Security issues are not reported in public.** See [SECURITY.md](SECURITY.md).

## Setting up

You need Node 24 (see `.nvmrc`), and `gh` and `jq` for the push gates and their
tests (`jq` ships with macOS 15; on Linux, install it). Then:

```sh
npm ci
cp .env.example .env.local   # only needed to log in
npm run dev
```

## Making a change

1. Branch from the latest `main`, then run `npm ci` again, because dependencies
   differ between branches.
2. Keep each pull request to one coherent step, and split its commits by logical
   change.
   - Tests go in the same commit as the code they test.
   - Each commit must pass the pre-commit hook on its own.
3. **A guard, check or filter ships with a test that fails without it.** Remove the
   guard, watch the test fail, then put it back. A test that has never been seen
   failing is not evidence.
4. **Every new user-facing string goes into `en`, `ru` and `am`**
   (`src/data/locales/`).
5. Before opening the PR, run:

   ```sh
   npm run verify          # format, lint, types, tests
   npm run test:coverage   # must stay at or above the floor
   npm run build
   ```

   Then open every page you changed in `npm run dev`, in light and dark mode.

### The pre-push review gate

The pre-push hook runs `scripts/require-review.sh`, which wants a receipt from the
`/gradfolio-web-review` skill (Claude Code) for the commit you push. Docs-only pushes
are exempt. **Without Claude Code**, review your own diff against `AGENTS.md`, then
push with:

```sh
SKIP_REVIEW_GATE=1 git push
```

and say so in the PR's "Not verified" section. CI does not depend on the receipt.

## Review

CI runs every job on every push, and all of them must pass, as must the Vercel
preview. Two automated reviewers, GitHub Copilot and Codex, review each push. Request
both with `sh scripts/request-review.sh`. Every thread gets a reply, whether that is
a fix or a reasoned disagreement.

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contribution is licensed under the
[MIT License](LICENSE).
