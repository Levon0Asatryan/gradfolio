import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isLanguage } from "@/components/i18n/language";
import { am } from "@/data/locales/am";
import { en } from "@/data/locales/en";
import { ru } from "@/data/locales/ru";
import { cookiesLanguageKey } from "@/utils/constants/constants";
import { DashboardLoader } from "@/components/dashboard/DashboardLoader";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

const dictionaries = { en, ru, am };

/** The tab title in the UI language (the root layout's title template does not apply to its own page). */
export async function generateMetadata(): Promise<Metadata> {
  const saved = (await cookies()).get(cookiesLanguageKey)?.value;
  const language = isLanguage(saved) ? saved : "en";
  return { title: { absolute: `${dictionaries[language].common.dashboard} | Gradfolio` } };
}

/** The dashboard, with first-login onboarding (2.14) on top of it. */
export default function HomePage() {
  return (
    <>
      <OnboardingGate />
      <DashboardLoader />
    </>
  );
}
