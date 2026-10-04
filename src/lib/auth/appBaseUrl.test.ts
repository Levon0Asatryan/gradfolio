import { describe, expect, it } from "vitest";
import { previewAppBaseUrl } from "./appBaseUrl";

const host = "gradfolio-git-m3-preview-login-levons-projects-4fb86c2e.vercel.app";

describe("previewAppBaseUrl", () => {
  it("uses the branch host on a preview", () => {
    expect(previewAppBaseUrl({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: host })).toBe(
      `https://${host}`,
    );
  });

  it.each(["production", "development", undefined])("leaves %s to APP_BASE_URL", (vercelEnv) => {
    expect(previewAppBaseUrl({ VERCEL_ENV: vercelEnv, VERCEL_BRANCH_URL: host })).toBeUndefined();
  });

  it.each([undefined, "", "evil.example.com", "a.vercel.app/path", "https://a.vercel.app"])(
    "ignores a missing or malformed branch host (%s)",
    (branchUrl) => {
      expect(
        previewAppBaseUrl({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: branchUrl }),
      ).toBeUndefined();
    },
  );
});
