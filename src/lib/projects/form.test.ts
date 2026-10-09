import { describe, expect, it } from "vitest";
import { projectDetail } from "@/testing/fixtures";
import {
  EMPTY_PROJECT,
  isEmptyDescription,
  isIsoDate,
  normalizeTerms,
  parseProjectForm,
  toFormValues,
} from "./form";

const ok = (over: Record<string, unknown> = {}) =>
  parseProjectForm({ ...EMPTY_PROJECT, title: "EcoRoute", ...over });
const errors = (over: Record<string, unknown>) => {
  const r = ok(over);
  if (r.ok) throw new Error("expected errors");
  return r.errors;
};

describe("parseProjectForm", () => {
  it("shapes the body: trimmed, blank -> null, defaults kept", () => {
    const r = ok({ title: "  EcoRoute  ", summary: "  ", course: " DB ", category: "course" });
    expect(r).toEqual({
      ok: true,
      body: {
        title: "EcoRoute",
        summary: null,
        descriptionHtml: null,
        category: "course",
        status: "ongoing",
        isPublic: true,
        isDraft: false,
        liveDemoUrl: null,
        repoUrl: null,
        heroImageUrl: null,
        technologies: [],
        tags: [],
        links: [],
        metadata: { startDate: null, endDate: null, course: "DB", professor: null },
      },
    });
  });

  it("requires a title", () => {
    expect(errors({ title: "   " })).toEqual({ title: "required" });
  });

  it.each([
    ["title", "x".repeat(501)],
    ["course", "x".repeat(501)],
    ["professor", "x".repeat(501)],
  ])("%s: 500 characters fit, 501 do not (characters, not UTF-16 units)", (key, tooLong) => {
    expect(ok({ [key]: "x".repeat(500) }).ok).toBe(true);
    expect(errors({ [key]: tooLong })[key]).toBe("too_long");
    // 500 astral characters are 1000 UTF-16 units and still fit.
    expect(ok({ [key]: "😀".repeat(500) }).ok).toBe(true);
  });

  it("measures the summary in bytes", () => {
    expect(ok({ summary: "x".repeat(65_535) }).ok).toBe(true);
    expect(errors({ summary: "x".repeat(65_536) }).summary).toBe("too_long");
    expect(errors({ summary: "я".repeat(32_768) }).summary).toBe("too_long");
  });

  it("measures the description in bytes and treats the editor's empty document as none", () => {
    expect(errors({ descriptionHtml: `<p>${"x".repeat(100_000)}</p>` }).descriptionHtml).toBe(
      "too_long",
    );
    for (const empty of ["", "<p></p>", "<p><br></p>", " <p> </p> "]) {
      expect(isEmptyDescription(empty)).toBe(true);
      const r = ok({ descriptionHtml: empty });
      expect(r.ok && r.body.descriptionHtml).toBeNull();
    }
    const r = ok({ descriptionHtml: "<p>x</p>" });
    expect(r.ok && r.body.descriptionHtml).toBe("<p>x</p>");
  });

  it.each([
    ["liveDemoUrl", "javascript:alert(1)"],
    ["liveDemoUrl", "ftp://x.test"],
    ["repoUrl", "not a url"],
    ["liveDemoUrl", "https://user:pw@x.test"],
    ["heroImageUrl", "http://x.test/a.png"],
  ])("%s refuses %s", (key, value) => {
    expect(errors({ [key]: value })[key]).toBe("invalid_url");
  });

  it("takes http for links and https for the cover", () => {
    expect(ok({ liveDemoUrl: "http://x.test", repoUrl: "https://github.com/a/b" }).ok).toBe(true);
    expect(ok({ heroImageUrl: "https://x.test/a.png" }).ok).toBe(true);
  });

  it("checks dates are real and the end is not before the start", () => {
    expect(isIsoDate("2025-02-30")).toBe(false);
    expect(isIsoDate("0999-12-31")).toBe(false);
    expect(isIsoDate("2025-09-01")).toBe(true);
    expect(errors({ startDate: "2025-02-30" }).startDate).toBe("invalid");
    expect(errors({ startDate: "2025-09-02", endDate: "2025-09-01" }).endDate).toBe(
      "invalid_range",
    );
    expect(ok({ startDate: "2025-09-01", endDate: "2025-09-01" }).ok).toBe(true);
    expect(ok({ endDate: "2025-09-01" }).ok).toBe(true);
  });

  it("normalizes terms like the API and caps their number", () => {
    expect(normalizeTerms(["  React ", "react", "", "Type   Script", "Type Script"])).toEqual([
      "React",
      "Type Script",
    ]);
    const thirtyOne = Array.from({ length: 31 }, (_, i) => `t${i}`);
    expect(errors({ technologies: thirtyOne }).technologies).toBe("too_many");
    expect(ok({ technologies: thirtyOne.slice(0, 30) }).ok).toBe(true);
    const twentyOne = Array.from({ length: 21 }, (_, i) => `g${i}`);
    expect(errors({ tags: twentyOne }).tags).toBe("too_many");
    expect(errors({ tags: ["x".repeat(256)] }).tags).toBe("too_long");
  });

  it("checks link rows: blank rows go, half rows fail, bad URLs fail, 10 at most", () => {
    const r = ok({
      links: [
        { label: "", url: "" },
        { label: "Docs", url: " https://docs.test " },
      ],
    });
    expect(r.ok && r.body.links).toEqual([{ label: "Docs", url: "https://docs.test" }]);
    expect(errors({ links: [{ label: "A", url: "" }] })["links.0"]).toBe("required");
    expect(errors({ links: [{ label: "A", url: "javascript:1" }] })["links.0"]).toBe("invalid_url");
    const eleven = Array.from({ length: 11 }, (_, i) => ({
      label: `l${i}`,
      url: "https://x.test",
    }));
    expect(errors({ links: eleven }).links).toBe("too_many");
  });

  it("refuses unknown keys, wrong types and bad enums, so a crafted action call fails", () => {
    expect(errors({ userId: "someone", isOwner: true })).toMatchObject({
      userId: "invalid",
      isOwner: "invalid",
    });
    expect(errors({ category: "games" }).category).toBe("invalid");
    expect(errors({ status: 3 }).status).toBe("invalid");
    expect(errors({ isPublic: "yes" }).isPublic).toBe("invalid");
    expect(parseProjectForm("x")).toEqual({ ok: false, errors: { _: "invalid" } });
    expect(parseProjectForm(null).ok).toBe(false);
  });
});

describe("toFormValues", () => {
  it("round-trips a stored project through the form's check", () => {
    const values = toFormValues(
      projectDetail({
        summary: null,
        links: [{ label: "Docs", url: "https://docs.test" }],
        technologies: ["Python"],
        category: "research",
      }),
    );
    expect(values.summary).toBe("");
    const r = parseProjectForm(values);
    expect(r.ok && r.body).toMatchObject({
      summary: null,
      category: "research",
      technologies: ["Python"],
      links: [{ label: "Docs", url: "https://docs.test" }],
      liveDemoUrl: "https://demo.example.com",
    });
  });
});
