// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const constructed = vi.hoisted(() => ({ options: undefined as unknown }));
vi.mock("@auth0/nextjs-auth0/server", () => ({
  Auth0Client: class {
    constructor(options: unknown) {
      constructed.options = options;
    }
  },
}));

describe("the Auth0 client options", () => {
  it("keeps the access token server-side, refreshes early and asks for the API audience", async () => {
    vi.stubEnv("AUTH0_AUDIENCE", "https://api.gradfolio.app");
    vi.stubEnv("AUTH0_SCOPE", "openid profile email offline_access");
    await import("./auth0");
    expect(constructed.options).toEqual({
      appBaseUrl: undefined,
      authorizationParameters: {
        scope: "openid profile email offline_access",
        audience: "https://api.gradfolio.app",
      },
      // Q11: no /auth/access-token route handing the token to browser scripts.
      enableAccessTokenEndpoint: false,
      tokenRefreshBuffer: 60,
    });
    vi.unstubAllEnvs();
  });

  it("pins the base URL to the branch host on a preview", async () => {
    vi.resetModules();
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_BRANCH_URL", "gradfolio-git-x-levons-projects-4fb86c2e.vercel.app");
    await import("./auth0");
    expect(constructed.options).toMatchObject({
      appBaseUrl: "https://gradfolio-git-x-levons-projects-4fb86c2e.vercel.app",
    });
    vi.unstubAllEnvs();
  });
});
