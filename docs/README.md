# gradfolio documentation

This folder holds documentation that belongs **with the frontend's code**: it would
go out of date if the code changed and nobody updated it, so it is reviewed in the
same pull request as the change that affects it.

| Document                                       | Covers                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| [../README.md](../README.md)                   | What Gradfolio is, and running it locally                           |
| [../CLAUDE.md](../CLAUDE.md)                   | How work is done, commands, structure, patterns, pages              |
| [../AGENTS.md](../AGENTS.md)                   | What a review checks for                                            |
| [setup-plan.md](setup-plan.md)                 | Baseline of this repo on 2026-09-30, and the plan for its toolchain |
| [setup-verification.md](setup-verification.md) | What was run to accept the setup, and what it produced              |
| `*-plan.md`, `*-verification.md`               | Plans and verification records for frontend-only work               |

## What is not here

The plan of record, and everything shared by the three repositories, lives in
[gradfolio-api](https://github.com/Levon0Asatryan/gradfolio-api) `docs/`:

| Looking for                                       | Go to                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Status of every milestone, task and follow-up** | [`tracker.md`](https://github.com/Levon0Asatryan/gradfolio-api/blob/main/docs/tracker.md). Read it first.    |
| Frontend analysis, decisions Q1–Q12               | [`investigation.md`](https://github.com/Levon0Asatryan/gradfolio-api/blob/main/docs/investigation.md) §4, §6 |
| Milestone plans (they cover every repository)     | `mN-plan.md` there                                                                                           |
| How work is handed to a worker chat and reported  | [`handoff-template.md`](https://github.com/Levon0Asatryan/gradfolio-api/blob/main/docs/handoff-template.md)  |
| The HTTP API                                      | `openapi.yaml` in gradfolio-api                                                                              |
| Table definitions                                 | [gradfolio-sql](https://github.com/Levon0Asatryan/gradfolio-sql) `docs/`; the API owns the schema            |
| Product scope and features                        | The feature specification, in the workspace `docs/` folder (not in any repo)                                 |
| Known defects across all three repos              | `issues.md` in the workspace root                                                                            |
