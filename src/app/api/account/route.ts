import type { NextRequest } from "next/server";
import { deleteMe } from "@/lib/api/client";
import { failure, json } from "@/lib/notifications/http";

/**
 * Delete the caller's account. A route handler, not a server action, on purpose: a server
 * action's answer carries the re-rendered current page, and re-rendering `/account` after the
 * delete calls `GET /v1/me`, which, with a token that is still valid, creates a new empty
 * account (m2-plan Q7). A route handler returns only `{ ok }`; nothing renders.
 *
 * The caller is the session (the token goes to the API, which decides). Same-origin only:
 * a browser sends `Origin` on this request, and anything else is refused (CSRF on top of the
 * session cookie's SameSite=Lax).
 */
export async function DELETE(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return json({ code: "FORBIDDEN" }, 403);
  }
  try {
    await deleteMe();
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
