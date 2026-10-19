"use server";

import { cookies, headers } from "next/headers";
import { ApiError, connectGithub, disconnectGithub } from "@/lib/api/client";
import { previewAppBaseUrl } from "@/lib/auth/appBaseUrl";
import { auth0ConnectSettings } from "@/lib/auth/auth0Settings";
import {
  CALLBACK_PATH,
  LINK_STATE_COOKIE,
  RETURN_COOKIE,
  returnTarget,
  appOrigin,
  authorizeUrl,
  newState,
  stateCookieOptions,
} from "./githubLink";

/**
 * Public endpoints, like every server action: they take no user id and no argument at all,
 * so there is nothing to trust. The caller is the Auth0 session; the API decides.
 */
export type ConnectResult =
  | { ok: true; state: "connected"; login: string }
  | { ok: true; state: "redirect"; url: string }
  | { ok: false; code: string; retryAfter?: number };

/** The origin the request arrived on (Vercel sets the forwarded headers), or null. */
async function requestOrigin(): Promise<string | null> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host || !/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return null;
    const proto = h.get("x-forwarded-proto") === "http" ? "http" : "https";
    return `${proto}://${host}`;
  } catch {
    return null;
  }
}

const failed = (error: unknown): { ok: false; code: string; retryAfter?: number } => {
  if (error instanceof ApiError) {
    return {
      ok: false,
      code: error.code,
      ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
    };
  }
  throw error;
};

/**
 * Starts "Connect GitHub". Either the account is connected at once (the student already signs
 * in with GitHub), or the API hands out a nonce and this action returns the Auth0 authorize URL
 * of the secondary sign-in, after putting the one-time `state` in an HttpOnly cookie. The
 * browser then navigates there; the nonce is in the URL because Auth0 needs it there, and is
 * useless without the matching id token and this user's session. `from` names the page to
 * return to (`integrations` or `connections`); anything else is `integrations`.
 */
export async function startGithubConnectAction(from?: unknown): Promise<ConnectResult> {
  const settings = auth0ConnectSettings(process.env, { needSecret: false });
  const origin = appOrigin(process.env, previewAppBaseUrl(), await requestOrigin());
  // This is not the API's 503: nothing was sent. Say which setting, never its value.
  if (!settings.ok || !origin) {
    const unusable = settings.ok ? [] : settings.unusable;
    console.error(
      JSON.stringify({
        event: "github_connect_not_configured",
        unusable: origin ? unusable : [...unusable, "APP_BASE_URL"],
      }),
    );
    return { ok: false, code: "INTEGRATION_NOT_CONFIGURED_FE" };
  }

  let result;
  try {
    result = await connectGithub();
  } catch (error) {
    return failed(error);
  }
  if (result.state === "connected") return { ok: true, state: "connected", login: result.login };

  const state = newState();
  const jar = await cookies();
  const options = stateCookieOptions(process.env.NODE_ENV === "production");
  jar.set(LINK_STATE_COOKIE, state, options);
  // Where to come back to: a word from a closed list, validated here and again by the callback.
  jar.set(RETURN_COOKIE, returnTarget(from), options);
  const url = authorizeUrl({
    domain: settings.domain,
    connection: settings.connection,
    clientId: settings.clientId,
    redirectUri: new URL(CALLBACK_PATH, origin).toString(),
    state,
    nonce: result.nonce,
  });
  return { ok: true, state: "redirect", url: url.toString() };
}

export type DisconnectResult = { ok: true } | { ok: false; code: string; retryAfter?: number };

/** Disconnect GitHub. The API revokes at GitHub first; see `GITHUB_REVOKE_FAILED` handling. */
export async function disconnectGithubAction(): Promise<DisconnectResult> {
  try {
    await disconnectGithub();
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}
