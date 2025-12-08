import { notFound } from "next/navigation";
import ProfileContent from "../ProfileContent";
import { getProfileById } from "@/data/portfolios.mock";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = getProfileById(id);

  if (!profile) {
    notFound();
  }

  // Simulate current user check - assuming u_001 is the logged-in user
  const isOwnProfile = id === "u_001";

  // When visiting own profile, we pass the initial data but let ProfileContent manage state
  // On other profiles, it's read-only
  return <ProfileContent initialData={profile} isOwnProfile={isOwnProfile} />;
}
