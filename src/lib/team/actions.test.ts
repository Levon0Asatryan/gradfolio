// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  inviteTeamMember: vi.fn(),
  addExternalTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  leaveProjectTeam: vi.fn(),
}));
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

const { inviteAction, addExternalAction, removeMemberAction, leaveAction } =
  await import("./actions");
const { ApiError } = await import("@/lib/api/client");

const P = "0b6f2c1e-1111-4222-8333-444455556601";
const U = "0b6f2c1e-1111-4222-8333-444455556602";
beforeEach(() => vi.resetAllMocks());

describe("inviteAction", () => {
  it("sends the user and a checked role, and nothing else", async () => {
    api.inviteTeamMember.mockResolvedValue({});
    expect(await inviteAction(P, U, "  Designer ")).toEqual({ ok: true });
    expect(api.inviteTeamMember).toHaveBeenCalledWith(P, { userId: U, role: "Designer" });
    await inviteAction(P, U, "");
    expect(api.inviteTeamMember).toHaveBeenLastCalledWith(P, { userId: U, role: null });
  });

  it.each([
    ["..", U],
    [P, "../x"],
    [P, 5],
    [undefined, U],
  ])("refuses %j / %j without calling the API", async (p, u) => {
    expect(await inviteAction(p, u, "")).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.inviteTeamMember).not.toHaveBeenCalled();
  });

  it("refuses a role that is too long, naming the field", async () => {
    expect(await inviteAction(P, U, "r".repeat(256))).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      field: "role",
      error: "tooLong",
    });
    expect(api.inviteTeamMember).not.toHaveBeenCalled();
  });

  it.each(["ALREADY_MEMBER", "TEAM_FULL", "PROJECT_IS_DRAFT", "NOT_FOUND", "RATE_LIMITED"])(
    "passes %s through",
    async (code) => {
      api.inviteTeamMember.mockRejectedValue(new ApiError(409, code, "x"));
      expect(await inviteAction(P, U, "")).toEqual({ ok: false, code });
    },
  );

  it("does not swallow a bug", async () => {
    api.inviteTeamMember.mockRejectedValue(new TypeError("boom"));
    await expect(inviteAction(P, U, "")).rejects.toThrow("boom");
  });
});

describe("addExternalAction", () => {
  it("sends a trimmed name and a role or null", async () => {
    api.addExternalTeamMember.mockResolvedValue({});
    expect(await addExternalAction(P, " Ani ", "")).toEqual({ ok: true });
    expect(api.addExternalTeamMember).toHaveBeenCalledWith(P, { name: "Ani", role: null });
  });

  it("refuses a blank name before any request", async () => {
    expect(await addExternalAction(P, "  ", "")).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      field: "name",
      error: "required",
    });
    expect(api.addExternalTeamMember).not.toHaveBeenCalled();
  });
});

describe("removeMemberAction and leaveAction", () => {
  it("forward ids only, and refuse anything that is not a UUID", async () => {
    api.removeTeamMember.mockResolvedValue(undefined);
    api.leaveProjectTeam.mockResolvedValue(undefined);
    expect(await removeMemberAction(P, U)).toEqual({ ok: true });
    expect(api.removeTeamMember).toHaveBeenCalledWith(P, U);
    expect(await leaveAction(P)).toEqual({ ok: true });
    expect(await removeMemberAction(P, "x")).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(await leaveAction("..")).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.removeTeamMember).toHaveBeenCalledTimes(1);
    expect(api.leaveProjectTeam).toHaveBeenCalledTimes(1);
  });

  it("passes the API's 404 through (someone else's project)", async () => {
    api.removeTeamMember.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    expect(await removeMemberAction(P, U)).toEqual({ ok: false, code: "NOT_FOUND" });
  });
});
