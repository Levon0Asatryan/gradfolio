import { NextResponse, type NextRequest } from "next/server";
import { ApiError, linkGithub } from "@/lib/api/client";
import { previewAppBaseUrl } from "@/lib/auth/appBaseUrl";
import {
  CALLBACK_PATH,
  LINK_COOKIE_PATH,
  LINK_STATE_COOKIE,
  RETURN_COOKIE,
  RETURN_TARGETS,
  returnTarget,
  appOrigin,
  isDomain,
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = appOrigin(process.env, previewAppBaseUrl()) ?? request.nextUrl.origin;

  const back = RETURN_TARGETS[returnTarget(request.cookies.get(RETURN_COOKIE)?.value)];

  const finish = (result: "connected" | { reason: ReturnReason }): NextResponse => {
    const url = new URL(back, origin);
    if (result === "connected") url.searchParams.set("github", "connected");
    else {
      url.searchParams.set("github", "error");
      url.searchParams.set("reason", result.reason);
    }
    const response = NextResponse.redirect(url);
    response.cookies.set(LINK_STATE_COOKIE, "", { path: LINK_COOKIE_PATH, maxAge: 0 });
    response.cookies.set(RETURN_COOKIE, "", { path: LINK_COOKIE_PATH, maxAge: 0 });
    response.headers.set("cache-control", "no-store");
    return response;
  };

  const params = request.nextUrl.searchParams;
  const expected = request.cookies.get(LINK_STATE_COOKIE)?.value;
  if (!sameState(expected, params.get("state"))) return finish({ reason: "STATE_MISMATCH" });

  // The student cancelled at GitHub, or Auth0 refused.
  if (params.get("error")) {
    return finish({
      reason: params.get("error") === "access_denied" ? "ACCESS_DENIED" : "EXCHANGE_FAILED",
    });
  }

  const code = params.get("code");
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!code || code.length > 2048 || !isDomain(domain) || !clientId || !clientSecret) {
    return finish({ reason: "EXCHANGE_FAILED" });
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
    if (!response.ok) return finish({ reason: "EXCHANGE_FAILED" });
    const body: unknown = await response.json();
    const candidate = (body as { id_token?: unknown } | null)?.id_token;
    if (typeof candidate === "string" && candidate.length > 0) idToken = candidate;
  } catch {
    return finish({ reason: "EXCHANGE_FAILED" });
  }
  if (!idToken) return finish({ reason: "EXCHANGE_FAILED" });

  try {
    await linkGithub(idToken);
    return finish("connected");
  } catch (error) {
    if (error instanceof ApiError) return finish({ reason: toReturnReason(error.code) });
    throw error;
  }
}
