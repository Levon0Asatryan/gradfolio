import { cookies } from "next/headers";
import { isLanguage } from "@/components/i18n/language";
import { am } from "@/data/locales/am";
import { en } from "@/data/locales/en";
import { ru } from "@/data/locales/ru";
import type { Dictionary } from "@/data/locales/types";
import { cookiesLanguageKey } from "@/utils/constants/constants";

const dictionaries: Record<"en" | "ru" | "am", Dictionary> = { en, ru, am };

/** The dictionary for the request's `language` cookie (English when absent or unknown), for tab titles. */
export async function requestDictionary(): Promise<Dictionary> {
  const saved = (await cookies()).get(cookiesLanguageKey)?.value;
  return dictionaries[isLanguage(saved) ? saved : "en"];
}
