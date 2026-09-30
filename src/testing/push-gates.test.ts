// @vitest-environment node
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * The pre-push gates and request-review.sh, run against a throwaway
 * repository. As the hook, git hands the gates the refs being pushed on stdin;
 * these tests feed that stdin, so what is judged is the pushed ref, not the
 * checked-out branch.
 */
const CHECK_BRANCH = resolve(import.meta.dirname, "../../scripts/check-branch.sh");
const REQUIRE_REVIEW = resolve(import.meta.dirname, "../../scripts/require-review.sh");
const REQUEST_REVIEW = resolve(import.meta.dirname, "../../scripts/request-review.sh");
const ZERO = "0".repeat(40);

// The gh calls the scripts make, answered from $FIXTURES:
//   pr view <branch> --json state         -> state-<branch>
//   pr view <n> --json headRefName        -> head-branch
//   pr view <n> --json headRefOid         -> old-head for the first
//                                            <stale-calls> calls, then new-head
//   pr edit / pr comment --body <b>       -> appended to log
const FAKE_GH = `#!/bin/sh
fx="$FIXTURES"
case "$1 $2" in
  "pr view")
    case "$5" in
      state) f="$fx/state-$(printf '%s' "$3" | tr '/' '_')"; [ -f "$f" ] && cat "$f" || exit 1 ;;
      headRefName) cat "$fx/head-branch" ;;
      headRefOid)
        n=$(($(cat "$fx/calls" 2>/dev/null || echo 0) + 1)); echo "$n" > "$fx/calls"
        if [ "$n" -le "$(cat "$fx/stale-calls" 2>/dev/null || echo 0)" ]; then cat "$fx/old-head"; else cat "$fx/new-head"; fi ;;
    esac ;;
  "pr edit") echo "edit" >> "$fx/log" ;;
  "pr comment") printf '%s\\n' "$5" >> "$fx/log" ;;
esac
`;

let dir: string;
let bin: string;
let fixtures: string;

// Inside a git hook (pre-commit and pre-push both run the tests), git exports
// GIT_DIR, GIT_INDEX_FILE and friends. Inherited, they point every git call
// here at the real repository instead of the throwaway one: that once
// re-initialised it as bare, moved a branch and rewrote origin/main. Drop them.
const outsideGit = { ...process.env };
for (const k of Object.keys(outsideGit)) if (k.startsWith("GIT_")) delete outsideGit[k];

const env = () => ({
  ...outsideGit,
  PATH: `${bin}:${process.env.PATH ?? ""}`,
  FIXTURES: fixtures,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  SKIP_REVIEW_GATE: "",
});

const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: dir, env: env(), encoding: "utf8" }).trim();

function commit(path: string): string {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), `${path} ${Math.random()}\n`);
  git("add", path);
  git("commit", "-q", "-m", path);
  return git("rev-parse", "HEAD");
}

const prState = (branch: string, state: string) =>
  writeFileSync(join(fixtures, `state-${branch.replaceAll("/", "_")}`), state);

const receipt = (sha: string, open = 0) => {
  mkdirSync(join(dir, ".review"), { recursive: true });
  writeFileSync(
    join(dir, ".review/.last-review.json"),
    JSON.stringify({ sha, at: "2026-09-30T00:00:00Z", findings_open: open, method: "test" }),
  );
};

/** Runs a gate with `stdin` as git would write it; "" is a run by hand. */
function gate(
  script: string,
  stdin: string,
  args: string[] = [],
  extraEnv: Record<string, string> = {},
): { code: number; err: string } {
  try {
    execFileSync("sh", [script, ...args], {
      cwd: dir,
      env: { ...env(), ...extraEnv },
      input: stdin,
      stdio: "pipe",
    });
    return { code: 0, err: "" };
  } catch (e) {
    const x = e as { status: number; stderr: Buffer };
    return { code: x.status, err: x.stderr.toString() };
  }
}

const push = (localOid: string, remoteBranch: string) =>
  `refs/heads/x ${localOid} refs/heads/${remoteBranch} ${ZERO}\n`;

