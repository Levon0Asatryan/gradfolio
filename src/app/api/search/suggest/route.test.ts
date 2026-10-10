// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ getSuggestions: vi.fn() }));
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

const { GET } = await import("./route");
const { ApiError } = await import("@/lib/api/client");

const req = (qs: string) => new NextRequest(`http://localhost/api/search/suggest${qs}`);
beforeEach(() => vi.resetAllMocks());

describe("GET /api/search/suggest", () => {
  it("returns the API's suggestions uncached, for the cleaned query", async () => {
    api.getSuggestions.mockResolvedValue({ query: "ml", people: [], projects: [], tags: [] });
    const res = await GET(req("?q=%20%20ML%20%20&userId=other"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(api.getSuggestions).toHaveBeenCalledWith("ML");
    expect(await res.json()).toMatchObject({ query: "ml" });
  });

  it.each(["", "a", "   ", "%00%00", "x%E2%80%8B"])(
    "refuses %j (under two characters once cleaned) without calling the API",
    async (q) => {
      const res = await GET(req(`?q=${q}`));
      expect(res.status).toBe(400);
      expect(api.getSuggestions).not.toHaveBeenCalled();
    },
  );

  it("cuts a paragraph to what the API takes instead of sending a 400 through", async () => {
    api.getSuggestions.mockResolvedValue({ query: "", people: [], projects: [], tags: [] });
    await GET(req(`?q=${"word ".repeat(40)}`));
    const sent = api.getSuggestions.mock.calls[0]?.[0] as string;
    expect(sent.split(" ").length).toBeLessThanOrEqual(6);
    expect(Array.from(sent).length).toBeLessThanOrEqual(100);
  });

  it("passes the API's status and code, never its message", async () => {
    api.getSuggestions.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "internal detail"));
    const res = await GET(req("?q=ml"));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ code: "RATE_LIMITED" });
  });

  it("an unexpected error is a 500 with no detail", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    api.getSuggestions.mockRejectedValue(new TypeError("secret detail"));
    const res = await GET(req("?q=ml"));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});
