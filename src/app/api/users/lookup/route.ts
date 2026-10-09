import type { NextRequest } from "next/server";
import { lookupUsers } from "@/lib/api/client";
import { failure, json } from "@/lib/notifications/http";
import { parseLookupQuery } from "@/lib/team/form";

/**
 * The invite picker's search. Same-origin, so the token stays on the server (Q11). The
 * API has its own rate budget for this; a query it would refuse is refused here first.
 */
export async function GET(request: NextRequest) {
  const q = parseLookupQuery(request.nextUrl.searchParams.get("q"));
  if (q === null) return json({ code: "VALIDATION_FAILED" }, 400);
  try {
    return json({ items: await lookupUsers(q) });
  } catch (error) {
    return failure(error);
  }
}
