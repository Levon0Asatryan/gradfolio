import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots.txt", () => {
  it("keeps crawlers out of the auth routes, the API routes and the owner's pages", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    const disallow = ([] as string[]).concat(rule?.disallow ?? []);
    for (const path of ["/auth/", "/api/", "/account", "/teams", "/projects/new"]) {
      expect(disallow).toContain(path);
    }
    // Search and tag pages are public: nothing here blocks them.
    expect(disallow).not.toContain("/search");
    expect(disallow).not.toContain("/tags");
  });
});
