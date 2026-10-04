// @vitest-environment node
import { AccessTokenError } from "@auth0/nextjs-auth0/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sdk = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("@/lib/auth0", () => ({ auth0: sdk }));

const { ApiError, getMe } = await import("./client");

const ME = {
  id: "0b6f2c1e-1111-4222-8333-444455556666",
  name: "Ani",
  email: "ani@example.com",
  avatarUrl: null,
  headline: "",
  verified: true,
  isPublic: true,
  identities: ["google-oauth2"],
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://api.test:3001");
  sdk.getAccessToken.mockResolvedValue({ token: "tok-123" });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

async function failure(): Promise<InstanceType<typeof ApiError>> {
  const err: unknown = await getMe().catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiError);
  return err as InstanceType<typeof ApiError>;
}

describe("getMe", () => {
  it("calls GET /v1/me with the bearer token and returns the account", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, ME));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMe()).resolves.toEqual(ME);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://api.test:3001/v1/me");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-123");
    expect(init.cache).toBe("no-store");
  });

  it.each([
    [401, { code: "UNAUTHENTICATED", message: "authentication required" }],
    [429, { code: "RATE_LIMITED", message: "too many requests" }],
    [503, { code: "AUTH_UNAVAILABLE", message: "authentication is temporarily unavailable" }],
  ])("turns the API's %i envelope into an ApiError with its code", async (status, body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(status, body)));
    const err = await failure();
    expect([err.status, err.code, err.message]).toEqual([status, body.code, body.message]);
  });

  it("keeps a non-envelope failure generic", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 })),
    );
    const err = await failure();
    expect([err.status, err.code]).toEqual([502, "UNKNOWN_ERROR"]);
  });

  it("reports an unreachable API as 503 API_UNREACHABLE", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const err = await failure();
    expect([err.status, err.code]).toEqual([503, "API_UNREACHABLE"]);
  });

  it("refuses to call anything when API_BASE_URL is not set", async () => {
    vi.stubEnv("API_BASE_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const err = await failure();
    expect(err.code).toBe("API_NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the user to sign in again when no access token can be had", async () => {
    sdk.getAccessToken.mockRejectedValue(
      new AccessTokenError("missing_refresh_token", "The access token has expired."),
    );
    vi.stubGlobal("fetch", vi.fn());
    const err = await failure();
    expect([err.status, err.code]).toEqual([401, "UNAUTHENTICATED"]);
  });

  it("does not hide an unexpected error from the SDK", async () => {
    sdk.getAccessToken.mockRejectedValue(new Error("config broken"));
    await expect(getMe()).rejects.toThrow("config broken");
  });
});
