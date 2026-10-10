// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboard } from "@/testing/fixtures";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({ getMyProfile: vi.fn(), getDashboard: vi.fn() }));
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
  return { ApiError, getMyProfile: api.getMyProfile, getDashboard: api.getDashboard };
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
  it("greets by first name, with the header's completeness and the API's dashboard", async () => {
    api.getMyProfile.mockResolvedValue(HEADER);
    api.getDashboard.mockResolvedValue(dashboard());
    const el = await DashboardLoader();
    expect(el.type).toBe(DashboardContent);
    expect(el.props.firstName).toBe("Ani");
    expect(el.props.completeness).toMatchObject({ percent: 33, next: "contact" });
    expect(el.props.dashboard.stats.projects.total).toBe(4);
  });

  it.each(["UNAUTHENTICATED", "API_UNREACHABLE", "API_NOT_CONFIGURED", "NOT_FOUND"])(
    "a profile failure (%s) leaves a generic welcome and the dashboard intact",
    async (code) => {
      api.getMyProfile.mockRejectedValue(new ApiError(503, code, "x"));
      api.getDashboard.mockResolvedValue(dashboard());
      const el = await DashboardLoader();
      expect(el.props.firstName).toBeNull();
      expect(el.props.completeness).toBeNull();
      expect(el.props.dashboard).not.toBeNull();
    },
  );

  it("a dashboard failure leaves the welcome card and a null dashboard, never zeros", async () => {
    api.getMyProfile.mockResolvedValue(HEADER);
    api.getDashboard.mockRejectedValue(new ApiError(503, "DATABASE_UNAVAILABLE", "x"));
    const el = await DashboardLoader();
    expect(el.props.firstName).toBe("Ani");
    expect(el.props.dashboard).toBeNull();
  });

  it("does not swallow a bug in either read", async () => {
    api.getMyProfile.mockResolvedValue(HEADER);
    api.getDashboard.mockRejectedValue(new TypeError("boom"));
    await expect(DashboardLoader()).rejects.toThrow("boom");
  });
});
