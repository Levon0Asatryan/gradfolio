import { describe, expect, it } from "vitest";
import { siteUrl } from "./siteUrl";

describe("siteUrl", () => {
  it("is APP_BASE_URL, and the first of a list", () => {
    expect(siteUrl({ APP_BASE_URL: "https://gradfolio.example" })?.href).toBe(
      "https://gradfolio.example/",
    );
    expect(siteUrl({ APP_BASE_URL: "https://a.example, https://b.example" })?.host).toBe(
      "a.example",
    );
  });

  it("is the branch host on a preview", () => {
    expect(
      siteUrl({
        APP_BASE_URL: "https://gradfolio.example",
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "gradfolio-git-x.vercel.app",
      })?.host,
    ).toBe("gradfolio-git-x.vercel.app");
  });

  it("is undefined for nothing, a bad value, or a scheme that is not http(s)", () => {
    expect(siteUrl({})).toBeUndefined();
    expect(siteUrl({ APP_BASE_URL: "not a url" })).toBeUndefined();
    expect(siteUrl({ APP_BASE_URL: "javascript:alert(1)" })).toBeUndefined();
  });
});
