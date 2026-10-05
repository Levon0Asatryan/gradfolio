// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({ getMe: vi.fn() }));
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
  return { ApiError, getMe: api.getMe };
});
vi.mock("@/lib/profile/actions", () => ({ completeOnboardingAction: vi.fn() }));

const { OnboardingGate } = await import("./OnboardingGate");
const { OnboardingDialog } = await import("./OnboardingDialog");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("OnboardingGate", () => {
  it("offers onboarding when the account is not onboarded", async () => {
    api.getMe.mockResolvedValue({ onboarded: false });
    const el = await OnboardingGate();
    expect(el?.type).toBe(OnboardingDialog);
  });

  it("offers nothing once onboarded", async () => {
    api.getMe.mockResolvedValue({ onboarded: true });
    await expect(OnboardingGate()).resolves.toBeNull();
  });

  it.each(["UNAUTHENTICATED", "API_UNREACHABLE", "API_NOT_CONFIGURED"])(
    "never blocks the page when the account cannot be read (%s)",
    async (code) => {
      api.getMe.mockRejectedValue(new ApiError(503, code, "x"));
      await expect(OnboardingGate()).resolves.toBeNull();
    },
  );

  it("does not swallow a bug", async () => {
    api.getMe.mockRejectedValue(new TypeError("boom"));
    await expect(OnboardingGate()).rejects.toThrow("boom");
  });
});
