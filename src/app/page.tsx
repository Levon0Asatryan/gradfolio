import type { Metadata } from "next";
import { dashboardTitle } from "@/components/i18n/language";
import { requestDictionary } from "@/lib/requestDictionary";
import { DashboardLoader } from "@/components/dashboard/DashboardLoader";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

/** The tab title in the UI language (the root layout's title template does not apply to its own page). */
export async function generateMetadata(): Promise<Metadata> {
  const t = await requestDictionary();
  return { title: { absolute: dashboardTitle(t) } };
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
