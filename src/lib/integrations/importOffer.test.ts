import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/lib/api/client", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  },
  listMyProjects: mocks.list,
}));

const { offerGithubImport } = await import("./importOffer");
const { ApiError } = await import("@/lib/api/client");

const project = (source: "manual" | "github", role: "owner" | "member" = "owner") => ({
  id: source,
  source,
  role,
});
beforeEach(() => vi.resetAllMocks());

describe("offerGithubImport", () => {
  it("asks nothing when GitHub is not connected", async () => {
    expect(await offerGithubImport(false)).toBe(false);
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("offers when connected and no project came from GitHub", async () => {
    mocks.list.mockResolvedValue({ items: [project("manual")], nextCursor: null });
    expect(await offerGithubImport(true)).toBe(true);
  });

  it("offers when the student has no projects at all", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    expect(await offerGithubImport(true)).toBe(true);
  });

  it("still offers when the only GitHub project is someone else's, where the student is a member", async () => {
    mocks.list.mockResolvedValue({ items: [project("github", "member")], nextCursor: null });
    expect(await offerGithubImport(true)).toBe(true);
  });

  it("does not offer once a project has source github, even on a later page", async () => {
    mocks.list
      .mockResolvedValueOnce({ items: [project("manual")], nextCursor: "c1" })
      .mockResolvedValueOnce({ items: [project("github")], nextCursor: null });
    expect(await offerGithubImport(true)).toBe(false);
    expect(mocks.list).toHaveBeenLastCalledWith({ limit: 50, cursor: "c1" });
  });

  it("does not offer on a guess: an unreadable list, or one that never ends", async () => {
    mocks.list.mockRejectedValueOnce(new ApiError(503, "API_UNREACHABLE", "x"));
    expect(await offerGithubImport(true)).toBe(false);
    mocks.list.mockResolvedValue({ items: [project("manual")], nextCursor: "more" });
    expect(await offerGithubImport(true)).toBe(false);
    expect(mocks.list).toHaveBeenCalledTimes(11);
  });

  it("rethrows what is not an API error", async () => {
    mocks.list.mockRejectedValue(new TypeError("bug"));
    await expect(offerGithubImport(true)).rejects.toThrow("bug");
  });
});
