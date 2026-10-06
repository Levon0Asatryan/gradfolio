import { describe, expect, it } from "vitest";
import { profileCompleteness } from "./completeness";

const FULL = {
  name: "Ani Petrosyan",
  headline: "CS student",
  bio: "I like compilers.",
  location: "Yerevan",
  contactEmail: "ani@example.com",
  avatarUrl: "https://example.com/a.png",
};

describe("profileCompleteness", () => {
  it("is 100% with nothing next when every field is filled", () => {
    expect(profileCompleteness(FULL)).toEqual({
      percent: 100,
      steps: { basics: true, contact: true, photo: true },
      next: null,
    });
  });

  it("points at the first open step, in the order basics, contact, photo", () => {
    expect(profileCompleteness({ ...FULL, contactEmail: null, avatarUrl: null }).next).toBe(
      "contact",
    );
    expect(profileCompleteness({ ...FULL, avatarUrl: null }).next).toBe("photo");
    expect(profileCompleteness({ ...FULL, bio: null, avatarUrl: null }).next).toBe("basics");
  });

  it.each(["name", "headline", "bio", "location"] as const)(
    "does not count the basics done while %s is empty",
    (field) => {
      expect(profileCompleteness({ ...FULL, [field]: null }).steps.basics).toBe(false);
    },
  );

  it("treats whitespace as empty, and rounds a third to 33%", () => {
    const c = profileCompleteness({ ...FULL, contactEmail: "   ", avatarUrl: "" });
    expect(c.steps).toEqual({ basics: true, contact: false, photo: false });
    expect(c.percent).toBe(33);
  });
});
