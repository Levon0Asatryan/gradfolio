import { describe, expect, it } from "vitest";
import { PROJECT_CATEGORIES, TOKENS, mix, type ThemeMode } from "./tokens";

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};
/** WCAG 2.x contrast ratio. */
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
const MODES: ThemeMode[] = ["light", "dark"];

describe.each(MODES)("palette C, %s: WCAG AA (4.5:1) for every text pair", (mode) => {
  const k = TOKENS[mode];
  const colours = [
    "primary",
    "secondary",
    "accent",
    "success",
    "warning",
    "error",
    "info",
  ] as const;

  it("body text on the page and on cards", () => {
    for (const fg of [k.text, k.textSecondary]) {
      expect(contrast(fg, k.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fg, k.paper)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(colours)("%s as text on a card, and the label on a filled %s", (name) => {
    expect(contrast(k[name], k.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(k.on, k[name])).toBeGreaterThanOrEqual(4.5);
  });

  it("the brand gradient carries white-or-dark text across both ends", () => {
    expect(contrast(k.on, k.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(k.on, k.secondary)).toBeGreaterThanOrEqual(4.5);
  });

  it("primary text on the selected-row tint", () => {
    expect(contrast(k.primary, mix(k.primary, 11, k.paper))).toBeGreaterThanOrEqual(4.5);
  });

  it("input borders reach 3:1 against the card (WCAG 1.4.11)", () => {
    expect(contrast(mix(k.text, 50, k.paper), k.paper)).toBeGreaterThanOrEqual(3);
  });

  it.each(PROJECT_CATEGORIES)("category %s: text on its tint", (category) => {
    const { fg, bg } = k.category[category];
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
