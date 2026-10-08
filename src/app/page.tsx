import { DashboardLoader } from "@/components/dashboard/DashboardLoader";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

export const metadata = { title: { absolute: "Dashboard | Gradfolio" } };

/** The dashboard, with first-login onboarding (2.14) on top of it. */
export default function HomePage() {
  return (
    <>
      <OnboardingGate />
      <DashboardLoader />
    </>
  );
}
