import "server-only";
import { AccessTokenError } from "@auth0/nextjs-auth0/errors";
import { auth0 } from "@/lib/auth0";

/**
 * gradfolio-api, called from this app's server only (Q11): the access token
 * never reaches the browser. Every failure becomes an ApiError with the API's
 * stable `code` (its error envelope is `{ code, message }`), or one of ours
 * for failures that never reached the API.
 */

/** The caller's account, `GET /v1/me` (gradfolio-api openapi.yaml `getMe`). */
export interface Me {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  headline: string;
  verified: boolean;
  isPublic: boolean;
  identities: string[];
}

/** Codes produced here, before or instead of an API answer. */
const LOCAL_CODES = {
  notConfigured: "API_NOT_CONFIGURED",
  unreachable: "API_UNREACHABLE",
  unauthenticated: "UNAUTHENTICATED",
  unknown: "UNKNOWN_ERROR",
} as const;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TIMEOUT_MS = 10_000;

function isEnvelope(value: unknown): value is { code: string; message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

async function accessToken(): Promise<string> {
  try {
    const { token } = await auth0.getAccessToken();
    return token;
  } catch (error) {
    // No session, or the refresh token is gone: the user has to sign in again.
    if (error instanceof AccessTokenError) {
      throw new ApiError(401, LOCAL_CODES.unauthenticated, "sign in again");
    }
    throw error;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const base = process.env.API_BASE_URL;
  if (!base) throw new ApiError(503, LOCAL_CODES.notConfigured, "API_BASE_URL is not set");

  const token = await accessToken();
  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(503, LOCAL_CODES.unreachable, "the API did not answer");
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    if (isEnvelope(body)) throw new ApiError(response.status, body.code, body.message);
    throw new ApiError(response.status, LOCAL_CODES.unknown, `HTTP ${response.status}`);
  }
  return body as T;
}

/** The signed-in user's account; the API creates it on the first call. */
export function getMe(): Promise<Me> {
  return apiGet<Me>("/v1/me");
}
