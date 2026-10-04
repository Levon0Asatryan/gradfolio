import { describe, expect, it } from "vitest";
import { safeImageUrl } from "./safeImageUrl";

describe("safeImageUrl", () => {
  it.each(["https://lh3.googleusercontent.com/a/x", "http://example.com/a.png"])(
    "keeps %s",
    (url) => {
      expect(safeImageUrl(url)).toBe(url);
    },
  );

  it.each([
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "//evil.example/a.png",
    "/relative.png",
    "not a url",
    "",
    null,
    undefined,
  ])("drops %j", (url) => {
    expect(safeImageUrl(url)).toBeUndefined();
  });
});
