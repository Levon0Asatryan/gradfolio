import type { EmailPreferences } from "@/lib/api/types";

export function isEmailPreferencesPatch(value: unknown): value is Partial<EmailPreferences> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).length > 0 &&
    Object.keys(v).every((k) => ["preferredLanguage", "teamInvitesEnabled"].includes(k)) &&
    (v.teamInvitesEnabled === undefined || typeof v.teamInvitesEnabled === "boolean") &&
    (v.preferredLanguage === undefined ||
      (typeof v.preferredLanguage === "string" && ["en", "ru", "am"].includes(v.preferredLanguage)))
  );
}
