import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("web app manifest", () => {
  it("names the app and points at icons that exist", () => {
    const m = manifest();
    expect(m.name).toBe("Gradfolio");
    expect(m.theme_color).toBe("#1D4ED8");
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
    for (const icon of m.icons ?? []) {
      expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });

  it("ships the logo files the layout and Auth0 use", () => {
    for (const f of [
      "logo-mark.svg",
      "logo-horizontal.svg",
      "logo-horizontal-dark.svg",
      "auth0-logo-512.png",
    ]) {
      expect(existsSync(join(process.cwd(), "public", "brand", f))).toBe(true);
    }
  });
});
