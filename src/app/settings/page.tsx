import { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import SettingsPage from "@/components/settings/SettingsPage";
import { auth0 } from "@/lib/auth0";
import { getEmailPreferences, ApiError } from "@/lib/api/client";
import type { EmailPreferences } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your application settings",
};

export default async function Page() {
  let preferences: EmailPreferences | undefined;
  let emailError = false;
  try {
    if (await auth0.getSession()) preferences = await getEmailPreferences();
  } catch (error) {
    unstable_rethrow(error);
    if (!(error instanceof ApiError))
      console.error("settings email preferences unavailable", {
        error: error instanceof Error ? error.name : typeof error,
      });
    emailError = true;
  }
  return <SettingsPage initialEmailPreferences={preferences} emailError={emailError} />;
}
