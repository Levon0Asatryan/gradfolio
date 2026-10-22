import type { NextRequest } from "next/server";
import { getEmailPreferences, updateEmailPreferences } from "@/lib/api/client";
import { failure, json } from "@/lib/notifications/http";
import { jsonBody } from "@/lib/http/jsonBody";
import { isEmailPreferencesPatch } from "@/lib/email/preferences";

export async function GET() {
  try {
    return json(await getEmailPreferences());
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return json({ code: "FORBIDDEN" }, 403);
  try {
    const body = await jsonBody(request, 2048);
    if (!isEmailPreferencesPatch(body)) return json({ code: "VALIDATION_FAILED" }, 400);
    return json(await updateEmailPreferences(body));
  } catch (error) {
    return failure(error);
  }
}
