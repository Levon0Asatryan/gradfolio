import { DEFAULT_GITHUB_CONNECTION } from "@/lib/auth/auth0Settings";

/**
 * The secondary GitHub sign-in that links a GitHub account (API plan 2.3), as pure helpers.
 *
 * It runs **beside** the session, not through the SDK's login: the SDK's login would replace
 * the user's session with a GitHub-only one (a second account). So this is a small
 * authorization-code exchange of our own, on the server, whose only product is an `id_token`
 * that goes to the API once and is dropped. Nothing here is a secret: the browser sees the
 * authorize URL and, on return, `code` and `state`.
 */

/** The cookie carrying `state` between the start and the callback. Bound to the browser. */
export const LINK_STATE_COOKIE = "gh_link_state";
export const LINK_COOKIE_PATH = "/integrations/github";
export const CALLBACK_PATH = "/integrations/github/callback";
const STATE_MAX_AGE_S = 10 * 60;

/**
 * Where the callback may send the browser: a closed list of our own paths, chosen by the
 * page that started the flow and carried in an HttpOnly cookie, never by the request's query.
 */
export const RETURN_TARGETS = {
  integrations: "/integrations",
  connections: "/integrations/connections",
} as const;
export type ReturnTarget = keyof typeof RETURN_TARGETS;
export const RETURN_COOKIE = "gh_link_return";

/**
 * The hint the callback adds on success (`?github=connected&import=1`): "open the import
 * dialog". It is a hint only. The page opens the dialog only when the API, in the same render,
 * says GitHub is connected, and the dialog imports nothing until the student clicks.
 */
export const IMPORT_HINT = "import";
export const wantsImport = (params: { get(name: string): string | null }): boolean =>
  params.get(IMPORT_HINT) === "1";

/** Anything but a known target is the integrations page. */
export function returnTarget(value: unknown): ReturnTarget {
  return typeof value === "string" && Object.hasOwn(RETURN_TARGETS, value)
    ? (value as ReturnTarget)
    : "integrations";
}

export function stateCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: LINK_COOKIE_PATH,
    maxAge: STATE_MAX_AGE_S,
  };
}

/**
 * This deployment's own origin, from the same variable the Auth0 SDK reads, and as tolerant as
 * deployments tend to be: the preview's branch host wins; `APP_BASE_URL` may carry a trailing
 * slash or path, no scheme, surrounding space, or (as the SDK allows) a comma-separated list,
 * of which the first entry is used. With none usable, `requestOrigin` (the host the request
 * arrived on) stands in, as it does for the SDK. `null` only when nothing is usable.
 */
export function appOrigin(
  env: Record<string, string | undefined>,
  previewBase: string | undefined,
  requestOrigin?: string | null,
): string | null {
  const first = (env.APP_BASE_URL ?? "").split(",")[0]?.trim() ?? "";
  for (const raw of [previewBase, first, requestOrigin ?? undefined]) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
      if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

export interface AuthorizeInput {
  domain: string;
  /** The connection's Name in Auth0 (`auth0ConnectSettings`). */
  connection?: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
}

/**
 * Auth0's `/authorize` for the GitHub connection. `prompt=login` forces GitHub's own sign-in,
 * so the linked account is the one the student just authenticated, not an ambient session.
 */
export function authorizeUrl({
  domain,
  connection = DEFAULT_GITHUB_CONNECTION,
  clientId,
  redirectUri,
  state,
  nonce,
}: AuthorizeInput) {
  const url = new URL(`https://${domain}/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid",
    connection,
    prompt: "login",
    state,
    nonce,
  }).toString();
  return url;
}

/** Constant-time comparison of two strings. */
export function sameState(a: string | undefined, b: string | null): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 32 random bytes, URL-safe. */
export function newState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

/**
 * The reasons the callback may put in `?reason=`: a closed list of the API's codes and our own
 * words. Anything else collapses to `UNKNOWN`, so the query string can never carry text that is
 * rendered (a forged link cannot make the page say something).
 */
export const RETURN_REASONS = [
  "ACCESS_DENIED",
  "STATE_MISMATCH",
  "EXCHANGE_FAILED",
  "INVALID_ID_TOKEN",
  "INVALID_NONCE",
  "GITHUB_ACCOUNT_IN_USE",
  "GITHUB_ALREADY_CONNECTED",
  "GITHUB_LINK_REFUSED",
  "GITHUB_LINK_IN_PROGRESS",
  "GITHUB_STATE_CHANGED",
  "GITHUB_NOT_LINKED",
  "GITHUB_UNAVAILABLE",
  "GITHUB_RATE_LIMITED",
  "RATE_LIMITED",
  "INTEGRATION_UNAVAILABLE",
  "AUTH_UNAVAILABLE",
  "UNAUTHENTICATED",
  "UNKNOWN",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export function toReturnReason(code: string | null | undefined): ReturnReason {
  return (RETURN_REASONS as readonly string[]).includes(code ?? "")
    ? (code as ReturnReason)
    : "UNKNOWN";
}
