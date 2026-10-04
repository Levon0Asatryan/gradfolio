import { OnboardingDialog } from "./OnboardingDialog";
import { ApiError, getMe } from "@/lib/api/client";

/**
 * Offers first-login onboarding while the account is not `onboarded` (2.14).
 * Soft by design: if the account cannot be read (no session, API down) nothing
 * is shown; onboarding is an offer, never a gate on the page behind it.
 */
export async function OnboardingGate() {
  let onboarded: boolean;
  try {
    onboarded = (await getMe()).onboarded;
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
  return onboarded ? null : <OnboardingDialog />;
}