let base: string;
let feat: string;
let other: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "push-gates-"));
  bin = join(dir, ".bin");
  fixtures = join(dir, ".fx");
  mkdirSync(bin);
  mkdirSync(fixtures);
  writeFileSync(join(bin, "gh"), FAKE_GH);
  chmodSync(join(bin, "gh"), 0o755);

  // Never write to a repository other than the throwaway one: nothing may say
  // where the repository is before `git init`, and after it git must resolve here.
  const leaked = Object.keys(env()).filter((k) =>
    /^GIT_(DIR|INDEX_FILE|WORK_TREE|COMMON_DIR)$/.test(k),
  );
  if (leaked.length) throw new Error(`refusing to run git with ${leaked.join(", ")} set`);
  git("init", "-q", "-b", "main");
  const top = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
    cwd: dir,
    env: env(),
    encoding: "utf8",
  }).trim();
  if (realpathSync(top) !== realpathSync(join(dir, ".git"))) {
    throw new Error(`git resolves to ${top}, not the test repository; refusing to continue`);
  }
  git("config", "core.hooksPath", "/dev/null");
  writeFileSync(join(dir, ".gitignore"), ".bin/\n.fx/\n.review/\n");
  base = commit("README.md");
  git("update-ref", "refs/remotes/origin/main", base);
  git("checkout", "-q", "-b", "other");
  other = commit("src/other.ts");
  git("checkout", "-q", "-b", "feat", base);
  feat = commit("src/feat.ts");
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("check-branch.sh", () => {
  it("refuses pushing to main from a feature branch (HEAD:main)", () => {
    const r = gate(CHECK_BRANCH, push(feat, "main"));
    expect(r.code).toBe(1);
    expect(r.err).toContain("pushing to 'main'");
  });

  it("refuses pushing to a branch whose PR is merged, whatever is checked out", () => {
    prState("feat", "OPEN");
    prState("old/done", "MERGED");
    const r = gate(CHECK_BRANCH, push(other, "old/done"));
    expect(r.code).toBe(1);
    expect(r.err).toContain("'old/done' has a MERGED pull request");
  });

  it("allows pushing a branch with an open PR or none", () => {
    prState("feat", "OPEN");
    expect(gate(CHECK_BRANCH, push(feat, "feat")).code).toBe(0);
    expect(gate(CHECK_BRANCH, push(other, "other")).code).toBe(0);
  });

  it("allows deleting a remote branch", () => {
    prState("old/done", "MERGED");
    expect(gate(CHECK_BRANCH, `(delete) ${ZERO} refs/heads/old/done ${other}\n`).code).toBe(0);
  });

  it("run by hand, judges the checked-out branch", () => {
    prState("feat", "CLOSED");
    expect(gate(CHECK_BRANCH, "").code).toBe(1);
    git("checkout", "-q", "main");
    expect(gate(CHECK_BRANCH, "").code).toBe(1);
  });
});

describe("require-review.sh", () => {
  it("passes a push of HEAD with a clean receipt for HEAD", () => {
    receipt(feat);
    expect(gate(REQUIRE_REVIEW, push(feat, "feat")).code).toBe(0);
  });

  it("refuses a push of another commit, even with a clean receipt for HEAD", () => {
    receipt(feat);
    const r = gate(REQUIRE_REVIEW, push(other, "other"));
    expect(r.code).toBe(1);
    expect(r.err).toContain("which is not HEAD");
  });

  it("refuses a code push without a receipt, or with one for another commit", () => {
    expect(gate(REQUIRE_REVIEW, push(feat, "feat")).code).toBe(1);
    receipt(base);
    expect(gate(REQUIRE_REVIEW, push(feat, "feat")).err).toContain("the review receipt is for");
  });

  it("refuses a receipt with open findings", () => {
    receipt(feat, 2);
    expect(gate(REQUIRE_REVIEW, push(feat, "feat")).err).toContain("2 finding(s) open");
  });

  it("passes a docs-only push without a receipt", () => {
    git("checkout", "-q", "-b", "docs", base);
    const docs = commit("docs/notes.md");
    expect(gate(REQUIRE_REVIEW, push(docs, "docs")).code).toBe(0);
  });

  it("run by hand, judges HEAD", () => {
    receipt(feat);
    expect(gate(REQUIRE_REVIEW, "").code).toBe(0);
    receipt(base);
    expect(gate(REQUIRE_REVIEW, "").code).toBe(1);
  });
});

describe("request-review.sh", () => {
  const fx = (name: string, value: string) => writeFileSync(join(fixtures, name), value);
  const log = () => {
    try {
      return readFileSync(join(fixtures, "log"), "utf8");
    } catch {
      return "";
    }
  };

  it("waits until GitHub reports this checkout's HEAD, then names it", () => {
    fx("head-branch", "feat");
    fx("old-head", base);
    fx("new-head", feat);
    fx("stale-calls", "2");
    expect(gate(REQUEST_REVIEW, "", ["7"]).code).toBe(0);
    expect(log()).toContain(`head \`${feat.slice(0, 7)}\``);
    expect(log()).not.toContain(base.slice(0, 7));
  });

  it("gives up without requesting anything if GitHub never catches up", () => {
    fx("head-branch", "feat");
    fx("old-head", base);
    fx("new-head", feat);
    fx("stale-calls", "999");
    const r = gate(REQUEST_REVIEW, "", ["7"], { REQUEST_REVIEW_WAIT_S: "1" });
    expect(r.code).toBe(1);
    expect(r.err).toContain("Push first");
    expect(log()).toBe("");
  });

  it("uses GitHub's head as is for another branch's PR", () => {
    fx("head-branch", "other");
    fx("new-head", other);
    expect(gate(REQUEST_REVIEW, "", ["7"]).code).toBe(0);
    expect(log()).toContain(`head \`${other.slice(0, 7)}\``);
  });
});
