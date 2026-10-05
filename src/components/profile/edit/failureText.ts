import type { Dictionary } from "@/data/locales/types";

export interface Failure {
  text: string;
  /** Offer to sign in again. */
  signIn: boolean;
  /** What the editor shows is out of date: reload the page data. */
  reload: boolean;
}

/** What a failed section save says; the API's codes are its stable contract. */
export function failureText(t: Dictionary, code: string): Failure {
  switch (code) {
    case "UNAUTHENTICATED":
      return { text: t.profileEdit.errorSignInAgain, signIn: true, reload: false };
    case "LIMIT_REACHED":
      return { text: t.sectionEdit.errorLimit, signIn: false, reload: false };
    case "ORDER_STALE":
      return { text: t.sectionEdit.errorStale, signIn: false, reload: true };
    case "NOT_FOUND":
      return { text: t.sectionEdit.errorNotFound, signIn: false, reload: true };
    case "VALIDATION_FAILED":
      return { text: t.profileEdit.errorValidation, signIn: false, reload: false };
    default:
      return { text: t.profileEdit.errorSave, signIn: false, reload: false };
  }
}
