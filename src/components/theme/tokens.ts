/**
 * Design tokens, palette C, calm (muted blue, with magenta and amber only as small accents). One place for every colour:
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
    bg: "#F4F6F9",
    paper: "#FFFFFF",
    text: "#1E293B",
    textSecondary: "#516072",
    primary: "#2D4E8A",
    secondary: "#8E3B65",
    accent: "#8F5A14",
    success: "#2E7650",
    warning: "#855410",
    error: "#A33440",
    info: "#2B6A91",
    on: "#FFFFFF",
    category: {
      course: { fg: "#2D4E8A", bg: "#E4EAF4" },
      personal: { fg: "#85365D", bg: "#F4E7EE" },
      research: { fg: "#1F6159", bg: "#E1F0EC" },
      hackathon: { fg: "#8A4A1C", bg: "#F7EADD" },
      academic: { fg: "#58429A", bg: "#EBE7F5" },
      other: { fg: "#4A5565", bg: "#E9ECF0" },
    },
  },
  dark: {
    bg: "#0F151F",
    paper: "#171F2C",
    text: "#E4EAF3",
    textSecondary: "#9BA8BB",
    primary: "#8FB0E8",
    secondary: "#D79CBA",
    accent: "#DDB36A",
    success: "#82C99C",
    warning: "#DDB36A",
    error: "#EA9CA2",
    info: "#8DBAD8",
    on: "#0B0F18",
    category: {
      course: { fg: "#C5D6F1", bg: "#26385A" },
      personal: { fg: "#EBC4D6", bg: "#4D2A3F" },
      research: { fg: "#B5E0D8", bg: "#1F4540" },
      hackathon: { fg: "#F0CDB0", bg: "#51341C" },
      academic: { fg: "#D3C9F0", bg: "#3B3060" },
      other: { fg: "#CBD3DE", bg: "#313B4A" },
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
