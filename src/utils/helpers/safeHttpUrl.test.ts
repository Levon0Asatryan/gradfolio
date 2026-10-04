import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "./safeHttpUrl";

describe("safeHttpUrl", () => {
  it.each(["https://lh3.googleusercontent.com/a/x", "http://example.com/a.png"])(
    "keeps %s",
    (url) => {
      expect(safeHttpUrl(url)).toBe(url);
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
    expect(safeHttpUrl(url)).toBeUndefined();
  });
});
