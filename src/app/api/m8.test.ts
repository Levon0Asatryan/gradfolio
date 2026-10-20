// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  generateResume: vi.fn(),
  getEmailPreferences: vi.fn(),
  updateEmailPreferences: vi.fn(),
  unsubscribeInvitationEmail: vi.fn(),
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
  return { ...api, ApiError };
});
const { POST: resume } = await import("./resume/route");
const { GET: getPreferences, PATCH: patchPreferences } = await import("./email-preferences/route");
const { POST: unsubscribe } = await import("./email/unsubscribe/route");
const { ApiError } = await import("@/lib/api/client");
const req = (path: string, body: unknown, origin = "https://app.example", method = "POST") =>
  new NextRequest(`https://app.example/api/${path}`, {
    method,
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => vi.resetAllMocks());

describe("M8 server routes", () => {
  it("returns binary without exposing the API token and rejects cross-origin, oversized and forged requests", async () => {
    api.generateResume.mockResolvedValue(new TextEncoder().encode("%PDF-test"));
    const response = await resume(req("resume", { sections: ["bio"], language: "am" }));
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toBe("%PDF-test");
    expect((await resume(req("resume", { sections: [] }, "https://evil.example"))).status).toBe(
      403,
    );
    expect((await resume(req("resume", { sections: [], userId: "other" }))).status).toBe(400);
    expect((await resume(req("resume", { sections: [], extra: "x".repeat(17_000) }))).status).toBe(
      413,
    );
    expect(api.generateResume).toHaveBeenCalledOnce();
  });
  it("forwards an expired session as a safe code", async () => {
    api.generateResume.mockRejectedValue(new ApiError(401, "UNAUTHENTICATED", "private detail"));
    const response = await resume(req("resume", { sections: [] }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "UNAUTHENTICATED" });
  });
  it("saves only valid email preferences through the current session", async () => {
    api.getEmailPreferences.mockResolvedValue({
      preferredLanguage: "am",
      teamInvitesEnabled: true,
    });
    expect((await getPreferences()).status).toBe(200);
    api.updateEmailPreferences.mockResolvedValue({
      preferredLanguage: "am",
      teamInvitesEnabled: false,
    });
    const response = await patchPreferences(
      req("email-preferences", { teamInvitesEnabled: false }, "https://app.example", "PATCH"),
    );
    expect(await response.json()).toMatchObject({ teamInvitesEnabled: false });
    expect(
      (
        await patchPreferences(
          req("email-preferences", { userId: "other" }, "https://app.example", "PATCH"),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await patchPreferences(
          req("email-preferences", { teamInvitesEnabled: true }, "https://evil.example", "PATCH"),
        )
      ).status,
    ).toBe(403);
    expect(api.updateEmailPreferences).toHaveBeenCalledOnce();
  });
  it("requires a bounded unsubscribe token and same origin", async () => {
    api.unsubscribeInvitationEmail.mockResolvedValue({ unsubscribed: true });
    expect((await unsubscribe(req("email/unsubscribe", { token: "signed-token" }))).status).toBe(
      200,
    );
    expect((await unsubscribe(req("email/unsubscribe", { token: "x".repeat(1001) }))).status).toBe(
      400,
    );
    expect(
      (
        await unsubscribe(
          req("email/unsubscribe", { token: "signed-token" }, "https://evil.example"),
        )
      ).status,
    ).toBe(403);
    expect(api.unsubscribeInvitationEmail).toHaveBeenCalledOnce();
  });
});
