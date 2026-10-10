import { NextRequest, NextResponse } from "next/server";
import { ApiError, getSuggestions } from "@/lib/api/client";
import { MIN_SUGGEST_LENGTH, cleanQuery } from "@/lib/discovery/query";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Typeahead for the search box. The browser asks this same-origin route and never the API
 * (Q11); the answer is public content only and carries no identity. The query is cleaned
 * the way the search page cleans it, so a crafted one cannot make the API answer 400.
 */
export async function GET(request: NextRequest) {
  const q = cleanQuery(request.nextUrl.searchParams.get("q") ?? "");
  if (Array.from(q).length < MIN_SUGGEST_LENGTH) {
    return NextResponse.json({ code: "VALIDATION_FAILED" }, { status: 400, headers: NO_STORE });
  }
  try {
    return NextResponse.json(await getSuggestions(q), { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status >= 400 && error.status < 600 ? error.status : 502;
      return NextResponse.json({ code: error.code }, { status, headers: NO_STORE });
    }
    console.error("suggest route failed", {
      error: error instanceof Error ? error.name : typeof error,
    });
    return NextResponse.json({ code: "UNKNOWN_ERROR" }, { status: 500, headers: NO_STORE });
  }
}
