import { describe, expect, it } from "vitest";
import { en } from "@/data/locales/en";
import { navItems } from "./navItems";

describe("navItems and full page loads (M4 F3)", () => {
  it("marks every protected page a visitor sees, so no client-side fetch is redirected to Auth0", () => {
    const items = navItems(en, false);
    const full = items.filter((i) => i.fullLoad).map((i) => i.href);
    expect(full).toEqual(
      expect.arrayContaining(["/", "/profile", "/projects", "/teams", "/integrations", "/account"]),
    );
    // Public pages keep client-side navigation and prefetch.
    for (const href of ["/search", "/settings"]) {
      expect(items.find((i) => i.href === href)?.fullLoad).toBeFalsy();
    }
  });

  it("marks nothing for a signed-in user", () => {
    expect(navItems(en, true).some((i) => i.fullLoad)).toBe(false);
  });
});
