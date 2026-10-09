// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ listMyProjects: vi.fn() }));
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
  return { ApiError, listMyProjects: api.listMyProjects };
});

const { loadMoreProjectsAction } = await import("./actions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("loadMoreProjectsAction", () => {
  it("forwards only checked filters and the cursor, with a page size", async () => {
    api.listMyProjects.mockResolvedValue({ items: [{ id: "a" }], nextCursor: "n2" });
    const result = await loadMoreProjectsAction({
      cursor: "n1",
      category: "course",
      userId: "someone-else",
      sort: "bogus",
      state: "draft",
    });
    expect(result).toEqual({ ok: true, items: [{ id: "a" }], nextCursor: "n2" });
    expect(api.listMyProjects).toHaveBeenCalledWith({
      cursor: "n1",
      category: "course",
      limit: 12,
    });
  });

  it("refuses a call without a cursor, and a non-object, without calling the API", async () => {
    expect(await loadMoreProjectsAction({})).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(await loadMoreProjectsAction("x")).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.listMyProjects).not.toHaveBeenCalled();
  });

  it("returns the API's failure code", async () => {
    api.listMyProjects.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    expect(await loadMoreProjectsAction({ cursor: "n1" })).toEqual({
      ok: false,
      code: "API_UNREACHABLE",
    });
  });

  it("does not swallow an unexpected error", async () => {
    api.listMyProjects.mockRejectedValue(new Error("boom"));
    await expect(loadMoreProjectsAction({ cursor: "n1" })).rejects.toThrow("boom");
  });
});
