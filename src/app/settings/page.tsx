import { Metadata } from "next";
import SettingsPage from "@/components/settings/SettingsPage";

export const metadata: Metadata = {
  title: "Settings | Gradfolio",
  description: "Manage your application settings",
};

export default function Page() {
  return <SettingsPage />;
}
