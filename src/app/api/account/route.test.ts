// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ deleteMe: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  }
  return { ApiError, deleteMe: api.deleteMe };
});

const { DELETE } = await import("./route");
const { ApiError } = await import("@/lib/api/client");

const call = (origin: string | null = "https://app.example") =>
  DELETE(
    new NextRequest("https://app.example/api/account", {
      method: "DELETE",
      headers: origin ? { origin } : {},
    }),
  );

beforeEach(() => vi.resetAllMocks());

describe("DELETE /api/account", () => {
  it("deletes through the API and answers only { ok }", async () => {
    api.deleteMe.mockResolvedValue(undefined);
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses a request that is not from this site, before any API call", async () => {
    for (const origin of ["https://evil.example", null]) {
      const response = await call(origin);
      expect(response.status).toBe(403);
    }
    expect(api.deleteMe).not.toHaveBeenCalled();
  });

  it("passes the API's refusal through as its code, never its message", async () => {
    api.deleteMe.mockRejectedValue(new ApiError(502, "GITHUB_REVOKE_FAILED", "internal detail"));
    const response = await call();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ code: "GITHUB_REVOKE_FAILED" });
  });
});
