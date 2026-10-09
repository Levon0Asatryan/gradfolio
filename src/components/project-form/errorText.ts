import type { Dictionary } from "@/data/locales/types";
import type { FieldError } from "@/lib/profile/headerPatch";
import { PROJECT_LIMITS } from "@/lib/projects/limits";
import type { Limit } from "@/lib/profile/limits";

const MAX_ITEMS: Record<string, number> = {
  technologies: PROJECT_LIMITS.technologies,
  tags: PROJECT_LIMITS.tags,
  links: PROJECT_LIMITS.links,
};

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
    case "too_many": {
      const max = MAX_ITEMS[key];
      return max ? form.errorTooMany.replace("{max}", String(max)) : t.profileEdit.errorInvalid;
    }
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
