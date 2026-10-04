"use server";

import { ApiError, completeOnboarding, updateMyProfile } from "@/lib/api/client";
import { parseHeaderPatch, type FieldErrors } from "./headerPatch";

/**
 * Server actions are public endpoints: they take no user id and trust no
 * argument. The caller is the Auth0 session (its token goes to the API, which
 * decides ownership), and the input is checked here before it is forwarded.
 */
export type ActionResult = { ok: true } | { ok: false; code: string; fields?: FieldErrors };

function failure(error: unknown): ActionResult {
  if (error instanceof ApiError) return { ok: false, code: error.code };
  throw error;
}

/** Edit the caller's own profile header, or one setting on it (visibility, contact email). */
export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = parseHeaderPatch(input);
  if (!parsed.ok) return { ok: false, code: "VALIDATION_FAILED", fields: parsed.errors };
  try {
    await updateMyProfile(parsed.patch);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** First-login onboarding finished or skipped (2.14). */
export async function completeOnboardingAction(): Promise<ActionResult> {
  try {
    await completeOnboarding();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
