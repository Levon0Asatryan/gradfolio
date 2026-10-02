// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * .claude/workflows/gradfolio-web-review.js decides how many findings are open,
 * and require-review.sh lets a push through only at 0. This runs the real file
 * with fake agents and reads the receipt it asks to have written.
 */
const SOURCE = readFileSync(
  resolve(import.meta.dirname, "../../.claude/workflows/gradfolio-web-review.js"),
  "utf8",
).replace(/^export const meta/m, "const meta");

type Agent = (prompt: string, opts?: { label?: string }) => Promise<unknown>;
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;
const workflow = new AsyncFunction("agent", "pipeline", "phase", "log", SOURCE);

const CHECKS = ["verify", "test:coverage", "knip", "build", "rule-checks"];
const allPass = CHECKS.map((name) => ({ name, ran: true, exitCode: 0, detail: "" }));
const LENSES = ["security", "rendering", "auth", "i18n", "accessibility", "plan", "tests"];
const finding = { file: "src/a.tsx", line: 3, claim: "token in props", failure: "leaks" };

interface Scenario {
  pass0?: unknown;
  lens?: Record<string, unknown>;
  verdict?: string;
  rank?: unknown;
  deferrals?: string[];
}

async function receiptFor(s: Scenario): Promise<Record<string, unknown>> {
  let written = "";
  const agent: Agent = async (prompt, opts) => {
    const label = opts?.label;
    if (!label) {
      return {
        sha: "abc1234",
        files: ["src/a.tsx"],
        diff: "",
        rules: "",
        plan: "",
        contract: "",
        deferrals: s.deferrals ?? [],
      };
    }
    if (label === "pass 0") return "pass0" in s ? s.pass0 : { checks: allPass, ruleMatches: [] };
    if (LENSES.includes(label)) return label in (s.lens ?? {}) ? s.lens?.[label] : { findings: [] };
    if (label === "rank") return s.rank;
    if (label === "write receipt") {
      written = prompt;
      return "ok";
    }
    return { verdict: s.verdict ?? "CONFIRMED", reason: "" };
  };
  const pipeline = (items: unknown[], fn: (x: unknown) => Promise<unknown>) =>
    Promise.all(items.map(fn));
  await workflow(
    agent,
    pipeline,
    () => {},
    () => {},
  );
  const json = written.split("\n").find((l) => l.startsWith("{"));
  if (!json) throw new Error("no receipt was written");
  return JSON.parse(json) as Record<string, unknown>;
}

describe("gradfolio-web-review workflow receipt", () => {
  it("is clean when every check ran and passed and nothing survived", async () => {
    expect((await receiptFor({})).findings_open).toBe(0);
  });

  it("counts a failed check", async () => {
    const checks = allPass.map((c) => (c.name === "build" ? { ...c, exitCode: 1 } : c));
    const r = await receiptFor({ pass0: { checks, ruleMatches: [] } });
    expect(r.findings_open).toBe(1);
    expect(r.pass0_failed).toEqual(["build"]);
  });

  it("counts every check missing from a partial pass 0", async () => {
    const r = await receiptFor({ pass0: { checks: allPass.slice(0, 1), ruleMatches: [] } });
    expect(r.findings_open).toBe(4);
  });

  it("counts a check reported as not run", async () => {
    const checks = allPass.map((c) => (c.name === "knip" ? { ...c, ran: false } : c));
    expect((await receiptFor({ pass0: { checks, ruleMatches: [] } })).findings_open).toBe(1);
  });

  it("counts every check when pass 0 returns nothing", async () => {
    expect((await receiptFor({ pass0: null })).findings_open).toBe(5);
  });

  it("does not count a Check regex match by itself", async () => {
    const ruleMatches = [{ file: "src/testing/x.test.ts", line: 9, message: "git env" }];
    expect((await receiptFor({ pass0: { checks: allPass, ruleMatches } })).findings_open).toBe(0);
  });

  it("counts a lens that returned nothing", async () => {
    expect((await receiptFor({ lens: { auth: null } })).findings_open).toBe(1);
  });

  it("counts a surviving finding, and not a rejected one", async () => {
    const lens = { security: { findings: [finding] } };
    const rank = { findings: [{ ...finding, sources: [0], deferred: false }] };
    expect((await receiptFor({ lens, rank })).findings_open).toBe(1);
    expect((await receiptFor({ lens, verdict: "REJECTED" })).findings_open).toBe(0);
  });

  it("counts a merged pair of findings once", async () => {
    const lens = { security: { findings: [finding] }, auth: { findings: [finding] } };
    const rank = { findings: [{ ...finding, sources: [0, 1], deferred: false }] };
    expect((await receiptFor({ lens, rank })).findings_open).toBe(1);
  });

  it("counts every survivor when the ranking leaves one out", async () => {
    const lens = { security: { findings: [finding, { ...finding, line: 4 }] } };
    const partial = { findings: [{ ...finding, sources: [0], deferred: false }] };
    expect((await receiptFor({ lens, rank: partial })).findings_open).toBe(2);
    expect((await receiptFor({ lens, rank: { findings: [] } })).findings_open).toBe(2);
  });

  it("counts every survivor when the ranking returns nothing", async () => {
    const lens = { security: { findings: [finding, { ...finding, line: 4 }] } };
    expect((await receiptFor({ lens, rank: null })).findings_open).toBe(2);
  });

  it("subtracts a finding only for a deferral gathered from the PR, verbatim", async () => {
    const lens = { security: { findings: [finding] } };
    const recorded = "Deferred: tokens in props, tracker row 2.9";
    const rank = (deferral?: string) => ({
      findings: [{ ...finding, sources: [0], deferred: true, deferral }],
    });
    expect(
      (await receiptFor({ lens, rank: rank(recorded), deferrals: [recorded] })).findings_open,
    ).toBe(0);
    // Invented by the ranking: nothing was gathered.
    expect((await receiptFor({ lens, rank: rank(recorded) })).findings_open).toBe(1);
    // Not the recorded text.
    expect(
      (await receiptFor({ lens, rank: rank("Deferred."), deferrals: [recorded] })).findings_open,
    ).toBe(1);
    expect(
      (await receiptFor({ lens, rank: rank(undefined), deferrals: [recorded] })).findings_open,
    ).toBe(1);
  });
});
