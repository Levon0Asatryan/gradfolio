// @vitest-environment node
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * Production broke on this: every project page answered 500 on Vercel because jsdom 30
 * (through isomorphic-dompurify) needs `require()` of an ES module (`@exodus/bytes`),
 * which Vercel's Node runtime does not allow. Vitest runs with it allowed, so a unit test
 * cannot see it; this one starts a plain Node with `require(esm)` switched off, as Vercel
 * has it, and loads the server sanitizer's dependency tree.
 */
describe("the server sanitizer's dependency tree", () => {
  it("loads and sanitizes where require() of an ES module is not allowed", () => {
    const out = execFileSync(
      process.execPath,
      [
        "--no-experimental-require-module",
        "-e",
        `const P = require("isomorphic-dompurify");
         process.stdout.write(P.sanitize('<p onclick="x">ok</p><script>1</script>'));`,
      ],
      { encoding: "utf8", cwd: process.cwd(), env: { ...process.env } },
    );
    expect(out).toBe("<p>ok</p>");
  });
});
