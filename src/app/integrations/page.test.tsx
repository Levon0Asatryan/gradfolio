import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getIntegrations: vi.fn() }));
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
  return { ApiError, getIntegrations: mocks.getIntegrations };
});
vi.mock("@/lib/requestDictionary", () => ({
  requestDictionary: async () => ({ integrations: { title: "Integrations" } }),
}));

const { default: Page, generateMetadata } = await import("./page");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("/integrations page", () => {
  it("renders the view with what the API says", async () => {
    const data = {
      github: { available: true, status: "connected", login: "ani-p", lastSyncedAt: null },
      linkedin: { status: "not_connected", lastSyncedAt: null },
    };
    mocks.getIntegrations.mockResolvedValue(data);
    const element = await Page();
    expect(element.props).toEqual({ integrations: data });
  });

  it("a failed load is the error component with the code, never a 'not connected' view", async () => {
    mocks.getIntegrations.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "x"));
    const element = await Page();
    expect(element.props).toEqual({ code: "API_UNREACHABLE", returnTo: "/integrations" });
  });

  it("rethrows what is not an API error", async () => {
    mocks.getIntegrations.mockRejectedValue(new TypeError("bug"));
    await expect(Page()).rejects.toThrow("bug");
  });

  it("titles the tab in the request's language", async () => {
    expect(await generateMetadata()).toEqual({ title: "Integrations" });
  });
});
