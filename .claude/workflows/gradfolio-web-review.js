export const meta = {
  name: "gradfolio-web-review",
  description:
    "Adversarial pre-push review: the mechanical gate, then independent reviewers by lens, each finding attacked by a separate agent, then ranked. Writes .review/.last-review.json; the pre-push gate passes only when nothing is left open.",
  phases: ["Gather", "Mechanical", "Review by lens", "Attack the findings", "Rank and record"],
};

// The open count is computed here, not by an agent, so a receipt cannot say
// clean by omission. Tested by src/testing/review-workflow.test.ts, which runs
// this file with fake agents.

phase("Gather");

const ctx = await agent(
  `Collect the review context for the current branch. Do not review anything yet.
Return: the diff against origin/main (paths and full patch), the contents of
.review/rules/gradfolio-web.md, the plan this branch implements if one applies
(docs/*-plan.md here, or ../gradfolio-api/docs/mN-plan.md), the "Code Review Rules"
section of AGENTS.md, the current HEAD sha, and the deferrals recorded in this
branch's pull request, if it has one: each review-thread reply or PR comment by
the author that defers a finding ("Deferred …") with its proposed tracker row,
quoted with the finding it answers. No pull request means no deferrals.`,
  {
    schema: {
      type: "object",
      required: ["sha", "files", "diff", "rules", "plan", "contract", "deferrals"],
      properties: {
        sha: { type: "string" },
        files: { type: "array", items: { type: "string" } },
        diff: { type: "string" },
        rules: { type: "string" },
        plan: { type: "string" },
        contract: { type: "string" },
        deferrals: { type: "array", items: { type: "string" } },
      },
    },
  },
);

if (!ctx) return "Could not gather the branch context; nothing reviewed.";

phase("Mechanical");

// Pass 0 of the skill. Every required check must report that it ran and how it
// exited: a check missing from the answer did not run, and a check that did not
// run is not clean.
const REQUIRED = ["verify", "test:coverage", "knip", "build", "rule-checks"];

const mechanical = await agent(
  `Run these from the repository root, one at a time, and report each one's exit
code: npm run verify; npm run test:coverage; npm run knip; npm run build (names:
"verify", "test:coverage", "knip", "build"). Then apply every "**Check:**" regex in
.review/rules/gradfolio-web.md to the changed files (${ctx.files.length} files) and
report it as the check "rule-checks" (exit 0 when the scan completed), with each
match listed separately. Report a check you could not run with ran: false. Change
nothing.`,
  {
    label: "pass 0",
    schema: {
      type: "object",
      required: ["checks", "ruleMatches"],
      properties: {
        checks: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "ran", "exitCode", "detail"],
            properties: {
              name: { type: "string" },
              ran: { type: "boolean" },
              exitCode: { type: "number" },
              detail: { type: "string" },
            },
          },
        },
        ruleMatches: {
          type: "array",
          items: {
            type: "object",
            required: ["file", "line", "message"],
            properties: {
              file: { type: "string" },
              line: { type: "number" },
              message: { type: "string" },
            },
          },
        },
      },
    },
  },
);

const failedChecks = REQUIRED.filter((name) => {
  const check = mechanical?.checks.find((c) => c.name === name);
  return !check || !check.ran || check.exitCode !== 0;
});
if (failedChecks.length) log(`pass 0 not clean: ${failedChecks.join(", ")}`);

// A Check regex is a pointer, not a verdict: a match can be correct code. The
// lenses judge each match like any other line of the diff.
const ruleMatches = (mechanical?.ruleMatches ?? [])
  .map((m) => `${m.file}:${m.line} ${m.message}`)
  .join("\n");

const lenses = [
  {
    label: "security",
    brief:
      'User HTML rendered only after an allow-list sanitizer (the regex sanitize in ProjectDescription.tsx does not count, F1). Auth0 tokens never in client components, props crossing into "use client", browser storage, URLs or logs. API called from the Next.js server only. Server actions and route handlers take the caller from the session, never an argument. User URLs scheme-checked; no open redirects; no user data in a shared cache.',
  },
  {
    label: "rendering",
    brief:
      'Server/client boundary: what each "use client" import pulls into the bundle, what each prop serializes into the HTML. Hydration mismatches the user sees (dates, time zones, random values). API errors shown as errors, never as empty states. User strings never built into a RegExp or selector unescaped (F7). Edits never lost silently.',
  },
  {
    label: "auth",
    brief:
      "Route policy (tracker 2.10): which routes are public, which require login. The middleware fails closed (F2) and its matcher covers every protected route. Authorization UI (hidden buttons, isOwnProfile) is never the guard. No hardcoded current user (F3).",
  },
  {
    label: "i18n",
    brief:
      "Every new user-facing string (JSX text, aria-label, title, placeholder, alt) exists in en, ru and am. Placeholders ({name}, {count}) intact in every language. No sentences assembled from translated fragments in English word order.",
  },
  {
    label: "accessibility",
    brief:
      "Interactive elements are buttons or links, or have a role, keyboard handling and focus. Every control and image has an accessible name. Dialogs move and return focus; no keyboard traps; visible focus. No information by colour alone; WCAG AA contrast in light and dark.",
  },
  {
    label: "plan",
    brief:
      "Trace each changed page from request to pixels: route policy and middleware, the server component, route handler or server action, where the caller comes from (the session), what it asks the API for and with which token, what crosses into client components, what is rendered. Then walk the plan's normative sentences (must, is excluded from, is anchored on) and point at the implementing line; a sentence with no line is a finding.",
  },
  {
    label: "tests",
    brief:
      "Tests that cannot fail: for every guard name the test and what removing it breaks. Assertions on what the user sees (role, text, label), not implementation detail. No focused or skipped tests. Tests that run git or hook scripts drop inherited GIT_* variables.",
  },
];

