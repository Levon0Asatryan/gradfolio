import { RETURN_REASONS } from "./githubLink";

/**
 * Every code the integrations UI can show a message for: the reasons the GitHub callback
 * may carry, the disconnect's own, and the load errors. One table in each language
 * (`t.integrations.errors`), typed by this list, so a code without text cannot compile.
 */
export const INTEGRATION_ERROR_CODES = [
  ...RETURN_REASONS,
  "GITHUB_REVOKE_FAILED",
  "API_UNREACHABLE",
  "API_NOT_CONFIGURED",
] as const;
export type IntegrationErrorCode = (typeof INTEGRATION_ERROR_CODES)[number];

/** An API code we have text for, else `UNKNOWN`. */
export function errorCode(code: string): IntegrationErrorCode {
  return (INTEGRATION_ERROR_CODES as readonly string[]).includes(code)
    ? (code as IntegrationErrorCode)
    : "UNKNOWN";
}
