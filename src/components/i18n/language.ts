import type { Language } from "@/data/locales/types";

/** The BCP 47 tag for `<html lang>`: Armenian is `hy`. */
export const htmlLang = (language: Language): string => (language === "am" ? "hy" : language);

export const isLanguage = (value: unknown): value is Language =>
  value === "en" || value === "ru" || value === "am";
