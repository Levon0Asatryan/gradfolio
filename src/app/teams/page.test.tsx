// @vitest-environment node
import { isValidElement, type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ getMyTeams: vi.fn(), getMe: vi.fn() }));
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
  return { ApiError, getMyTeams: api.getMyTeams, getMe: api.getMe };
});

const { default: TeamsPage } = await import("./page");
const { ApiError } = await import("@/lib/api/client");

const lists = (over: Record<string, unknown> = {}) => ({
  owned: { items: [], nextCursor: null },
  member: { items: [], nextCursor: null },
  incoming: { items: [], nextCursor: null },
  outgoing: { items: [], nextCursor: null },
  ...over,
});
const load = (params: Record<string, string | string[] | undefined> = {}) =>
  TeamsPage({ searchParams: Promise.resolve(params) });
const props = (el: unknown) =>
  (isValidElement(el) ? (el as ReactElement).props : {}) as Record<string, unknown>;

beforeEach(() => vi.resetAllMocks());

describe("/teams (server)", () => {
  it("asks for the page size and the cursors in the URL, and ignores anything else", async () => {
    api.getMyTeams.mockResolvedValue(lists());
    await load({ ownedCursor: "o1", userId: "someone-else", memberCursor: "" });
    expect(api.getMyTeams).toHaveBeenCalledWith({
      limit: 10,
      ownedCursor: "o1",
      memberCursor: undefined,
      incomingCursor: undefined,
      outgoingCursor: undefined,
    });
  });

  it("links to the next page of a list, keeping the other lists where they are", async () => {
    api.getMyTeams.mockResolvedValue(
      lists({ owned: { items: [], nextCursor: "o2" }, incoming: { items: [], nextCursor: null } }),
    );
    const el = await load({ incomingCursor: "i1" });
    expect(props(el).more).toEqual({
      owned: "/teams?ownedCursor=o2&incomingCursor=i1",
      member: undefined,
      incoming: undefined,
      outgoing: undefined,
    });
    expect(props(el).firstHref).toBe("/teams");
  });

  it("has no 'first page' link on the first page", async () => {
    api.getMyTeams.mockResolvedValue(lists());
    expect(props(await load()).firstHref).toBeNull();
  });

  it("reads the viewer's id only when they joined a project (for Leave), and survives it failing", async () => {
    api.getMyTeams.mockResolvedValue(lists());
    await load();
    expect(api.getMe).not.toHaveBeenCalled();
    api.getMyTeams.mockResolvedValue(lists({ member: { items: [{ id: "p" }], nextCursor: null } }));
    api.getMe.mockResolvedValue({ id: "u-1" });
    expect(props(await load()).viewerUserId).toBe("u-1");
    api.getMe.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    expect(props(await load()).viewerUserId).toBeNull();
  });

  it("shows a failed load as an error, with the code, never as empty teams", async () => {
    api.getMyTeams.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    const el = await load();
    expect(props(el)).toMatchObject({ what: "teams", code: "API_UNREACHABLE", returnTo: "/teams" });
  });

  it("does not swallow a bug", async () => {
    api.getMyTeams.mockRejectedValue(new TypeError("boom"));
    await expect(load()).rejects.toThrow("boom");
  });
});
