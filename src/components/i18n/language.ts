import type { Dictionary, Language } from "@/data/locales/types";

/** The BCP 47 tag for `<html lang>`: Armenian is `hy`. */
export const htmlLang = (language: Language): string => (language === "am" ? "hy" : language);

export const isLanguage = (value: unknown): value is Language =>
  value === "en" || value === "ru" || value === "am";

/** The dashboard's tab title. The page and the legacy-language migration build it the same way. */
export const dashboardTitle = (t: Dictionary): string => `${t.common.dashboard} | Gradfolio`;
