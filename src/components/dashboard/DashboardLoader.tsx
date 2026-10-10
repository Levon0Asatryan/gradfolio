import { DashboardContent, type DashboardContentProps } from "./DashboardContent";
import { ApiError, getDashboard, getMyProfile } from "@/lib/api/client";
import { profileCompleteness } from "@/lib/profile/completeness";

/** An API failure becomes `null`; anything else is a bug and surfaces. */
async function soft<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return null;
  }
}

/**
 * The welcome card (the profile header) and the numbers, projects and feed (the dashboard
 * call), read in parallel and failing independently. A failed profile read leaves a generic
 * welcome and no meter (never a made-up 0%); a failed dashboard read leaves each of its three
 * sections saying so (never zeros, never "no projects yet").
 */
export async function DashboardLoader() {
  const [profile, dashboard] = await Promise.all([
    soft(() => getMyProfile()),
    soft(() => getDashboard()),
  ]);
  const props: DashboardContentProps = {
    firstName: profile ? profile.name.trim().split(/\s+/)[0] || null : null,
    completeness: profile ? profileCompleteness(profile) : null,
    dashboard,
  };
  return <DashboardContent {...props} />;
}
