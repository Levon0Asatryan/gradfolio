// @vitest-environment node
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

/**
 * Ported from gradfolio-api (src/testing/review-status.test.ts at 2674fef).
 * scripts/review-status.sh is the merge gate's evidence, so its judgement is
 * tested: it runs against a fake `gh` that serves fixture JSON through the real
 * `jq`, so the script's own filters are what decides.
 */
const SCRIPT = resolve(import.meta.dirname, "../../scripts/review-status.sh");
const HEAD = "abc1234def5678900000000000000000000000000";
const OLD = "1111111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

interface Fixture {
  reviews?: { user: string; commit: string; body?: string }[];
  comments?: { id: number; user: string; body: string }[];
  commentReactions?: Record<number, { user: string; content: string }[]>;
  prReactions?: { user: string; content: string }[];
}

const FAKE_GH = `#!/bin/sh
# Minimal gh: the subcommands review-status.sh uses, answered from $FIXTURES.
filter=""; path=""; mode=""
while [ $# -gt 0 ]; do
  case "$1" in
    pr) mode=pr ;; repo) mode=repo ;; api) mode=api; shift; path="$1" ;;
    --jq) shift; filter="$1" ;;
  esac
  shift
done
case "$mode" in
  repo) echo "o/r"; exit 0 ;;
  pr) jq -r "$filter" "$FIXTURES/pr.json"; exit 0 ;;
esac
case "$path" in */commits/*) echo '{"commit":{"committer":{"date":"2026-09-29T09:00:00Z"}}}' | jq -r "$filter"; exit 0 ;; esac
file="$FIXTURES/$(printf '%s' "$path" | tr '/' '_').json"
[ -f "$file" ] || echo '[]' > "$file"
jq -r "$filter" "$file"
`;

let dir: string | undefined;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

