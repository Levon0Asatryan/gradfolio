import type { PaletteMode, ThemeOptions } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { RADIUS, TOKENS, surfaces } from "@/components/theme/tokens";

/**
 * Nunito covers Latin and Cyrillic; Noto Sans Armenian covers Armenian, which
 * Nunito has no glyphs for (the browser would otherwise pick a system font).
 * Both come from `next/font` in the layout, which sets these variables.
 */
const FONT_STACK =
  'var(--font-nunito), var(--font-noto-armenian), "Segoe UI", system-ui, -apple-system, sans-serif';

const heading = { fontWeight: 800, textWrap: "balance" } as const;

export const getTheme = (mode: PaletteMode): ThemeOptions => {
  const k = TOKENS[mode];
  const s = surfaces(mode);
  const color = (main: string) => ({ main, contrastText: k.on });
  const focusRing = `3px solid ${k.primary}`;
  // Touch devices get 44px targets; a mouse keeps the compact size.
  const coarse = "@media (pointer: coarse)";

  // MUI wants 25 shadows; the soft card shadow replaces the harsh defaults.
  const shadows = createTheme().shadows.map((v, i) => (i === 0 ? v : i <= 8 ? s.shadow : v));

  return {
    palette: {
      mode,
      primary: color(k.primary),
      secondary: color(k.secondary),
      accent: color(k.accent),
      success: color(k.success),
      warning: color(k.warning),
      error: color(k.error),
      info: color(k.info),
      text: { primary: k.text, secondary: k.textSecondary },
      background: { default: k.bg, paper: k.paper },
      divider: s.line,
      navigation: { main: k.paper },
      category: k.category,
      surface: {
        line: s.line,
        lineStrong: s.lineStrong,
        soft: s.soft,
        gradient: s.brandGradient,
        shadow: s.shadow,
      },
    },
    shape: { borderRadius: RADIUS.control },
    spacing: 8,
    shadows: shadows as ThemeOptions["shadows"],
    typography: {
      fontFamily: FONT_STACK,
      h1: { ...heading, fontSize: "2.5rem", lineHeight: 1.15 },
      h2: { ...heading, fontSize: "2.25rem", lineHeight: 1.15 },
      h3: { ...heading, fontSize: "2rem", lineHeight: 1.2 },
      h4: { ...heading, fontSize: "1.875rem", lineHeight: 1.2 },
      h5: { ...heading, fontSize: "1.5rem", lineHeight: 1.25 },
      h6: { ...heading, fontSize: "1.1875rem", lineHeight: 1.3 },
      subtitle1: { fontSize: "1.0625rem", fontWeight: 600, lineHeight: 1.4 },
      subtitle2: { fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.4 },
      body1: { fontSize: "1rem", lineHeight: 1.5 },
      body2: { fontSize: "0.9375rem", lineHeight: 1.5 },
      button: { fontWeight: 800, textTransform: "none", letterSpacing: 0 },
      caption: { fontSize: "0.8125rem", lineHeight: 1.4 },
      overline: { fontWeight: 800, letterSpacing: "0.06em", lineHeight: 1.4 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { WebkitTextSizeAdjust: "100%" },
          ":focus-visible": { outline: focusRing, outlineOffset: 2 },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              transitionDuration: "0.01ms !important",
              animationDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: RADIUS.button,
            minHeight: 44,
            paddingInline: 20,
            lineHeight: 1.2,
          },
          sizeSmall: { minHeight: 36, paddingInline: 14, [coarse]: { minHeight: 44 } },
          outlined: { borderWidth: 2, "&:hover": { borderWidth: 2 } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: RADIUS.control, "&:hover": { backgroundColor: s.soft } },
          sizeSmall: { [coarse]: { padding: 12 } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.card,
            border: `1px solid ${s.line}`,
            boxShadow: "none",
          },
        },
      },
      MuiCardHeader: { styleOverrides: { root: { padding: 20 } } },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 20,
            "&:last-child": { paddingBottom: 20 },
            // Under a CardHeader the header's own padding already sits above.
            ".MuiCardHeader-root + &": { paddingTop: 0 },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 700, height: 32, borderRadius: RADIUS.pill },
          sizeSmall: { height: 28 },
          colorDefault: { backgroundColor: s.soft, color: k.primary },
          outlined: { borderColor: s.lineStrong },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.control,
            backgroundColor: k.paper,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: s.lineStrong },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: k.text },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: k.primary,
              borderWidth: 2,
            },
          },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiFormHelperText: {
        styleOverrides: { root: { fontSize: "0.8125rem", fontWeight: 600, marginInline: 4 } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: RADIUS.dialog, boxShadow: "0 20px 60px rgb(0 0 0 / 0.35)" },
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 800, fontSize: "1.3125rem" } } },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 3, borderRadius: 3 },
        },
      },
      MuiTab: { styleOverrides: { root: { minHeight: 44, fontWeight: 800 } } },
      MuiSwitch: {
        styleOverrides: {
          track: { backgroundColor: s.lineStrong, opacity: 1, borderRadius: RADIUS.pill },
          switchBase: {
            "&.Mui-checked + .MuiSwitch-track": { opacity: 1 },
          },
        },
      },
      MuiSnackbarContent: { styleOverrides: { root: { borderRadius: RADIUS.button } } },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: RADIUS.button, fontWeight: 600 },
          standard: { color: k.text },
        },
      },
      MuiLink: { defaultProps: { underline: "hover" } },
      MuiTooltip: {
        styleOverrides: { tooltip: { borderRadius: 8, fontWeight: 600, fontSize: "0.8125rem" } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.button,
            minHeight: 44,
            "&.Mui-selected": { backgroundColor: s.soft },
          },
        },
      },
    },
  };
};
