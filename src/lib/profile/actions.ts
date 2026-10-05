"use server";

import {
  ApiError,
  completeOnboarding,
  createEntry,
  deleteEntry,
  deleteMe,
  reorderEntries,
  replaceSkills,
  updateEntry,
  updateMyProfile,
} from "@/lib/api/client";
import { parseHeaderPatch, type FieldErrors } from "./headerPatch";
import { isSection, parseEntry, parseIds, parseSkills } from "./sections";

/**
 * Server actions are public endpoints: they take no user id and trust no
 * argument. The caller is the Auth0 session (its token goes to the API, which
 * decides ownership), and the input is checked here before it is forwarded.
 */
export type ActionResult =
  | {
      ok: true;
      /** `replaceSkillsAction` only: the list as the API stored it. */
      skills?: string[];
    }
  | { ok: false; code: string; fields?: FieldErrors };

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

const invalid: ActionResult = { ok: false, code: "VALIDATION_FAILED" };

/**
 * Add (`id` null) or change one entry of the caller's education, experience or
 * certifications. Nothing half-filled is ever sent: `parseEntry` rejects a create
 * with an empty required field before the API is called.
 */
export async function saveEntryAction(
  section: unknown,
  id: unknown,
  input: unknown,
): Promise<ActionResult> {
  if (!isSection(section) || (id !== null && typeof id !== "string")) return invalid;
  const parsed = parseEntry(section, input, id === null ? "create" : "update");
  if (!parsed.ok) return { ok: false, code: "VALIDATION_FAILED", fields: parsed.errors };
  try {
    if (id === null) await createEntry(section, parsed.body);
    else await updateEntry(section, id, parsed.body);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteEntryAction(section: unknown, id: unknown): Promise<ActionResult> {
  if (!isSection(section) || typeof id !== "string") return invalid;
  try {
    await deleteEntry(section, id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** `ids` is the whole section in its new order; the API rejects a stale or foreign list. */
export async function reorderEntriesAction(section: unknown, ids: unknown): Promise<ActionResult> {
  const list = parseIds(ids);
  if (!isSection(section) || !list) return invalid;
  try {
    await reorderEntries(section, list);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Replace the caller's whole skill list in one call. */
export async function replaceSkillsAction(skills: unknown): Promise<ActionResult> {
  const list = parseSkills(skills);
  if (!list) return invalid;
  try {
    const saved = await replaceSkills(list);
    // The API normalizes and picks one spelling per name: hand back what it kept.
    const skills = Array.isArray(saved?.skills)
      ? saved.skills.filter((x) => typeof x === "string")
      : undefined;
    return { ok: true, skills };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Delete the caller's account. The Auth0 session and token survive it, and a
 * valid token would create a new, empty account on its next request, so the
 * caller must sign out straight after a success.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  try {
    await deleteMe();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