function run(f: Fixture): { out: string; code: number } {
  dir = mkdtempSync(join(tmpdir(), "review-status-"));
  const bin = join(dir, "bin");
  const fixtures = join(dir, "fx");
  execFileSync("mkdir", ["-p", bin, fixtures]);
  writeFileSync(join(bin, "gh"), FAKE_GH);
  chmodSync(join(bin, "gh"), 0o755);

  const put = (path: string, data: unknown) =>
    writeFileSync(join(fixtures, `${path.replaceAll("/", "_")}.json`), JSON.stringify(data));
  writeFileSync(join(fixtures, "pr.json"), JSON.stringify({ number: 7, headRefOid: HEAD }));
  put(
    "repos/o/r/pulls/7/reviews",
    (f.reviews ?? []).map((r, i) => ({
      id: i + 1,
      user: { login: r.user },
      commit_id: r.commit,
      body: r.body ?? "",
    })),
  );
  put(
    "repos/o/r/issues/7/comments",
    // Every comment is timestamped after the request, and every reaction after
    // that, so an answer judged by time alone would pass: the tests show the
    // script ties answers to the head instead.
    (f.comments ?? []).map((c, i) => ({
      id: c.id,
      user: { login: c.user },
      body: c.body,
      created_at: `2026-09-29T10:0${i}:00Z`,
    })),
  );
  put(
    "repos/o/r/issues/7/reactions",
    (f.prReactions ?? []).map((r, i) => ({
      id: i + 1,
      user: { login: r.user },
      content: r.content,
      created_at: "2026-09-29T11:00:00Z",
    })),
  );
  for (const [id, reactions] of Object.entries(f.commentReactions ?? {})) {
    put(
      `repos/o/r/issues/comments/${id}/reactions`,
      reactions.map((r, i) => ({
        id: i + 1,
        user: { login: r.user },
        content: r.content,
        created_at: "2026-09-29T11:00:00Z",
      })),
    );
  }

  try {
    const out = execFileSync("sh", [SCRIPT, "7"], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}`, FIXTURES: fixtures },
      encoding: "utf8",
    });
    return { out, code: 0 };
  } catch (err) {
    const e = err as { stdout: string; status: number };
    return { out: e.stdout, code: e.status };
  }
}

const COPILOT = "copilot-pull-request-reviewer[bot]";
const CODEX = "chatgpt-codex-connector[bot]";
const QUOTA =
  "Copilot was unable to review this pull request because the user who requested the review has reached their quota limit.";
const copilotOk = { user: COPILOT, commit: HEAD, body: "## Pull request overview" };
const codexOk = { user: CODEX, commit: HEAD, body: "### 💡 Codex Review" };

describe("review-status.sh", () => {
  it("passes only when both reviewed the head", () => {
    const r = run({ reviews: [copilotOk, codexOk] });
    expect(r.code).toBe(0);
    expect(r.out).toContain("Copilot: reviewed abc1234");
    expect(r.out).toContain("Codex:   reviewed abc1234 (review)");
  });

  it("does not count a Copilot quota failure as a review", () => {
    const r = run({ reviews: [{ user: COPILOT, commit: HEAD, body: QUOTA }, codexOk] });
    expect(r.code).toBe(1);
    expect(r.out).toContain("Copilot: FAILED on abc1234");
  });

  it("does not count a review of an older head", () => {
    const r = run({
      reviews: [
        { ...copilotOk, commit: OLD },
        { ...codexOk, commit: OLD },
      ],
    });
    expect(r.code).toBe(1);
    expect(r.out).toContain("Copilot: NOT yet reviewed");
    expect(r.out).toContain("Codex:   NOT yet reviewed");
  });

  it("accepts a Codex no-findings comment that names this head", () => {
    const r = run({
      reviews: [copilotOk],
      comments: [
        {
          id: 50,
          user: CODEX,
          body: "Codex Review: Didn't find any major issues. Nice!\n\n**Reviewed commit:** `abc1234def`",
        },
      ],
    });
    expect(r.code).toBe(0);
    expect(r.out).toContain("(no findings)");
  });

  it("rejects a Codex no-findings comment for a different head", () => {
    const r = run({
      reviews: [copilotOk],
      comments: [
        { id: 40, user: "Levon0Asatryan", body: "@codex review -- head `abc1234`." },
        {
          id: 50,
          user: CODEX,
          body: "Codex Review: Didn't find any major issues.\n\n**Reviewed commit:** `1111111aaa`",
        },
      ],
    });
    expect(r.code).toBe(1);
  });

  it("accepts a Codex 👍 on the request comment that names this head", () => {
    const r = run({
      reviews: [copilotOk],
      comments: [{ id: 60, user: "Levon0Asatryan", body: "@codex review -- head `abc1234`." }],
      commentReactions: { 60: [{ user: CODEX, content: "+1" }] },
    });
    expect(r.code).toBe(0);
    expect(r.out).toContain("👍 on the request");
  });

  it("rejects a Codex 👍 on the request for an older head", () => {
    const r = run({
      reviews: [copilotOk],
      comments: [{ id: 60, user: "Levon0Asatryan", body: "@codex review -- head `1111111`." }],
      commentReactions: { 60: [{ user: CODEX, content: "+1" }] },
    });
    expect(r.code).toBe(1);
  });

  it("rejects a PR-level Codex 👍, which names no commit", () => {
    const r = run({
      reviews: [copilotOk],
      comments: [{ id: 60, user: "Levon0Asatryan", body: "@codex review -- head `abc1234`." }],
      prReactions: [{ user: CODEX, content: "+1" }],
    });
    expect(r.code).toBe(1);
  });

  it("treats 👀 as still reviewing", () => {
    const r = run({
      reviews: [copilotOk],
      comments: [{ id: 60, user: "Levon0Asatryan", body: "@codex review -- head `abc1234`." }],
      commentReactions: { 60: [{ user: CODEX, content: "eyes" }] },
    });
    expect(r.code).toBe(1);
  });
});
