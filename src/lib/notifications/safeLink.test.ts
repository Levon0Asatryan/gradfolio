import { describe, expect, it } from "vitest";
import { safeAppPath } from "./safeLink";

describe("safeAppPath", () => {
  it("keeps an app path and null stays null", () => {
    expect(safeAppPath("/projects/0b6f2c1e-1111-4222-8333-444455556666")).toBe(
      "/projects/0b6f2c1e-1111-4222-8333-444455556666",
    );
    expect(safeAppPath(null)).toBeNull();
  });

  it.each([
    "//evil.example/x",
    "/\\evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "projects/1",
    "",
    "/a b",
    "/a\nb",
    "/a\u0000b",
  ])("refuses %j", (link) => {
    expect(safeAppPath(link)).toBeNull();
  });
});
