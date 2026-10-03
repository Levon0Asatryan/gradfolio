import Link from "next/link";
import { describe, expect, it } from "vitest";
import { navLinkComponent } from "./navLinkComponent";

describe("navLinkComponent", () => {
  it.each(["/auth/login", "/auth/logout"])(
    "renders %s as a plain anchor (full page load)",
    (href) => {
      expect(navLinkComponent(href)).toBe("a");
    },
  );

  it.each(["/", "/projects", "/authors", "/profile/u_001"])("renders %s as a Next Link", (href) => {
    expect(navLinkComponent(href)).toBe(Link);
  });
});
