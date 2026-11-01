import type { Language } from "@/data/locales/types";

export interface GuideShot {
  /** Under `public/`, e.g. `/linkedin-export/en/download-my-data.png`. */
  src: string;
  alt: string;
}

/**
 * Screenshots of LinkedIn's own pages for the wizard's first step, per interface language.
 * Empty on purpose: they are queue item M7-T7 and are taken from real accounts in each
 * language, never mocked. Add a file under `public/linkedin-export/<lang>/` and one entry
 * here; the step shows the list as soon as it is non-empty.
 */
export const GUIDE_SHOTS: Record<Language, readonly GuideShot[]> = {
  en: [],
  ru: [],
  am: [],
};
