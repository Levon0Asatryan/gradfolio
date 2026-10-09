// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ lookupUsers: vi.fn() }));
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
  return { ApiError, lookupUsers: api.lookupUsers };
});

const { GET } = await import("./route");
const { ApiError } = await import("@/lib/api/client");
const req = (qs: string) => new NextRequest(`http://localhost/api/users/lookup${qs}`);
beforeEach(() => vi.resetAllMocks());

describe("GET /api/users/lookup", () => {
  it("forwards a checked query and returns the people uncached", async () => {
    api.lookupUsers.mockResolvedValue([{ id: "u", name: "Ani", headline: null, avatarUrl: null }]);
    const res = await GET(req("?q=%20Ani%20"));
    expect(api.lookupUsers).toHaveBeenCalledWith("Ani");
    expect(await res.json()).toEqual({
      items: [{ id: "u", name: "Ani", headline: null, avatarUrl: null }],
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it.each(["", "?q=", "?q=An", `?q=${"a".repeat(51)}`])(
    "answers 400 to %j without calling the API",
    async (qs) => {
      expect((await GET(req(qs))).status).toBe(400);
      expect(api.lookupUsers).not.toHaveBeenCalled();
    },
  );

  it("passes the API's 429 and the missing session's 401 through as codes", async () => {
    api.lookupUsers.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "x"));
    const limited = await GET(req("?q=Ani"));
    expect([limited.status, await limited.json()]).toEqual([429, { code: "RATE_LIMITED" }]);
    api.lookupUsers.mockRejectedValue(new ApiError(401, "UNAUTHENTICATED", "x"));
    expect((await GET(req("?q=Ani"))).status).toBe(401);
  });
});
