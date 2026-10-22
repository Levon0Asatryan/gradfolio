import type { NextRequest } from "next/server";
import { unsubscribeInvitationEmail } from "@/lib/api/client";
import { failure, json } from "@/lib/notifications/http";
import { jsonBody } from "@/lib/http/jsonBody";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return json({ code: "FORBIDDEN" }, 403);
  try {
    const body = await jsonBody(request, 2048);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !("token" in body) ||
      typeof body.token !== "string" ||
      body.token.length < 1 ||
      body.token.length > 1000
    )
      return json({ code: "VALIDATION_FAILED" }, 400);
    return json(await unsubscribeInvitationEmail(body.token));
  } catch (error) {
    return failure(error);
  }
}
