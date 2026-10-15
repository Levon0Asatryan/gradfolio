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

/**
 * An Auth0 domain as the SDK takes it: a bare host. A scheme, trailing slashes, surrounding
 * space and capitals (all easy to paste into a dashboard) are removed; a path or port is not
 * a domain and is left for `isDomain` to refuse.
 */
export function normalizeDomain(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/** Auth0's default for the GitHub social connection; its Name (immutable) may differ. */
const DEFAULT_GITHUB_CONNECTION = "github";

/**
 * The Auth0 connection **Name** the secondary sign-in asks for (`connection=` is matched
 * against the name, case-sensitively). From `AUTH0_GITHUB_CONNECTION`; unset or invalid falls
 * back to `github`, and an invalid value is reported so it is not silently ignored. The
 * identity's `sub` prefix (`github|…`) comes from the connection's strategy, not its name, so
 * this setting does not affect the API.
 */
export function githubConnectionName(raw: string | undefined): {
  name: string;
  invalid: boolean;
} {
  const value = raw?.trim();
  if (!value) return { name: DEFAULT_GITHUB_CONNECTION, invalid: false };
  return /^[A-Za-z0-9_-]{1,64}$/.test(value)
    ? { name: value, invalid: false }
    : { name: DEFAULT_GITHUB_CONNECTION, invalid: true };
}

export interface AuthorizeInput {
  domain: string;
  /** The connection's Name in Auth0 (`githubConnectionName`). */
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
