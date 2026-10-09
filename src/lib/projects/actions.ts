"use server";

import {
  ApiError,
  createProject,
  deleteProject,
  listMyProjects,
  updateProject,
} from "@/lib/api/client";
import type { FieldErrors } from "@/lib/profile/headerPatch";
import { fieldsFromDetails, parseProjectForm } from "./form";
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

export type ProjectActionResult =
  { ok: true; id: string } | { ok: false; code: string; fields?: FieldErrors };

function failed(error: unknown): ProjectActionResult {
  if (error instanceof ApiError) {
    return { ok: false, code: error.code, fields: fieldsFromDetails(error.details) };
  }
  throw error;
}

const invalidInput: ProjectActionResult = { ok: false, code: "VALIDATION_FAILED" };

/**
 * Create the caller's project. A public endpoint: no user id is taken (the Auth0
 * session decides the owner) and the form is checked before anything is sent.
 */
export async function createProjectAction(input: unknown): Promise<ProjectActionResult> {
  const parsed = parseProjectForm(input);
  if (!parsed.ok) return { ok: false, code: "VALIDATION_FAILED", fields: parsed.errors };
  try {
    return { ok: true, id: (await createProject(parsed.body)).id };
  } catch (error) {
    return failed(error);
  }
}

/** Change a project. The id is only a path: the API answers 404 to anyone but the owner. */
export async function updateProjectAction(
  id: unknown,
  input: unknown,
): Promise<ProjectActionResult> {
  if (typeof id !== "string") return invalidInput;
  const parsed = parseProjectForm(input);
  if (!parsed.ok) return { ok: false, code: "VALIDATION_FAILED", fields: parsed.errors };
  try {
    return { ok: true, id: (await updateProject(id, parsed.body)).id };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteProjectAction(
  id: unknown,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (typeof id !== "string") return { ok: false, code: "VALIDATION_FAILED" };
  try {
    await deleteProject(id);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, code: error.code };
    throw error;
  }
}
