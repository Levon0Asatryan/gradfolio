import { describe, expect, it } from "vitest";
import { isProtectedPath } from "./routePolicy";

describe("isProtectedPath", () => {
  it.each([
    "/",
    "/dashboard",
    "/profile",
    "/profile/edit",
    "/projects",
    "/projects/",
    "/projects/new",
    "/projects/abc-123/edit",
    "/teams",
    "/teams/",
    "/integrations",
    "/integrations/connections",
    "/account",
  ])("requires a login for %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each([
    "/profile/u_001",
    "/profile/0b6f2c1e-1111-4222-8333-444455556666",
    "/projects/abc-123",
    "/search",
    "/tags/ml",
    "/tags/C%23",
    "/settings",
    "/auth/login",
    "/auth/callback",
    "/integrationsx",
    "/projects/abc/edit/more",
  ])("leaves %s public", (path) => {
    expect(isProtectedPath(path)).toBe(false);
  });
});
