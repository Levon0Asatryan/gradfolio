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

  it.each(["/", "/projects", "/authors", "/profile"])("renders %s as a Next Link", (href) => {
    expect(navLinkComponent(href)).toBe(Link);
  });

  it("renders a Next Link as a plain anchor when asked for a full load", () => {
    // A protected page for a visitor: the proxy redirects it to Auth0 (M4 F3).
    expect(navLinkComponent("/projects", true)).toBe("a");
  });
});
