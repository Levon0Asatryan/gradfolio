import { createTheme, getContrastRatio } from "@mui/material/styles";
import { describe, expect, it } from "vitest";
import { getTheme } from "./utils/helpers/helpers";

/**
 * A contained button turns to `palette.<colour>.dark` on hover (MUI derives it by darkening
 * `main`, which in dark mode, where the label is dark, drops the label below 4.5:1: axe found
 * 4.46:1 on the primary button). Judged on the real MUI theme, not on the tokens.
 */
const NAMES = ["primary", "secondary", "accent", "success", "warning", "error", "info"] as const;

describe.each(["light", "dark"] as const)("%s mode: a hovered contained button", (mode) => {
  const palette = createTheme(getTheme(mode)).palette;
  it.each(NAMES)("%s keeps its label at 4.5:1 or better", (name) => {
    const c = palette[name];
    expect(getContrastRatio(c.contrastText, c.dark)).toBeGreaterThanOrEqual(4.5);
  });
});
