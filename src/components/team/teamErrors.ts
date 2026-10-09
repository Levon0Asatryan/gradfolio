import type { Dictionary } from "@/data/locales/types";

/** The API's stable codes (never its message) as the reader's own words. */
export function teamErrorText(code: string, t: Dictionary): string {
  const text = t.team;
  switch (code) {
    case "ALREADY_MEMBER":
      return text.errAlreadyMember;
    case "TEAM_FULL":
      return text.errTeamFull;
    case "PROJECT_IS_DRAFT":
      return text.errDraft;
    case "NOT_FOUND":
      return text.errNotFound;
    case "RATE_LIMITED":
      return text.errRateLimited;
    case "VALIDATION_FAILED":
      return text.errValidation;
    case "UNAUTHENTICATED":
      return text.errSignIn;
    default:
      return text.errFailed;
  }
}
