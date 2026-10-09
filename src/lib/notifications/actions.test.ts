// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  respondToInvitation: vi.fn(),
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

const { markNotificationReadAction, markAllNotificationsReadAction, respondToInviteAction } =
  await import("./actions");
const { ApiError } = await import("@/lib/api/client");

const ID = "0b6f2c1e-1111-4222-8333-444455556666";
beforeEach(() => vi.resetAllMocks());

describe("markNotificationReadAction", () => {
  it("forwards the id and nothing else", async () => {
    api.markNotificationRead.mockResolvedValue(undefined);
    expect(await markNotificationReadAction(ID)).toEqual({ ok: true });
    expect(api.markNotificationRead).toHaveBeenCalledWith(ID);
  });

  it.each([undefined, 7, "..", "../x", `${ID}/x`])(
    "refuses %j without calling the API",
    async (id) => {
      expect(await markNotificationReadAction(id)).toEqual({
        ok: false,
        code: "VALIDATION_FAILED",
      });
      expect(api.markNotificationRead).not.toHaveBeenCalled();
    },
  );

  it("passes the API's code through (someone else's id is a 404)", async () => {
    api.markNotificationRead.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    expect(await markNotificationReadAction(ID)).toEqual({ ok: false, code: "NOT_FOUND" });
  });

  it("does not swallow a bug", async () => {
    api.markNotificationRead.mockRejectedValue(new TypeError("boom"));
    await expect(markNotificationReadAction(ID)).rejects.toThrow("boom");
  });
});

describe("markAllNotificationsReadAction", () => {
  it("takes no argument and reports the code on failure", async () => {
    api.markAllNotificationsRead.mockResolvedValue({ updated: 2 });
    expect(await markAllNotificationsReadAction()).toEqual({ ok: true });
    api.markAllNotificationsRead.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "slow"));
    expect(await markAllNotificationsReadAction()).toEqual({ ok: false, code: "RATE_LIMITED" });
  });
});

describe("respondToInviteAction", () => {
  it("forwards a project id and a fixed decision, nothing else", async () => {
    api.respondToInvitation.mockResolvedValue(undefined);
    expect(await respondToInviteAction(ID, "accept")).toEqual({ ok: true });
    expect(api.respondToInvitation).toHaveBeenCalledWith(ID, "accept");
    await respondToInviteAction(ID, "reject");
    expect(api.respondToInvitation).toHaveBeenLastCalledWith(ID, "reject");
  });

  it.each([
    ["..", "accept"],
    [ID, "delete"],
    [ID, undefined],
    [7, "accept"],
    [`${ID}/x`, "accept"],
  ])("refuses %j %j without calling the API", async (id, decision) => {
    expect(await respondToInviteAction(id, decision)).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
    });
    expect(api.respondToInvitation).not.toHaveBeenCalled();
  });

  it("passes 404 and 409 codes through", async () => {
    api.respondToInvitation.mockRejectedValue(new ApiError(409, "INVITE_NOT_PENDING", "x"));
    expect(await respondToInviteAction(ID, "accept")).toEqual({
      ok: false,
      code: "INVITE_NOT_PENDING",
    });
  });
});
