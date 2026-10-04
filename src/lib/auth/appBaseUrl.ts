/**
 * This deployment's own base URL, for the Auth0 client.
 *
 * `APP_BASE_URL` holds one value for Production and Preview in Vercel, so a
 * preview used to send the login (and the callback) to production. On a
 * preview, use the branch's stable host instead: Vercel sets
 * `VERCEL_BRANCH_URL` per deployment. That host must be listed in Auth0's
 * callback and logout URLs, one exact entry per tested branch, never a
 * `*.vercel.app` wildcard. Log in on that host, not on the per-commit one: the
 * login returns to the pinned host, where another host's cookie is missing.
 *
 * Production, local dev and tests return undefined: the SDK then reads
 * `APP_BASE_URL` itself.
 */
export function previewAppBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  if (env.VERCEL_ENV !== "preview") return undefined;
  const host = env.VERCEL_BRANCH_URL?.trim();
  if (!host || !/^[a-z0-9.-]+\.vercel\.app$/i.test(host)) return undefined;
  return `https://${host}`;
}
