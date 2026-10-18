import { describe, expect, it } from "vitest";
import { en } from "@/data/locales/en";
import { navItems } from "./navItems";

describe("navItems and full page loads (M4 F3)", () => {
  it("offers only public destinations and an explicit sign-in link to guests", () => {
    const items = navItems(en, false);
    expect(items.map((i) => i.href)).toEqual([
      "/search",
      "/browse/projects",
      "/browse/people",
      "/settings",
      "/auth/login",
    ]);
    // Public pages keep client-side navigation and prefetch.
    for (const href of ["/search", "/settings"]) {
      expect(items.find((i) => i.href === href)?.fullLoad).toBeFalsy();
    }
  });

  it("marks nothing for a signed-in user", () => {
    expect(navItems(en, true).some((i) => i.fullLoad)).toBe(false);
    expect(navItems(en, true).find((i) => i.href === "/projects")?.label).toBe("My projects");
    expect(navItems(en, true).find((i) => i.href === "/browse/projects")?.label).toBe(
      "Public projects",
    );
  });
});
