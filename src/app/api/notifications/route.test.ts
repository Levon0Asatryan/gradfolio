// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ listNotifications: vi.fn(), getUnreadNotificationCount: vi.fn() }));
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
  return { ApiError, ...api };
});

const list = await import("./route");
const count = await import("./unread-count/route");
const { ApiError } = await import("@/lib/api/client");

const req = (qs = "") => new NextRequest(`http://localhost/api/notifications${qs}`);
beforeEach(() => vi.resetAllMocks());

describe("GET /api/notifications", () => {
  it("returns the page, uncached, and forwards only checked parameters", async () => {
    api.listNotifications.mockResolvedValue({ items: [], nextCursor: null });
    const res = await list.GET(req("?limit=15&cursor=c1&userId=other"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ items: [], nextCursor: null });
    expect(api.listNotifications).toHaveBeenCalledWith({ limit: 15, cursor: "c1" });
  });

  it("answers 400 to a bad limit without calling the API", async () => {
    const res = await list.GET(req("?limit=999"));
    expect(res.status).toBe(400);
    expect(api.listNotifications).not.toHaveBeenCalled();
  });

  it("answers 401 with the code only when there is no session (no API call was made)", async () => {
    api.listNotifications.mockRejectedValue(new ApiError(401, "UNAUTHENTICATED", "sign in again"));
    const res = await list.GET(req());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: "UNAUTHENTICATED" });
  });

  it("hides the message of an unexpected failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    api.listNotifications.mockRejectedValue(new Error("secret db detail"));
    const res = await list.GET(req());
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("returns the count uncached and passes 429 through", async () => {
    api.getUnreadNotificationCount.mockResolvedValue({ count: 3 });
    const res = await count.GET();
    expect(await res.json()).toEqual({ count: 3 });
    expect(res.headers.get("cache-control")).toBe("no-store");
    api.getUnreadNotificationCount.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "x"));
    expect((await count.GET()).status).toBe(429);
  });
});
