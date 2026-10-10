// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({ listMyActivities: vi.fn() }));
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
  return { ApiError, listMyActivities: api.listMyActivities };
});

const { loadMoreActivitiesAction } = await import("./actions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("loadMoreActivitiesAction", () => {
  it.each([
    ["a string", "abc"],
    ["null", null],
    ["a number", 7],
    ["an array", ["x"]],
    ["a non-string cursor", { cursor: 5 }],
    ["an object cursor", { cursor: { $ne: "" } }],
    ["an empty cursor", { cursor: "" }],
    ["a 601-character cursor", { cursor: "a".repeat(601) }],
  ])("refuses %s without calling the API", async (_name, input) => {
    expect(await loadMoreActivitiesAction(input)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.listMyActivities).not.toHaveBeenCalled();
  });

  it("forwards a valid cursor and nothing else (no user id)", async () => {
    api.listMyActivities.mockResolvedValue({ items: [], nextCursor: null });
    await loadMoreActivitiesAction({ cursor: "abc", userId: "someone-else", limit: 9999 });
    expect(api.listMyActivities).toHaveBeenCalledWith({ limit: 20, cursor: "abc" });
  });

  it("with no cursor reads the newest page", async () => {
    api.listMyActivities.mockResolvedValue({ items: [{ id: "a" }], nextCursor: "n" });
    expect(await loadMoreActivitiesAction({})).toEqual({
      ok: true,
      items: [{ id: "a" }],
      nextCursor: "n",
    });
    expect(api.listMyActivities).toHaveBeenCalledWith({ limit: 20, cursor: undefined });
  });

  it("answers the API's code, and does not hide a bug", async () => {
    api.listMyActivities.mockRejectedValue(new ApiError(401, "UNAUTHENTICATED", "x"));
    expect(await loadMoreActivitiesAction({})).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    api.listMyActivities.mockRejectedValue(new TypeError("boom"));
    await expect(loadMoreActivitiesAction({})).rejects.toThrow("boom");
  });
});
