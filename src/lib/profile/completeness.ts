import type { ProfileHeader } from "@/lib/api/types";

export const COMPLETENESS_STEPS = ["basics", "contact", "photo"] as const;
export type CompletenessStep = (typeof COMPLETENESS_STEPS)[number];

export interface Completeness {
  /** 0-100, whole number. */
  percent: number;
  steps: Record<CompletenessStep, boolean>;
  /** The first step still open, or null when the profile is complete. */
  next: CompletenessStep | null;
}

const filled = (value: string | null | undefined) => (value ?? "").trim().length > 0;

/**
 * How complete the signed-in user's profile header is. Only what the header
 * holds (name, headline, bio, location, contact email, photo): projects and
 * skills join in once the dashboard reads the API (M4-M6).
 */
export function profileCompleteness(
  profile: Pick<
    ProfileHeader,
    "name" | "headline" | "bio" | "location" | "contactEmail" | "avatarUrl"
  >,
): Completeness {
  const steps: Record<CompletenessStep, boolean> = {
    basics:
      filled(profile.name) &&
      filled(profile.headline) &&
      filled(profile.bio) &&
      filled(profile.location),
    contact: filled(profile.contactEmail),
    photo: filled(profile.avatarUrl),
  };
  const done = COMPLETENESS_STEPS.filter((s) => steps[s]).length;
  return {
    percent: Math.round((done / COMPLETENESS_STEPS.length) * 100),
    steps,
    next: COMPLETENESS_STEPS.find((s) => !steps[s]) ?? null,
  };
}
