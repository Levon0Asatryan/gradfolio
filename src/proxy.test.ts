// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  middleware: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock("@/lib/auth0", () => ({ auth0: sdk }));

const { proxy } = await import("./proxy");

const ORIGIN = "https://gradfolio.test";
const request = (path: string) => new NextRequest(new URL(path, ORIGIN));
const sdkResponse = () => NextResponse.next({ headers: { "x-from-sdk": "1" } });

beforeEach(() => {
  sdk.middleware.mockImplementation(() => Promise.resolve(sdkResponse()));
  sdk.getSession.mockResolvedValue(null);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("proxy", () => {
  it("hands /auth/* to the SDK untouched", async () => {
    const res = await proxy(request("/auth/login"));
    expect(res.headers.get("x-from-sdk")).toBe("1");
    expect(sdk.getSession).not.toHaveBeenCalled();
  });

  it("serves a public page without a session", async () => {
    const res = await proxy(request("/profile/u_001"));
    expect(res.headers.get("x-from-sdk")).toBe("1");
    expect(sdk.getSession).not.toHaveBeenCalled();
  });

  it("sends a signed-out visitor of a protected page to login, and back after", async () => {
    const res = await proxy(request("/projects/new?draft=1"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location") ?? "");
    expect(location.pathname).toBe("/auth/login");
    expect(location.searchParams.get("returnTo")).toBe("/projects/new?draft=1");
  });

  it("serves a protected page to a signed-in user, keeping the SDK's cookies", async () => {
    sdk.getSession.mockResolvedValue({ user: { sub: "google-oauth2|1" } });
    const res = await proxy(request("/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-from-sdk")).toBe("1");
  });

  it("fails closed: a protected page answers 503 when the session cannot be checked", async () => {
    sdk.getSession.mockRejectedValue(new TypeError("cookie decrypt failed"));
    const res = await proxy(request("/account"));
    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("30");
    const body = await res.text();
    expect(body).not.toMatch(/decrypt/);
    // In every UI language: the proxy cannot know which one the user chose.
    expect(body).toContain("Sign-in is temporarily unavailable");
    expect(body).toContain("Вход временно недоступен");
    expect(body).toContain("Մուտքը ժամանակավորապես անհասանելի է");
  });

  it("fails closed when the SDK itself throws on a protected page", async () => {
    sdk.middleware.mockRejectedValue(new Error("boom"));
    const res = await proxy(request("/integrations"));
    expect(res.status).toBe(503);
  });

  it("still serves a public page when the SDK throws, and logs it without detail", async () => {
    sdk.middleware.mockRejectedValue(new Error("secret detail"));
    const res = await proxy(request("/search"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(console.error).toHaveBeenCalledWith("proxy: session check failed", {
      path: "/search",
      error: "Error",
    });
  });
});
