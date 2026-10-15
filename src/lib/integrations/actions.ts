"use server";

import { cookies } from "next/headers";
import { ApiError, connectGithub, disconnectGithub } from "@/lib/api/client";
import { previewAppBaseUrl } from "@/lib/auth/appBaseUrl";
import {
  CALLBACK_PATH,
  LINK_STATE_COOKIE,
  appOrigin,
  authorizeUrl,
  isDomain,
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
 * useless without the matching id token and this user's session.
 */
export async function startGithubConnectAction(): Promise<ConnectResult> {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const origin = appOrigin(process.env, previewAppBaseUrl());
  if (!isDomain(domain) || !clientId || !origin) {
    return { ok: false, code: "INTEGRATION_UNAVAILABLE" };
  }

  let result;
  try {
    result = await connectGithub();
  } catch (error) {
    return failed(error);
  }
  if (result.state === "connected") return { ok: true, state: "connected", login: result.login };

  const state = newState();
  (await cookies()).set(
    LINK_STATE_COOKIE,
    state,
    stateCookieOptions(process.env.NODE_ENV === "production"),
  );
  const url = authorizeUrl({
    domain,
    clientId,
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
