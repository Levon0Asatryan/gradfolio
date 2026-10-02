# .review: gradfolio-web's own review rule corpus

Rules mined from this repository's own pull-request reviews. Read by
`/gradfolio-web-review` (`.claude/skills/gradfolio-web-review/`) and its workflow.

**Sealed to this repository.** Rules are written here, read here, and never mixed
with any personal or work corpus elsewhere on the machine. A rule from another
stack or employer argues against this project's own decisions. `stacks` pins
review-plugin stack detection to `gradfolio-web` for that reason (the API uses `gradfolio`).

## Keeping it alive

- A finding that **recurs**, or that cost a real defect, becomes a rule — with its
  `**Why:**` and the source PR numbers.
- Rules are numbered and **never renumbered**; a deleted rule's number is retired.
- A rule nobody has fought with for a milestone or two is deleted.
- At each milestone close, **mine the new PRs again** rather than writing rules
  from memory:
  `gh api repos/Levon0Asatryan/gradfolio/pulls/<n>/comments --paginate`
  and `…/pulls/<n>/reviews`; cluster by defect shape; one rule per cluster seen
  twice or that cost a defect.
- Group by _what goes wrong_, not by file.
- Standing, pre-verified project facts (Next.js and Auth0 behaviour, the security surface) live in
  `AGENTS.md`, not here. This corpus holds what review actually caught.

## Rule format

```markdown
### N. Imperative title — what to do

One or two sentences.

**Why:** the real finding(s) it came from, with PR numbers, and what it cost.

**Tags:** `concern:…` `layer:…` `severity:must|should`
**Check:** [ext] `ERE regex` :: remediation message (only when mechanical)
**Relates:** complements #M
**Sources:** #PRs
```

## Local files (gitignored)

- `.last-review.json` — the receipt `scripts/require-review.sh` checks on push.
- `violations.jsonl` — scratch output of mechanical checks.
