"use server";

import { ApiError, listMyProjects } from "@/lib/api/client";
import type { ProjectSummary } from "@/lib/api/types";
import { parseListQuery, PROJECTS_PAGE_SIZE } from "./listQuery";

export type LoadMoreResult =
  { ok: true; items: ProjectSummary[]; nextCursor: string | null } | { ok: false; code: string };

/**
 * The next page of the caller's own projects ("Load more"). A server action is a
 * public endpoint: it takes no user id (the Auth0 session decides whose projects),
 * and the filters and cursor are checked before they are forwarded.
 */
export async function loadMoreProjectsAction(input: unknown): Promise<LoadMoreResult> {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const query = parseListQuery(raw);
  if (!query.cursor) return { ok: false, code: "VALIDATION_FAILED" };
  try {
    const page = await listMyProjects({ ...query, limit: PROJECTS_PAGE_SIZE });
    return { ok: true, items: page.items, nextCursor: page.nextCursor };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, code: error.code };
    throw error;
  }
}
