import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/** A JSON answer that no cache may keep: the data is the signed-in user's own. */
export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/**
 * An `ApiError` becomes its status and stable code; the browser sees `{ code }` and
 * never the API's message. Anything else is ours to log, not to show.
 */
export function failure(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 502;
    return json({ code: error.code }, status);
  }
  console.error("notifications route failed", {
    error: error instanceof Error ? error.name : typeof error,
  });
  return json({ code: "UNKNOWN_ERROR" }, 500);
}
