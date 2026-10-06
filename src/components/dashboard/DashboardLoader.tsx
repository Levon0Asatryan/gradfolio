import { DashboardContent } from "./DashboardContent";
import { ApiError, getMyProfile } from "@/lib/api/client";
import { profileCompleteness } from "@/lib/profile/completeness";

/**
 * Reads the signed-in user's profile header for the welcome card. Soft by
 * design, like the onboarding gate: if the API cannot be read, the dashboard
 * still renders, with a generic welcome and no completeness meter (never a
 * made-up 0%). A bug that is not an ApiError still surfaces.
 */
export async function DashboardLoader() {
  try {
    const profile = await getMyProfile();
    return (
      <DashboardContent
        firstName={profile.name.trim().split(/\s+/)[0] || null}
        completeness={profileCompleteness(profile)}
      />
    );
  } catch (error) {
    if (error instanceof ApiError) return <DashboardContent firstName={null} completeness={null} />;
    throw error;
  }
}
