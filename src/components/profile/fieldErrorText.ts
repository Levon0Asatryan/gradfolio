import type { Dictionary } from "@/data/locales/types";
import type { FieldError } from "@/lib/profile/headerPatch";
import type { Limit } from "@/lib/profile/limits";

/** "{used} / {max} unit" for a text field with a limit. */
export function counterText(t: Dictionary, used: number, limit: Limit): string {
  return t.sectionEdit.counter
    .replace("{used}", String(used))
    .replace("{max}", String(limit.max))
    .replace("{unit}", limit.kind === "chars" ? t.sectionEdit.unitChars : t.sectionEdit.unitBytes);
}

/** The message for a field check failure, in the UI language. */
export function fieldErrorText(t: Dictionary, error: FieldError, limit?: Limit): string {
  switch (error) {
    case "required":
      return t.profileEdit.errorRequired;
    case "invalid_url":
      return t.profileEdit.errorUrl;
    case "invalid_email":
      return t.profileEdit.errorEmail;
    case "invalid_year":
      return t.sectionEdit.errorYear;
    case "invalid_month":
      return t.sectionEdit.errorMonth;
    case "invalid_range":
      return t.sectionEdit.errorRange;
    case "too_long":
      return limit
        ? t.sectionEdit.errorTooLong
            .replace("{max}", String(limit.max))
            .replace(
              "{unit}",
              limit.kind === "chars" ? t.sectionEdit.unitChars : t.sectionEdit.unitBytes,
            )
        : t.profileEdit.errorInvalid;
    default:
      return t.profileEdit.errorInvalid;
  }
}
