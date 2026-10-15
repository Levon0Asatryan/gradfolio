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

/** This deployment's own base URL: the preview's branch host, else `APP_BASE_URL`. */
export function appOrigin(
  env: Record<string, string | undefined>,
  previewBase: string | undefined,
): string | null {
  const raw = previewBase ?? env.APP_BASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export interface AuthorizeInput {
  domain: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
}

/**
 * Auth0's `/authorize` for the GitHub connection. `prompt=login` forces GitHub's own sign-in,
 * so the linked account is the one the student just authenticated, not an ambient session.
 */
export function authorizeUrl({ domain, clientId, redirectUri, state, nonce }: AuthorizeInput) {
  const url = new URL(`https://${domain}/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid",
    connection: "github",
    prompt: "login",
    state,
    nonce,
  }).toString();
  return url;
}

/** Auth0 domains are host names; anything with a scheme, path or whitespace is a misconfiguration. */
export const isDomain = (value: string | undefined): value is string =>
  typeof value === "string" && /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(value);

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
