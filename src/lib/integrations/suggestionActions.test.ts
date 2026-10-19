// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  list: vi.fn(),
  refresh: vi.fn(),
  accept: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock("server-only", () => ({}));
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
  return {
    ApiError,
    listSuggestions: api.list,
    refreshSuggestions: api.refresh,
    acceptSuggestion: api.accept,
    dismissSuggestion: api.dismiss,
  };
});

const { loadProfileSuggestionsAction, acceptSuggestionsAction, dismissSuggestionAction } =
  await import("./suggestionActions");
const { ApiError } = await import("@/lib/api/client");

const A = "0b6f2c1e-1111-4222-8333-444455556661";
const B = "0b6f2c1e-1111-4222-8333-444455556662";
const item = (over: Record<string, unknown>) => ({
  id: A,
  kind: "profile.bio",
  source: "github",
  status: "open",
  ...over,
});

beforeEach(() => vi.resetAllMocks());

describe("loadProfileSuggestionsAction", () => {
  it("refreshes, then lists only GitHub's open profile suggestions", async () => {
    api.refresh.mockResolvedValue({ github: "refreshed", created: 2 });
    api.list.mockResolvedValue({
      items: [
        item({}),
        item({ id: B, source: "linkedin" }),
        item({ id: "c", kind: "linkedin.reimport", source: "github" }),
        item({ id: "d", status: "dismissed" }),
      ],
    });
    const result = await loadProfileSuggestionsAction();
    expect(result).toMatchObject({ ok: true, refreshError: null });
    expect(result.ok && result.items.map((i) => i.id)).toEqual([A]);
  });

  it("asks for no more than the contract copy allows `limit` to be (M7-T28)", async () => {
    // The API's published document, as copied into this repository: the `limit` parameter of
    // GET /v1/me/suggestions. Production answered 400 to a limit above what the API accepted.
    const yaml = readFileSync(join(__dirname, "../api/openapi.yaml"), "utf8");
    const path = yaml.split("\n  /v1/me/suggestions:\n")[1]?.split("\n  /v1/")[0] ?? "";
    const published = Number(/- name: limit\n(?:.*\n)*?\s+maximum: (\d+)/.exec(path)?.[1]);
    expect(Number.isInteger(published) && published > 0).toBe(true);

    api.refresh.mockResolvedValue({ github: "refreshed", created: 0 });
    api.list.mockResolvedValue({ items: [] });
    await loadProfileSuggestionsAction();
    const query = api.list.mock.calls[0]?.[0] as { limit?: number };
    expect(query.limit).toBeLessThanOrEqual(published);
  });

  it("a failed refresh still shows the stored suggestions, with the reason", async () => {
    api.refresh.mockRejectedValue(new ApiError(429, "GITHUB_RATE_LIMITED", "x"));
    api.list.mockResolvedValue({ items: [item({})] });
    const result = await loadProfileSuggestionsAction();
    expect(result).toMatchObject({ ok: true, refreshError: "GITHUB_RATE_LIMITED" });
  });

  it("a failed list is a failure, never an empty list", async () => {
    api.refresh.mockResolvedValue({});
    api.list.mockRejectedValue(new ApiError(503, "DATABASE_UNAVAILABLE", "x"));
    expect(await loadProfileSuggestionsAction()).toEqual({
      ok: false,
      code: "DATABASE_UNAVAILABLE",
    });
  });

  it("no session ends the read at once", async () => {
    api.refresh.mockRejectedValue(new ApiError(401, "UNAUTHENTICATED", "x"));
    expect(await loadProfileSuggestionsAction()).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    expect(api.list).not.toHaveBeenCalled();
  });
});

describe("acceptSuggestionsAction", () => {
  it("accepts each id with its own request and reports each outcome", async () => {
    api.accept
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new ApiError(409, "SUGGESTION_INVALID", "x"));
    expect(await acceptSuggestionsAction({ ids: [A, B] })).toEqual({
      ok: true,
      results: [
        { id: A, ok: true },
        { id: B, ok: false, code: "SUGGESTION_INVALID" },
      ],
    });
    expect(api.accept).toHaveBeenCalledTimes(2);
  });
  it.each([
    ["no ids", { ids: [] }],
    ["a non-UUID", { ids: ["../x"] }],
    ["a duplicate", { ids: [A, A] }],
    [
      "too many",
      {
        ids: Array.from(
          { length: 11 },
          (_, i) => `0b6f2c1e-1111-4222-8333-4444555566${String(i).padStart(2, "0")}`,
        ),
      },
    ],
    ["not an object", null],
  ])("refuses %s before any API call", async (_n, input) => {
    expect(await acceptSuggestionsAction(input)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.accept).not.toHaveBeenCalled();
  });
});

describe("dismissSuggestionAction", () => {
  it("dismisses a valid id", async () => {
    api.dismiss.mockResolvedValue({});
    expect(await dismissSuggestionAction({ id: A })).toEqual({ ok: true });
  });
  it("refuses a bad id before any API call", async () => {
    expect(await dismissSuggestionAction({ id: "x" })).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
    });
    expect(api.dismiss).not.toHaveBeenCalled();
  });
});
