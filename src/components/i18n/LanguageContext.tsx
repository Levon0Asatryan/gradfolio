"use client";

import { createContext, useState, useContext, ReactNode, FC, useMemo, useEffect } from "react";
import { Language, Dictionary } from "@/data/locales/types";
import { en } from "@/data/locales/en";
import { ru } from "@/data/locales/ru";
import { am } from "@/data/locales/am";

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

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Default to English, can be enhanced to read from localStorage/cookies
  const [language, setLanguage] = useState<Language>("en");

  // Optional: Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && ["en", "ru", "am"].includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
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
