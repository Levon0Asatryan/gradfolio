// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({ getMe: vi.fn(), getMyProfile: vi.fn() }));
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

const { default: AccountPage } = await import("./page");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("/account", () => {
  it("reads the profile only after GET /v1/me has created the account", async () => {
    let finishMe: (v: unknown) => void = () => {};
    api.getMe.mockReturnValue(new Promise((resolve) => (finishMe = resolve)));
    api.getMyProfile.mockResolvedValue({ isPublic: true, contactEmail: null });
    const page = AccountPage();
    await Promise.resolve();
    expect(api.getMyProfile).not.toHaveBeenCalled();
    finishMe({ id: "u" });
    const el = await page;
    expect(api.getMyProfile).toHaveBeenCalledTimes(1);
    expect(el.props.result).toMatchObject({ settings: { isPublic: true, contactEmail: null } });
  });

  it("shows an API failure as an error", async () => {
    api.getMe.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "x"));
    const el = await AccountPage();
    expect(el.props.result).toEqual({ errorCode: "API_UNREACHABLE" });
    expect(api.getMyProfile).not.toHaveBeenCalled();
  });
});
