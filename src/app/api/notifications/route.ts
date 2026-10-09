import type { NextRequest } from "next/server";
import { listNotifications } from "@/lib/api/client";
import { failure, json } from "@/lib/notifications/http";
import { parseListParams } from "@/lib/notifications/listParams";

/**
 * The bell's list. The browser calls this same-origin route; the token stays on the
 * server (Q11). Without a session the client throws `UNAUTHENTICATED` before any API call.
 */
export async function GET(request: NextRequest) {
  const query = parseListParams(request.nextUrl.searchParams);
  if (!query) return json({ code: "VALIDATION_FAILED" }, 400);
  try {
    return json(await listNotifications(query));
  } catch (error) {
    return failure(error);
  }
}
