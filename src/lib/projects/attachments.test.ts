import { describe, expect, it } from "vitest";
import { parseAttachment } from "./attachments";

const ok = (over: Record<string, unknown> = {}) =>
  parseAttachment({ type: "link", url: "https://x.test/a", title: "", ...over });
const errors = (over: Record<string, unknown>) => {
  const r = ok(over);
  if (r.ok) throw new Error("expected errors");
  return r.errors;
};

describe("parseAttachment", () => {
  it("shapes the body: trimmed, blank title -> null", () => {
    expect(ok({ url: " https://x.test/a ", title: "  " })).toEqual({
      ok: true,
      body: { type: "link", url: "https://x.test/a", title: null },
    });
    expect(ok({ title: " Docs " })).toMatchObject({ body: { title: "Docs" } });
  });

  it.each([
    "http://x.test/a",
    "javascript:alert(1)",
    "ftp://x.test",
    "//x.test/a",
    "not a url",
    "https://u:p@x.test/a",
  ])("refuses %s for every type: https only, no credentials", (url) => {
    for (const type of ["image", "video", "pdf", "link"]) {
      expect(errors({ type, url }).url).toBe("invalid_url");
    }
  });

  it("needs an address", () => {
    expect(errors({ url: "  " }).url).toBe("required");
  });

  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", true],
    ["https://youtu.be/dQw4w9WgXcQ", true],
    ["https://vimeo.com/123456", true],
    ["https://evil.test/https://youtube.com/watch", false],
    ["https://youtube.com.evil.test/watch", false],
    ["https://notyoutube.com/watch", false],
  ])("a video on %s -> %s", (url, allowed) => {
    const r = ok({ type: "video", url });
    expect(r.ok).toBe(allowed);
    if (!r.ok) expect(r.errors.url).toBe("invalid_host");
  });

  it("limits the title to 500 characters, counted as characters", () => {
    expect(ok({ title: "x".repeat(500) }).ok).toBe(true);
    expect(ok({ title: "😀".repeat(500) }).ok).toBe(true);
    expect(errors({ title: "x".repeat(501) }).title).toBe("too_long");
  });

  it("refuses an unknown type, unknown keys and a non-object", () => {
    expect(errors({ type: "zip" }).type).toBe("invalid");
    expect(errors({ id: "x", userId: "y" })).toMatchObject({ id: "invalid", userId: "invalid" });
    expect(parseAttachment(null)).toEqual({ ok: false, errors: { _: "invalid" } });
  });
});
