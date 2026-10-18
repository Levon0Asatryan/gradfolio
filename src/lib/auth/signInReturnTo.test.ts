import { describe, expect, it } from "vitest";
import { signInReturnTo } from "./signInReturnTo";

describe("sign-in return destination", () => {
  it.each([
    "/account",
    "/projects/new?draft=1",
    "/integrations/github/callback?code=a&state=b",
    "/teams",
    "/projects/abc/edit",
  ])("retains personal path %s", (path) => {
    expect(signInReturnTo(path)).toBe(path);
  });
  it.each([
    undefined,
    ["/account"],
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/auth/logout",
    "/sign-in",
    "/search",
    " /account",
    "/account\n",
  ])("rejects external, ambiguous, and looping destinations %s", (path) => {
    expect(signInReturnTo(path)).toBe("/");
  });
});
