import { describe, expect, it } from "vitest";
import { enabledInOrder, moveAmongEnabled, moveItem, type ResumeSection } from "./order";

const order: ResumeSection[] = ["contact", "bio", "education", "experience", "projects"];

describe("moveItem", () => {
  it("moves one place up and down", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });
  it("returns the same list at either end and for a bad index", () => {
    const list = ["a", "b"];
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 1, 1)).toBe(list);
    expect(moveItem(list, 5, -1)).toBe(list);
  });
  it("does not change its input", () => {
    const list = ["a", "b"];
    moveItem(list, 0, 1);
    expect(list).toEqual(["a", "b"]);
  });
});

describe("moveAmongEnabled", () => {
  const enabled = new Set<ResumeSection>(["bio", "experience", "projects"]);
  it("swaps with the next block that is on and leaves blocks that are off in place", () => {
    expect(moveAmongEnabled(order, enabled, "experience", -1)).toEqual([
      "contact",
      "experience",
      "education",
      "bio",
      "projects",
    ]);
  });
  it("does not move past the first or last block that is on", () => {
    expect(moveAmongEnabled(order, enabled, "bio", -1)).toBe(order);
    expect(moveAmongEnabled(order, enabled, "projects", 1)).toBe(order);
  });
  it("ignores a block that is off", () => {
    expect(moveAmongEnabled(order, enabled, "education", 1)).toBe(order);
  });
});

describe("enabledInOrder", () => {
  it("lists only blocks that are on, in the arranged order", () => {
    expect(enabledInOrder(["skills", "bio", "contact"], new Set(["bio", "skills"]))).toEqual([
      "skills",
      "bio",
    ]);
  });
});
