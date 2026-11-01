/**
 * Every code the LinkedIn wizard shows text for: the API's `IMPORT_*` family, the codes the
 * upload and confirm share with the rest of the site, and the browser's own two for the
 * storage `PUT`. One table per language (`t.linkedinImport.errors`) is typed by this list, so
 * a code without text cannot compile.
 */
export const LINKEDIN_ERROR_CODES = [
  "IMPORT_TOO_LARGE",
  "IMPORT_UPLOAD_MISSING",
  "IMPORT_NOT_ZIP",
  "IMPORT_TOO_MANY_ENTRIES",
  "IMPORT_UNCOMPRESSED_TOO_LARGE",
  "IMPORT_RATIO_EXCEEDED",
  "IMPORT_UNSAFE_PATH",
  "IMPORT_ENCRYPTED",
  "IMPORT_ENTRY_NOT_CSV",
  "IMPORT_DUPLICATE_ENTRY",
  "IMPORT_EMPTY",
  "IMPORT_COLUMNS_MISSING",
  "IMPORT_LANGUAGE_UNRECOGNISED",
  "IMPORT_MALFORMED_CSV",
  "IMPORT_BUSY",
  "LIMIT_REACHED",
  "VALIDATION_FAILED",
  "RATE_LIMITED",
  "STORAGE_UNAVAILABLE",
  "UNAUTHENTICATED",
  "UPLOAD_URL_REJECTED",
  /** The bucket refused the PUT: the signature expired or does not match. */
  "UPLOAD_REJECTED",
  /** The PUT got no answer: the network, or this origin is not allowed by the bucket. */
  "UPLOAD_UNREACHABLE",
  "API_UNREACHABLE",
  "API_NOT_CONFIGURED",
  "UNKNOWN",
] as const;
export type LinkedinErrorCode = (typeof LINKEDIN_ERROR_CODES)[number];

/** An API code we have text for, else `UNKNOWN`. */
export function linkedinErrorCode(code: string): LinkedinErrorCode {
  return (LINKEDIN_ERROR_CODES as readonly string[]).includes(code)
    ? (code as LinkedinErrorCode)
    : "UNKNOWN";
}
