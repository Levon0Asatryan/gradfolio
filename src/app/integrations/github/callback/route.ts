import { NextResponse, type NextRequest } from "next/server";
import { ApiError, linkGithub } from "@/lib/api/client";
import { previewAppBaseUrl } from "@/lib/auth/appBaseUrl";
import {
  CALLBACK_PATH,
  IMPORT_HINT,
  LINK_COOKIE_PATH,
  LINK_STATE_COOKIE,
  RETURN_COOKIE,
  RETURN_TARGETS,
  returnTarget,
  appOrigin,
  isDomain,
  normalizeDomain,
  sameState,
  toReturnReason,
  type ReturnReason,
} from "@/lib/integrations/githubLink";

/**
 * The return of the secondary GitHub sign-in that links GitHub (API plan 2.3).
 *
 * Auth0 sends the browser here with `code` and `state`. This route, on the server only:
 * 1. checks `state` against the HttpOnly cookie set when the flow started (CSRF: a link
 *    started by someone else's page cannot complete in this browser);
 * 2. exchanges `code` for the `id_token` at Auth0 (a confidential client: the secret never
 *    leaves the server);
 * 3. hands the `id_token` to the API once, which verifies it (signature, audience, nonce,
 *    freshness) and links GitHub;
 * 4. redirects to the page that started the flow (a closed list) with a result word from a
 *    closed list.
 *
 * The `id_token` and the exchange's access token are never stored, logged, rendered or put
 * in a URL. The redirect target is one of our own paths from a closed list, named by an HttpOnly cookie:
 * nothing in the query string chooses it (no open redirect).
 * The route is under `/integrations`, so the proxy requires a session before it runs.
 */
export const dynamic = "force-dynamic";

const EXCHANGE_TIMEOUT_MS = 10_000;

/** The OAuth error fields only, as text, cut short: never a code, a token or a secret. */
const oauthFields = (value: unknown): string =>
  typeof value === "string" ? value.slice(0, 200) : "";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin =
    appOrigin(process.env, previewAppBaseUrl(), request.nextUrl.origin) ?? request.nextUrl.origin;

  const back = RETURN_TARGETS[returnTarget(request.cookies.get(RETURN_COOKIE)?.value)];

  const finish = (result: "connected" | { reason: ReturnReason }): NextResponse => {
    const url = new URL(back, origin);
    if (result === "connected") {
      url.searchParams.set("github", "connected");
      url.searchParams.set(IMPORT_HINT, "1");
    } else {
      url.searchParams.set("github", "error");
      url.searchParams.set("reason", result.reason);
    }
    const response = NextResponse.redirect(url);
    response.cookies.set(LINK_STATE_COOKIE, "", { path: LINK_COOKIE_PATH, maxAge: 0 });
    response.cookies.set(RETURN_COOKIE, "", { path: LINK_COOKIE_PATH, maxAge: 0 });
    response.headers.set("cache-control", "no-store");
    return response;
  };

  /**
   * The user sees one message (`EXCHANGE_FAILED`); the log says which branch it was, so a
   * configuration problem (a connection not enabled for the app, a wrong client
   * authentication method, a redirect_uri that differs) is found from the log line.
   */
  const failed = (branch: string, details: Record<string, unknown>): NextResponse => {
    console.error(JSON.stringify({ event: "github_link_exchange_failed", branch, ...details }));
    return finish({ reason: "EXCHANGE_FAILED" });
  };

  const params = request.nextUrl.searchParams;
  const expected = request.cookies.get(LINK_STATE_COOKIE)?.value;
  if (!sameState(expected, params.get("state"))) return finish({ reason: "STATE_MISMATCH" });

  // The student cancelled at GitHub, or Auth0 refused.
  const oauthError = params.get("error");
  if (oauthError) {
    if (oauthError === "access_denied") return finish({ reason: "ACCESS_DENIED" });
    return failed("auth0_error", {
      error: oauthFields(oauthError),
      error_description: oauthFields(params.get("error_description")),
    });
  }

  const code = params.get("code");
  const domain = normalizeDomain(process.env.AUTH0_DOMAIN);
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!code || code.length > 2048) return failed("no_code", {});
  if (!isDomain(domain) || !clientId || !clientSecret) {
    return failed("not_configured", {
      unusable: [
        !isDomain(domain) && "AUTH0_DOMAIN",
        !clientId && "AUTH0_CLIENT_ID",
        !clientSecret && "AUTH0_CLIENT_SECRET",
      ].filter(Boolean),
    });
  }

  let idToken: string | undefined;
  try {
    const response = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: new URL(CALLBACK_PATH, origin).toString(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(EXCHANGE_TIMEOUT_MS),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const fields = (body ?? {}) as { error?: unknown; error_description?: unknown };
      return failed("exchange_rejected", {
        status: response.status,
        error: oauthFields(fields.error),
        error_description: oauthFields(fields.error_description),
      });
    }
    const candidate = (body as { id_token?: unknown } | null)?.id_token;
    if (typeof candidate === "string" && candidate.length > 0) idToken = candidate;
    else return failed("no_id_token", { status: response.status });
  } catch (error) {
    // Only the kind of failure (TimeoutError, TypeError for a network error): never a message
    // that might carry a URL.
    return failed("exchange_threw", { name: error instanceof Error ? error.name : "unknown" });
  }

  try {
    await linkGithub(idToken);
    return finish("connected");
  } catch (error) {
    if (error instanceof ApiError) return finish({ reason: toReturnReason(error.code) });
    throw error;
  }
}
