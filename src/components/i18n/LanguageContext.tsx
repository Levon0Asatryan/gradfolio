"use client";

import { createContext, useState, useContext, ReactNode, FC, useMemo, useEffect } from "react";
import { Language, Dictionary } from "@/data/locales/types";
import { en } from "@/data/locales/en";
import { ru } from "@/data/locales/ru";
import { am } from "@/data/locales/am";
import { cookiesLanguageKey } from "@/utils/constants/constants";
import { htmlLang, isLanguage } from "./language";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const dictionaries: Record<Language, Dictionary> = {
  en,
  ru,
  am,
};

const rememberLanguage = (lang: Language) => {
  try {
    localStorage.setItem("language", lang);
  } catch {}
  try {
    document.cookie = `${cookiesLanguageKey}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  } catch {}
};

export const LanguageProvider: FC<{ children: ReactNode; initialLanguage?: Language }> = ({
  children,
  initialLanguage = "en",
}) => {
  // The server reads the `language` cookie, so the first paint is already in the right language.
  const [language, setLanguage] = useState<Language>(initialLanguage);

  // Visitors from before the cookie existed still have the choice in localStorage;
  // once the cookie is there it is the truth (the server already rendered from it).
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.startsWith(`${cookiesLanguageKey}=`))) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("language");
    } catch {}
    if (isLanguage(saved)) {
      setLanguage(saved);
      rememberLanguage(saved);
    }
  }, []);

  // `<html lang>` follows the UI language (screen readers pick the voice from it).
  useEffect(() => {
    document.documentElement.lang = htmlLang(language);
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    rememberLanguage(lang);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      t: dictionaries[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
