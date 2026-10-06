import type { PaletteColor, PaletteColorOptions } from "@mui/material/styles";
import type { CategoryColor, ProjectCategory } from "@/components/theme/tokens";

export type { ThemeMode } from "@/components/theme/tokens";

declare module "@mui/material/styles" {
  interface Palette {
    navigation: { main: string };
    accent: PaletteColor;
    /** Text and background of each project category's chip. */
    category: Record<ProjectCategory, CategoryColor>;
    /** Hairline, strong (input) border, selected-row tint, brand gradient, card shadow. */
    surface: { line: string; lineStrong: string; soft: string; gradient: string; shadow: string };
  }
  interface PaletteOptions {
    navigation?: { main?: string };
    accent?: PaletteColorOptions;
    category?: Record<ProjectCategory, CategoryColor>;
    surface?: { line: string; lineStrong: string; soft: string; gradient: string; shadow: string };
  }
}
