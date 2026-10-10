"use server";

import { ApiError, listMyActivities } from "@/lib/api/client";
import type { Activity } from "@/lib/api/types";

export type MoreActivitiesResult =
  { ok: true; items: Activity[]; nextCursor: string | null } | { ok: false; code: string };

/** The API's cursor limit (an opaque base64url string, at most 600 characters). */
const MAX_CURSOR_LENGTH = 600;
/** Entries per "Show more". */
const ACTIVITIES_PAGE_SIZE = 20;

/**
 * The next entries of the caller's own feed. A server action is a public endpoint: it takes
 * no user id (the session decides whose feed this is) and its argument is `unknown`. A
 * `cursor`, when present, must be a string of 1 to 600 characters; anything else is refused
 * without a call to the API, and no other key is forwarded. Without a cursor it reads the
 * newest page (the dashboard shows only the newest few).
 */
export async function loadMoreActivitiesAction(input: unknown): Promise<MoreActivitiesResult> {
  const raw =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : null;
  if (raw === null || Array.isArray(input)) return { ok: false, code: "VALIDATION_FAILED" };
  const cursor = raw.cursor;
  if (cursor !== undefined) {
    if (typeof cursor !== "string" || cursor.length === 0 || cursor.length > MAX_CURSOR_LENGTH) {
      return { ok: false, code: "VALIDATION_FAILED" };
    }
  }
  try {
    const page = await listMyActivities({
      limit: ACTIVITIES_PAGE_SIZE,
      cursor: cursor as string | undefined,
    });
    return { ok: true, items: page.items, nextCursor: page.nextCursor };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, code: error.code };
    throw error;
  }
}
