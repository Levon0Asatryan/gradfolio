import { AccountSummary, type AccountResult } from "@/components/account/AccountSummary";
import { ApiError, getMe, getMyProfile } from "@/lib/api/client";

export const metadata = {
  title: "Account",
};

/**
 * The signed-in user's account (`GET /v1/me`, which creates it on the first
 * call) and the settings kept on their profile (`GET /v1/me/profile`). Login is
 * required (proxy.ts).
 */
export default async function AccountPage() {
  let result: AccountResult;
  try {
    const [me, profile] = await Promise.all([getMe(), getMyProfile()]);
    result = { me, settings: { isPublic: profile.isPublic, contactEmail: profile.contactEmail } };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    result = { errorCode: error.code };
  }
  return <AccountSummary result={result} />;
}
