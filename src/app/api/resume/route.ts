import type { NextRequest } from "next/server";
import { generateResume } from "@/lib/api/client";
import { json, failure } from "@/lib/notifications/http";
import { isResumeRequest } from "@/lib/resume/request";
import { jsonBody } from "@/lib/http/jsonBody";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return json({ code: "FORBIDDEN" }, 403);
  try {
    const body = await jsonBody(request);
    if (!isResumeRequest(body)) return json({ code: "VALIDATION_FAILED" }, 400);
    const bytes = await generateResume(body);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="gradfolio-resume.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
