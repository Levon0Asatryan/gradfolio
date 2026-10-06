// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({ getMyProfile: vi.fn() }));
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
  return { ApiError, getMyProfile: api.getMyProfile };
});

const { DashboardLoader } = await import("./DashboardLoader");
const { DashboardContent } = await import("./DashboardContent");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

const HEADER = {
  name: "Ani Petrosyan",
  headline: "CS student",
  bio: "x",
  location: "Yerevan",
  contactEmail: null,
  avatarUrl: null,
};

describe("DashboardLoader", () => {
  it("greets the user by first name with the completeness of their header", async () => {
    api.getMyProfile.mockResolvedValue(HEADER);
    const el = await DashboardLoader();
    expect(el.type).toBe(DashboardContent);
    expect(el.props.firstName).toBe("Ani");
    expect(el.props.completeness).toMatchObject({ percent: 33, next: "contact" });
  });

  it.each(["UNAUTHENTICATED", "API_UNREACHABLE", "API_NOT_CONFIGURED", "NOT_FOUND"])(
    "still renders the dashboard, without a meter, when the API says %s",
    async (code) => {
      api.getMyProfile.mockRejectedValue(new ApiError(503, code, "x"));
      const el = await DashboardLoader();
      expect(el.type).toBe(DashboardContent);
      expect(el.props).toEqual({ firstName: null, completeness: null });
    },
  );

  it("does not swallow a bug", async () => {
    api.getMyProfile.mockRejectedValue(new TypeError("boom"));
    await expect(DashboardLoader()).rejects.toThrow("boom");
  });
});
