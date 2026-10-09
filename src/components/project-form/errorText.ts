import type { Dictionary } from "@/data/locales/types";
import type { FieldError } from "@/lib/profile/headerPatch";
import type { Limit } from "@/lib/profile/limits";

/** The message for one failed field, in the UI language. */
export function projectFieldError(
  t: Dictionary,
  key: string,
  error: FieldError,
  limit?: Limit,
): string {
  const form = t.projects.form;
  switch (error) {
    case "required":
      return t.profileEdit.errorRequired;
    case "invalid_url":
      return key === "heroImageUrl" ? form.errorHttps : t.profileEdit.errorUrl;
    case "invalid_range":
      return t.sectionEdit.errorRange;
    case "too_long":
      return limit
        ? form.errorTooLong
            .replace("{max}", String(limit.max))
            .replace(
              "{unit}",
              limit.kind === "chars" ? t.sectionEdit.unitChars : t.sectionEdit.unitBytes,
            )
        : t.profileEdit.errorInvalid;
    case "invalid":
      return key === "startDate" || key === "endDate" ? form.errorDate : t.profileEdit.errorInvalid;
    default:
      return t.profileEdit.errorInvalid;
  }
}
