/**
 * The Auth0 settings the GitHub connect flow reads, normalised and validated in one place.
 * The action that starts the flow and the callback that finishes it both go through
 * `auth0ConnectSettings`; neither reads these variables itself. (The SDK client in
 * `src/lib/auth0.ts` has its own reader and is not part of this.)
 *
 * Dashboards are pasted into: a scheme on the domain, a trailing slash, a stray newline, a
 * capital. Each of those broke production once, so values are normalised rather than refused.
 * What cannot be repaired is reported by variable **name**; a value is never logged.
 */

/** Auth0's default for the GitHub social connection; its Name (immutable) may differ. */
export const DEFAULT_GITHUB_CONNECTION = "github";

/**
 * An Auth0 domain as the SDK takes it: a bare host. A scheme, trailing slashes, surrounding
 * space and capitals are removed; a path or port is not a domain and is left for `isDomain`
 * to refuse.
 */
export function normalizeDomain(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/** Auth0 domains are host names; anything with a scheme, path or whitespace is a misconfiguration. */
export const isDomain = (value: string | undefined): value is string =>
  typeof value === "string" && /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(value);

/**
 * The Auth0 connection **Name** the secondary sign-in asks for (`connection=` is matched
 * against the name, case-sensitively). Unset or invalid falls back to `github`; an invalid
 * value is flagged so it is not silently ignored. The identity's `sub` prefix (`github|…`)
 * comes from the connection's strategy, not its name, so this does not affect the API.
 */
export function githubConnectionName(raw: string | undefined): {
  name: string;
  invalid: boolean;
} {
  const value = raw?.trim();
  if (!value) return { name: DEFAULT_GITHUB_CONNECTION, invalid: false };
  return /^[A-Za-z0-9_-]{1,128}$/.test(value)
    ? { name: value, invalid: false }
    : { name: DEFAULT_GITHUB_CONNECTION, invalid: true };
}

export type Auth0ConnectSettings =
  | {
      ok: true;
      domain: string;
      clientId: string;
      /** Empty unless `needSecret` was set. Never log it. */
      clientSecret: string;
      connection: string;
      unusable: [];
    }
  | { ok: false; unusable: string[] };

/**
 * The validated settings, or the names (never values) of those that are unusable. The
 * client secret is required only by the callback (`needSecret`). An invalid
 * `AUTH0_GITHUB_CONNECTION` is not fatal: it falls back to the default and is logged by name.
 */
export function auth0ConnectSettings(
  env: Record<string, string | undefined>,
  { needSecret }: { needSecret: boolean },
): Auth0ConnectSettings {
  const domain = normalizeDomain(env.AUTH0_DOMAIN);
  const clientId = env.AUTH0_CLIENT_ID?.trim();
  const clientSecret = env.AUTH0_CLIENT_SECRET?.trim();
  const unusable = [
    !isDomain(domain) && "AUTH0_DOMAIN",
    !clientId && "AUTH0_CLIENT_ID",
    needSecret && !clientSecret && "AUTH0_CLIENT_SECRET",
  ].filter((name): name is string => typeof name === "string");
  if (unusable.length > 0 || !isDomain(domain) || !clientId) return { ok: false, unusable };

  const connection = githubConnectionName(env.AUTH0_GITHUB_CONNECTION);
  if (connection.invalid) {
    console.error(
      JSON.stringify({
        event: "github_connect_config_warning",
        setting: "AUTH0_GITHUB_CONNECTION",
        problem: "invalid; using the default",
      }),
    );
  }
  return {
    ok: true,
    domain,
    clientId,
    clientSecret: clientSecret ?? "",
    connection: connection.name,
    unusable: [],
  };
}
