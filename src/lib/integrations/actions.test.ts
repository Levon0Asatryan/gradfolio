// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  set: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.set }) }));
vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
      readonly details?: unknown,
      readonly retryAfter?: number,
    ) {
      super(message);
    }
  }
  return { ApiError, connectGithub: mocks.connect, disconnectGithub: mocks.disconnect };
});

const { startGithubConnectAction, disconnectGithubAction } = await import("./actions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AUTH0_DOMAIN", "tenant.us.auth0.com");
  vi.stubEnv("AUTH0_CLIENT_ID", "cid");
  vi.stubEnv("APP_BASE_URL", "https://app.example");
  vi.stubEnv("VERCEL_ENV", "");
});

describe("startGithubConnectAction", () => {
  it("returns the authorize URL and sets the one-time state in an HttpOnly cookie", async () => {
    mocks.connect.mockResolvedValue({
      state: "link_required",
      nonce: "NONCE",
      expiresAt: "2026-10-15T10:10:00Z",
    });
    const result = await startGithubConnectAction();
    if (!result.ok || result.state !== "redirect") throw new Error("expected a redirect");
    const url = new URL(result.url);
    expect(url.origin).toBe("https://tenant.us.auth0.com");
    expect(url.searchParams.get("nonce")).toBe("NONCE");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://app.example/integrations/github/callback",
    );
    const [name, value, options] = mocks.set.mock.calls[0]!;
    expect(name).toBe("gh_link_state");
    expect(url.searchParams.get("state")).toBe(value);
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/integrations/github",
    });
  });

  it("does not leave the page when GitHub is already connected", async () => {
    mocks.connect.mockResolvedValue({ state: "connected", login: "ani-p" });
    expect(await startGithubConnectAction()).toEqual({
      ok: true,
      state: "connected",
      login: "ani-p",
    });
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("without Auth0 configuration it fails before asking the API for a nonce", async () => {
    vi.stubEnv("AUTH0_DOMAIN", "https://tenant.us.auth0.com");
    expect(await startGithubConnectAction()).toEqual({
      ok: false,
      code: "INTEGRATION_UNAVAILABLE",
    });
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("passes the API's code and Retry-After through", async () => {
    mocks.connect.mockRejectedValue(
      new ApiError(429, "GITHUB_RATE_LIMITED", "wait", undefined, 30),
    );
    expect(await startGithubConnectAction()).toEqual({
      ok: false,
      code: "GITHUB_RATE_LIMITED",
      retryAfter: 30,
    });
  });

  it("leaves no cookie when the API refuses", async () => {
    mocks.connect.mockRejectedValue(new ApiError(409, "GITHUB_ACCOUNT_IN_USE", "x"));
    await startGithubConnectAction();
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("rethrows what is not an API error", async () => {
    mocks.connect.mockRejectedValue(new TypeError("bug"));
    await expect(startGithubConnectAction()).rejects.toThrow("bug");
  });
});

describe("disconnectGithubAction", () => {
  it("is ok on success", async () => {
    mocks.disconnect.mockResolvedValue({ status: "not_connected" });
    expect(await disconnectGithubAction()).toEqual({ ok: true });
  });
  it("keeps the ambiguous code distinct from a refusal", async () => {
    mocks.disconnect.mockRejectedValue(new ApiError(502, "GITHUB_REVOKE_FAILED", "x"));
    expect(await disconnectGithubAction()).toEqual({ ok: false, code: "GITHUB_REVOKE_FAILED" });
    mocks.disconnect.mockRejectedValue(new ApiError(409, "GITHUB_LINK_IN_PROGRESS", "x"));
    expect(await disconnectGithubAction()).toEqual({
      ok: false,
      code: "GITHUB_LINK_IN_PROGRESS",
    });
  });
});
