import { describe, expect, it } from "vitest";
import type { GithubRepo } from "@/lib/api/types";
import { editsFor, initialDraft, splitTechnologies } from "./model";

const repo = (over: Partial<GithubRepo> = {}): GithubRepo => ({
  repoId: 7,
  fullName: "ani-p/thesis-tracker",
  description: "Tracks theses",
  language: "TypeScript",
  stars: 3,
  forks: 0,
  fork: false,
  archived: false,
  pushedAt: null,
  imported: false,
  projectId: null,
  ...over,
});

describe("editsFor", () => {
  it("starts from the repository's own facts", () => {
    expect(initialDraft(repo())).toEqual({
      title: "thesis-tracker",
      summary: "Tracks theses",
      technologies: "TypeScript",
      repoUrl: "https://github.com/ani-p/thesis-tracker",
    });
  });
  it("sends nothing for a draft the user did not change", () => {
    const r = repo();
    expect(editsFor([r], { 7: initialDraft(r) })).toEqual({});
  });
  it("sends only the fields that differ, so the rest stays what GitHub gave", () => {
    const r = repo();
    const draft = { ...initialDraft(r), title: " Thesis ", technologies: "Go, Rust" };
    expect(editsFor([r], { 7: draft })).toEqual({
      "7": { title: "Thesis", technologies: ["Go", "Rust"] },
    });
  });
  it("splits technologies on commas and drops blanks", () => {
    expect(splitTechnologies(" a, ,b ,,c ")).toEqual(["a", "b", "c"]);
  });
});
