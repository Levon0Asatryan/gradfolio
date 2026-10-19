// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ listSuggestions: vi.fn() }));
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

const route = await import("./route");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

const row = (id: string, kind: string, status = "open") => ({ id, kind, status });

describe("GET /api/suggestions", () => {
  it("lists one page of 100, uncached, keeping the open kinds the inbox shows", async () => {
    api.listSuggestions.mockResolvedValue({
      items: [
        row("a", "skill.add"),
        row("b", "linkedin.reimport"),
        row("c", "project.update", "dismissed"),
      ],
      nextCursor: "n",
      openCount: 3,
    });
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ items: [row("a", "skill.add")], more: true });
    expect(api.listSuggestions).toHaveBeenCalledWith({ limit: 100 });
  });

  it("answers with the code only when the API fails", async () => {
    api.listSuggestions.mockRejectedValue(
      new ApiError(503, "DATABASE_UNAVAILABLE", "secret detail"),
    );
    const res = await route.GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ code: "DATABASE_UNAVAILABLE" });
  });
});
