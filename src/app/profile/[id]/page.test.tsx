// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROFILE } from "@/testing/fixtures";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({ getProfile: vi.fn() }));
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
  return { ApiError, getProfile: api.getProfile };
});
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { default: ProfilePage } = await import("./page");
const { ApiError } = await import("@/lib/api/client");
const { ProfileView } = await import("@/components/profile/ProfileView");
const { ProfileError } = await import("@/components/profile/ProfileError");

const page = () => ProfilePage({ params: Promise.resolve({ id: PROFILE.id }) });

beforeEach(() => vi.resetAllMocks());

describe("/profile/[id]", () => {
  it("renders the API's profile", async () => {
    api.getProfile.mockResolvedValue(PROFILE);
    const el = await page();
    expect(el.type).toBe(ProfileView);
    expect(el.props.profile).toBe(PROFILE);
    expect(api.getProfile).toHaveBeenCalledWith(PROFILE.id);
  });

  it("answers 404 for an unknown or private profile", async () => {
    api.getProfile.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no such profile"));
    await expect(page()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it.each(["DATABASE_UNAVAILABLE", "API_UNREACHABLE", "UNAUTHENTICATED", "RATE_LIMITED"])(
    "shows %s as an error, never as an empty profile",
    async (code) => {
      api.getProfile.mockRejectedValue(new ApiError(503, code, "x"));
      const el = await page();
      expect(el.type).toBe(ProfileError);
      expect(el.props.code).toBe(code);
    },
  );

  it("does not swallow a bug", async () => {
    api.getProfile.mockRejectedValue(new TypeError("boom"));
    await expect(page()).rejects.toThrow("boom");
  });
});
