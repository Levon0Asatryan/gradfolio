import { htmlLang } from "@/components/i18n/language";
import type { Language } from "@/data/locales/types";

/**
 * A calendar day ("Dec 6, 2025") in the UI language, in UTC. Server and browser
 * must print the same text or React reports a hydration mismatch: `formatDate`
 * uses the machine's locale and time zone, which differ between them.
 */
export const formatDay = (iso: string, language: Language): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(htmlLang(language), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
};
