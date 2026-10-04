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
const nav = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => nav);

const { default: MyProfilePage } = await import("./page");
const { ApiError } = await import("@/lib/api/client");
const { ProfileError } = await import("@/components/profile/ProfileError");

beforeEach(() => vi.resetAllMocks());

describe("/profile", () => {
  it("sends the signed-in user to their own profile id, not a hardcoded one", async () => {
    api.getMe.mockResolvedValue({ id: "0b6f2c1e-1111-4222-8333-444455556666" });
    await MyProfilePage();
    expect(nav.redirect).toHaveBeenCalledWith("/profile/0b6f2c1e-1111-4222-8333-444455556666");
  });

  it("shows an API failure as an error and does not redirect", async () => {
    api.getMe.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "x"));
    const el = await MyProfilePage();
    expect(el.type).toBe(ProfileError);
    expect(nav.redirect).not.toHaveBeenCalled();
  });
});
