/**
 * Design tokens, palette C (blue + magenta + amber). One place for every colour:
 * the MUI theme (`utils/helpers/helpers.ts`) reads these and nothing else.
 * `tokens.test.ts` checks the contrast of every text pair below (WCAG AA, 4.5:1),
 * and `docs/ui-plan.md` records the numbers.
 */

export type ThemeMode = "light" | "dark";

export const PROJECT_CATEGORIES = [
  "course",
  "personal",
  "research",
  "hackathon",
  "academic",
  "other",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** Text colour on a tinted background, one pair per project category. */
export interface CategoryColor {
  fg: string;
  bg: string;
}

export interface ModeTokens {
  bg: string;
  paper: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  /** Text on a filled primary/secondary/accent/semantic colour. */
  on: string;
  category: Record<ProjectCategory, CategoryColor>;
}

export const TOKENS: Record<ThemeMode, ModeTokens> = {
  light: {
    bg: "#F6F8FC",
    paper: "#FFFFFF",
    text: "#0F172A",
    textSecondary: "#475569",
    primary: "#1D4ED8",
    secondary: "#BE185D",
    accent: "#B45309",
    success: "#15803D",
    warning: "#92400E",
    error: "#B91C1C",
    info: "#0369A1",
    on: "#FFFFFF",
    category: {
      course: { fg: "#1D4ED8", bg: "#DBEAFE" },
      personal: { fg: "#BE185D", bg: "#FCE7F3" },
      research: { fg: "#0F766E", bg: "#CCFBF1" },
      hackathon: { fg: "#C2410C", bg: "#FFEDD5" },
      academic: { fg: "#6D28D9", bg: "#EDE9FE" },
      other: { fg: "#475569", bg: "#E2E8F0" },
    },
  },
  dark: {
    bg: "#0B1220",
    paper: "#131C2E",
    text: "#E6EDF8",
    textSecondary: "#9FB0C9",
    primary: "#93C5FD",
    secondary: "#F9A8D4",
    accent: "#FCD34D",
    success: "#86EFAC",
    warning: "#FCD34D",
    error: "#FCA5A5",
    info: "#7DD3FC",
    on: "#0B0B14",
    category: {
      course: { fg: "#BFDBFE", bg: "#1E3A8A" },
      personal: { fg: "#FBCFE8", bg: "#831843" },
      research: { fg: "#99F6E4", bg: "#134E4A" },
      hackathon: { fg: "#FED7AA", bg: "#7C2D12" },
      academic: { fg: "#DDD6FE", bg: "#4C1D95" },
      other: { fg: "#CBD5E1", bg: "#334155" },
    },
  },
};

const channel = (hex: string, shift: number) => (parseInt(hex.slice(1), 16) >> shift) & 255;

/**
 * `a` mixed into `b` by `pct` percent, as a hex. Hex rather than CSS `color-mix`
 * because MUI parses palette colours (`divider`) and rejects `color-mix`.
 */
export const mix = (a: string, pct: number, b: string): string =>
  `#${[16, 8, 0]
    .map((s) =>
      Math.round((channel(a, s) * pct + channel(b, s) * (100 - pct)) / 100)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

const alpha = (hex: string, a: number) =>
  `rgb(${channel(hex, 16)} ${channel(hex, 8)} ${channel(hex, 0)} / ${a})`;

/** Derived surfaces, defined once so the theme and the contrast test agree. */
export function surfaces(mode: ThemeMode) {
  const k = TOKENS[mode];
  return {
    /** Hairline between a card and the page. */
    line: mix(k.text, 14, k.paper),
    /** Border of an input or an outlined control: at least 3:1 on paper (WCAG 1.4.11). */
    lineStrong: mix(k.text, 50, k.paper),
    /** Tint for hover and selected rows. */
    soft: mix(k.primary, 11, k.paper),
    brandGradient: `linear-gradient(135deg, ${k.primary}, ${k.secondary})`,
    shadow: `0 1px 2px ${alpha(k.text, 0.08)}, 0 8px 24px ${alpha(k.text, 0.07)}`,
  };
}

/** Radii in px, the only values the theme uses. */
export const RADIUS = { control: 12, button: 14, card: 20, dialog: 24, pill: 999 } as const;
