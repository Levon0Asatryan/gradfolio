import { describe, expect, it } from "vitest";
import type { GithubDraft } from "@/lib/api/types";
import { initialDraft, overridesFor, plainText, splitTechnologies } from "./model";

const preview = (over: Partial<GithubDraft> = {}): GithubDraft => ({
  title: "thesis-tracker",
  summary: "Tracks theses",
  descriptionHtml: "<p>Readme</p>",
  technologies: ["TypeScript", "Go"],
  links: [],
  repoUrl: "https://github.com/ani-p/thesis-tracker",
  isPublic: true,
  ...over,
});

describe("overridesFor", () => {
  it("starts from the API's preview", () => {
    expect(initialDraft(preview())).toEqual({
      title: "thesis-tracker",
      summary: "Tracks theses",
      technologies: "TypeScript, Go",
    });
    expect(initialDraft(preview({ summary: null })).summary).toBe("");
  });
  it("sends nothing for a draft the student did not change", () => {
    const p = preview();
    expect(overridesFor({ 7: p }, { 7: initialDraft(p) })).toEqual({});
  });
  it("sends only the fields that differ, keyed by repository id", () => {
    const p = preview();
    const draft = { ...initialDraft(p), title: " Thesis ", technologies: "Go, Rust" };
    expect(overridesFor({ 7: p }, { 7: draft })).toEqual({
      "7": { title: "Thesis", technologies: ["Go", "Rust"] },
    });
  });
  it("an emptied summary clears it (null), it is not left out", () => {
    const p = preview();
    expect(overridesFor({ 7: p }, { 7: { ...initialDraft(p), summary: "  " } })).toEqual({
      "7": { summary: null },
    });
  });
  it("splits technologies on commas and drops blanks", () => {
    expect(splitTechnologies(" a, ,b ,,c ")).toEqual(["a", "b", "c"]);
  });
});

describe("plainText", () => {
  it("reads the README as text and never as markup", () => {
    const text = plainText(
      "<p>Hello <img src=x onerror=alert(1)> <b>world</b></p><script>boom()</script>",
    );
    expect(text).toContain("Hello");
    expect(text).toContain("world");
    expect(document.querySelector("img")).toBeNull();
  });
  it("is empty for nothing and cut when long", () => {
    expect(plainText(null)).toBe("");
    expect(plainText(`<p>${"a".repeat(2000)}</p>`).length).toBeLessThanOrEqual(701);
  });
});
