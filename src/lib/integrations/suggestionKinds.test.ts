import { describe, expect, it } from "vitest";
import type { SuggestionItem } from "@/lib/api/types";
import { groupOf, isInboxItem, needsOverrides } from "./suggestionKinds";

type Kind = SuggestionItem["kind"];

describe("groupOf", () => {
  it.each<[Kind, string | null]>([
    ["profile.bio", "profile"],
    ["profile.avatarUrl", "profile"],
    ["skill.add", "skills"],
    ["profile.links.github", "links"],
    ["profile.links.twitter", "links"],
    // Every other repository is the import dialog's, not the inbox's.
    ["project.new", null],
    ["project.update", "projects"],
    ["education.add", "university"],
    ["experience.add", "university"],
    ["linkedin.reimport", null],
  ])("%s → %s", (kind, group) => {
    expect(groupOf(kind)).toBe(group);
  });
});

describe("isInboxItem", () => {
  it("lists open suggestions with a group, not answered ones or reminders", () => {
    const base = { kind: "skill.add", status: "open" } as SuggestionItem;
    expect(isInboxItem(base)).toBe(true);
    expect(isInboxItem({ ...base, status: "accepted" })).toBe(false);
    expect(isInboxItem({ ...base, kind: "linkedin.reimport" })).toBe(false);
  });
});

describe("needsOverrides", () => {
  it("is true for education and experience only", () => {
    expect(needsOverrides("education.add")).toBe(true);
    expect(needsOverrides("experience.add")).toBe(true);
    expect(needsOverrides("skill.add")).toBe(false);
    expect(needsOverrides("project.new")).toBe(false);
  });
});
