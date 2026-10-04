// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({ updateMyProfile: vi.fn(), completeOnboarding: vi.fn() }));
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

const { updateProfileAction, completeOnboardingAction } = await import("./actions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("updateProfileAction", () => {
  it("forwards the checked patch to the API", async () => {
    api.updateMyProfile.mockResolvedValue({});
    await expect(updateProfileAction({ name: " Ani ", isPublic: false })).resolves.toEqual({
      ok: true,
    });
    expect(api.updateMyProfile).toHaveBeenCalledWith({ name: "Ani", isPublic: false });
  });

  it("never calls the API with input that fails the check", async () => {
    const result = await updateProfileAction({ name: "Ani", verified: true });
    expect(result).toMatchObject({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.updateMyProfile).not.toHaveBeenCalled();
  });

  it("drops nothing silently: the fields are named", async () => {
    await expect(updateProfileAction({ avatarUrl: "javascript:x" })).resolves.toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      fields: { avatarUrl: "invalid_url" },
    });
  });

  it.each(["UNAUTHENTICATED", "VALIDATION_FAILED", "DATABASE_UNAVAILABLE"])(
    "returns the API's %s as a result",
    async (code) => {
      api.updateMyProfile.mockRejectedValue(new ApiError(400, code, "x"));
      await expect(updateProfileAction({ name: "Ani" })).resolves.toEqual({ ok: false, code });
    },
  );

  it("does not swallow a bug", async () => {
    api.updateMyProfile.mockRejectedValue(new TypeError("boom"));
    await expect(updateProfileAction({ name: "Ani" })).rejects.toThrow("boom");
  });
});

describe("completeOnboardingAction", () => {
  it("completes onboarding", async () => {
    api.completeOnboarding.mockResolvedValue({ onboarded: true });
    await expect(completeOnboardingAction()).resolves.toEqual({ ok: true });
  });

  it("reports a failure instead of pretending it worked", async () => {
    api.completeOnboarding.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "x"));
    await expect(completeOnboardingAction()).resolves.toEqual({
      ok: false,
      code: "API_UNREACHABLE",
    });
  });
});
