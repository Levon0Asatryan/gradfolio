import type { Dictionary } from "@/data/locales/types";
import type { FieldError } from "@/lib/profile/headerPatch";

/** The message for a field check failure, in the UI language. */
export function fieldErrorText(t: Dictionary, error: FieldError): string {
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
    default:
      return t.profileEdit.errorInvalid;
  }
}
