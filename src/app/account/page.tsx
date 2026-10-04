import { AccountSummary, type AccountResult } from "@/components/account/AccountSummary";
import { ApiError, getMe } from "@/lib/api/client";

export const metadata = {
  title: "Account",
};

/**
 * The signed-in user's account from gradfolio-api (`GET /v1/me`, which creates
 * it on the first call). Login is required (proxy.ts). Account settings come
 * in M3 (tracker 3.9).
 */
export default async function AccountPage() {
  let result: AccountResult;
  try {
    result = { me: await getMe() };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    result = { errorCode: error.code };
  }
  return <AccountSummary result={result} />;
}