phase("Review by lens");

const reviews = await pipeline(lenses, (lens) =>
  agent(
    `You are reviewing one lens of a gradfolio (Next.js frontend) branch: ${lens.label}.
${lens.brief}
Report ONLY what the severity contract allows. One finding per defect. For
each: file:line, one sentence, and the concrete failure. Cite any fact you
assert. Finding nothing is a valid answer.

HEAD: ${ctx.sha}
Changed files:
${ctx.files.join("\n")}
Rules corpus:
${ctx.rules}
Lines the corpus's Check regexes matched (pointers: judge each, most are fine):
${ruleMatches || "none"}
Severity contract:
${ctx.contract}
Plan:
${ctx.plan}
Diff:
${ctx.diff}`,
    {
      label: lens.label,
      schema: {
        type: "object",
        required: ["findings"],
        properties: {
          findings: {
            type: "array",
            items: {
              type: "object",
              required: ["file", "line", "claim", "failure"],
              properties: {
                file: { type: "string" },
                line: { type: "number" },
                claim: { type: "string" },
                failure: { type: "string" },
                rule: { type: "string" },
              },
            },
          },
        },
      },
    },
  ),
);

// Index-aligned with `lenses`: a failed agent resolves to null and must keep
// its slot, or every later finding is attributed to the wrong lens.
const found = reviews.flatMap((r, i) =>
  (r?.findings ?? []).map((f) => ({ ...f, lens: lenses[i].label })),
);

// A lens that returned nothing did not review its part; that is open, not clean.
const lost = reviews.filter((r) => !r).length;
if (lost > 0)
  log(`${lost} of ${lenses.length} lenses returned nothing; each counts as an open finding.`);

phase("Attack the findings");

const verdicts = await pipeline(found, (f) =>
  agent(
    `Try to knock this review finding down. You did not write it.
FINDING (${f.lens}) ${f.file}:${f.line}
${f.claim}
Failure claimed: ${f.failure}
Read the code. Is the premise true (verify against source or node_modules, not memory)? Does
the failure follow — construct the input? Is it excluded by the severity
contract? Return CONFIRMED only when you built the failing case, PLAUSIBLE when
real but unconstructed, REJECTED with the reason otherwise.`,
    {
      label: `${f.file}:${f.line}`,
      schema: {
        type: "object",
        required: ["verdict", "reason"],
        properties: {
          verdict: { type: "string", enum: ["CONFIRMED", "PLAUSIBLE", "REJECTED"] },
          reason: { type: "string" },
        },
      },
    },
  ),
);

const survived = found
  .map((f, i) => ({ ...f, ...(verdicts[i] ?? { verdict: "PLAUSIBLE", reason: "not attacked" }) }))
  .filter((f) => f.verdict !== "REJECTED");

phase("Rank and record");

const ranked = survived.length
  ? await agent(
      `Rank these surviving findings, most severe first, and merge ones that are the
same defect seen through two lenses. Mark a finding deferred ONLY when one of the
recorded deferrals below answers that same defect, and quote that deferral. Do not
write any file.
Recorded deferrals:
${ctx.deferrals.length ? ctx.deferrals.join("\n") : "none"}
Findings:
${JSON.stringify(survived, null, 2)}`,
      {
        label: "rank",
        schema: {
          type: "object",
          required: ["findings"],
          properties: {
            findings: {
              type: "array",
              items: {
                type: "object",
                required: ["file", "line", "claim", "deferred"],
                properties: {
                  file: { type: "string" },
                  line: { type: "number" },
                  claim: { type: "string" },
                  deferred: { type: "boolean" },
                  deferral: { type: "string" },
                },
              },
            },
          },
        },
      },
    )
  : { findings: [] };

// Without a ranking nothing can be merged or matched to a deferral, so every
// surviving finding counts as open. A deferral must quote what it answers.
const openFindings = ranked
  ? ranked.findings.filter((f) => !(f.deferred && f.deferral)).length
  : survived.length;
const deferred = ranked ? ranked.findings.length - openFindings : 0;
const findingsOpen = openFindings + failedChecks.length + lost;

const receipt = {
  sha: ctx.sha,
  at: "<ISO timestamp>",
  findings_open: findingsOpen,
  method: "gradfolio-web-review-workflow",
  lenses: lenses.length,
  attacked: found.length,
  rejected: found.length - survived.length,
  deferred,
  pass0_failed: failedChecks,
  lenses_lost: lost,
};

const report = await agent(
  `Write .review/.last-review.json containing exactly this JSON, with "<ISO timestamp>"
replaced by the output of \`date -u +%FT%TZ\`. Change no other value.
${JSON.stringify(receipt)}
Then return the ranked findings, the pass 0 result and one line on the receipt.
Ranked findings:
${JSON.stringify(ranked?.findings ?? survived, null, 2)}`,
  { label: "write receipt" },
);

return report ?? "Review ran but the receipt agent returned nothing; receipt not written.";
