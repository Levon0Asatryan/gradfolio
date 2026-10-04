import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileError } from "@/components/profile/ProfileError";
import { ProfileView } from "@/components/profile/ProfileView";
import { ApiError, getProfile } from "@/lib/api/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Profile" };

/**
 * A profile from gradfolio-api (`GET /v1/users/{id}`). Public pages read
 * anonymously; a session's token makes the owner see their own private profile.
 * An unknown or private profile is a 404 (Q3); any other failure is an error
 * screen, never an empty profile.
 */
export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  let profile;
  try {
    profile = await getProfile(id);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.code === "NOT_FOUND") notFound();
    return <ProfileError code={error.code} returnTo={`/profile/${id}`} />;
  }
  return <ProfileView profile={profile} />;
}
