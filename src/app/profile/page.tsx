import { redirect } from "next/navigation";
import { ProfileError } from "@/components/profile/ProfileError";
import { ApiError, getMe } from "@/lib/api/client";

/** "My profile": the signed-in user's own page (login required, proxy.ts). */
export default async function MyProfilePage() {
  let id: string;
  try {
    id = (await getMe()).id;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <ProfileError code={error.code} />;
  }
  redirect(`/profile/${id}`);
}
