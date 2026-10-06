import { cookiesNavKey } from "@/utils/constants/constants";

/** `full`: labelled sidebar. `rail`: icon-over-label rail. */
export type NavMode = "full" | "rail";

/** The cookie value as a mode; anything else means no stored choice. */
export const parseNavMode = (value: string | undefined): NavMode | undefined =>
  value === "full" || value === "rail" ? value : undefined;

/** Stores the choice for a year; the layout reads it on the server. */
export const writeNavMode = (mode: NavMode): void => {
  document.cookie = `${cookiesNavKey}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
};

/**
 * A responsive value for a `sm`-and-up layout: `full` and `rail` hold at every
 * width from `sm`; with no stored choice the width decides (rail below `lg`).
 */
export const pickByMode = <T>(mode: NavMode | undefined, rail: T, full: T): { sm: T; lg: T } =>
  mode === "rail"
    ? { sm: rail, lg: rail }
    : mode === "full"
      ? { sm: full, lg: full }
      : { sm: rail, lg: full };
