"use server";

import {
  ApiError,
  importGithubRepos,
  listGithubRepos,
  syncGithubProject,
  type GithubImportEdit,
} from "@/lib/api/client";
import type { GithubImportResponse, GithubRepoPage, GithubSyncResult } from "@/lib/api/types";
import { IMPORT_MAX } from "./importLimits";
import { PROJECT_LIMITS } from "@/lib/projects/limits";

/**
 * Public endpoints, like every server action: no user id, nothing trusted. The caller is the
 * session; arguments are checked here before anything is forwarded (the API checks again).
 */
export type Failure = { ok: false; code: string; retryAfter?: number };
const invalid: Failure = { ok: false, code: "VALIDATION_FAILED" };

function failed(error: unknown): Failure {
  if (error instanceof ApiError) {
    return {
      ok: false,
      code: error.code,
      ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
    };
  }
  throw error;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const QUERY_MAX = 100;
const CURSOR_MAX = 20;

/** One page of the caller's repositories, optionally searched. */
export async function listGithubReposAction(
  input: unknown,
): Promise<{ ok: true; page: GithubRepoPage } | Failure> {
  if (!isRecord(input)) return invalid;
  const { cursor, q } = input;
  if (cursor !== undefined && (typeof cursor !== "string" || cursor.length > CURSOR_MAX)) {
    return invalid;
  }
  if (q !== undefined && (typeof q !== "string" || q.length > QUERY_MAX * 4)) return invalid;
  const search = typeof q === "string" ? q.trim().slice(0, QUERY_MAX) : "";
  try {
    return {
      ok: true,
      page: await listGithubRepos({
        ...(typeof cursor === "string" && cursor ? { cursor } : {}),
        ...(search ? { q: search } : {}),
      }),
    };
  } catch (error) {
    return failed(error);
  }
}

const isHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/** An edit from the review step: only these fields, each within the project limits. */
function parseEdit(repoId: number, value: unknown): GithubImportEdit | null {
  if (!isRecord(value)) return null;
  const edit: GithubImportEdit = { repoId };
  for (const [key, field] of Object.entries(value)) {
    if (key === "title") {
      if (typeof field !== "string") return null;
      const title = field.trim();
      if (title.length < 1 || [...title].length > PROJECT_LIMITS.title.max) return null;
      edit.title = title;
    } else if (key === "summary") {
      if (
        typeof field !== "string" ||
        new TextEncoder().encode(field).length > PROJECT_LIMITS.summary.max
      )
        return null;
      edit.summary = field.trim();
    } else if (key === "technologies") {
      if (
        !Array.isArray(field) ||
        field.length > PROJECT_LIMITS.technologies ||
        field.some((t) => typeof t !== "string" || t.trim().length < 1 || [...t].length > 100)
      ) {
        return null;
      }
      edit.technologies = (field as string[]).map((t) => t.trim());
    } else if (key === "repoUrl") {
      if (typeof field !== "string" || field.length > 2048 || !isHttpUrl(field)) return null;
      edit.repoUrl = field;
    } else {
      return null; // an unknown key is a refusal, not an ignore
    }
  }
  return edit;
}

/**
 * Import the chosen repositories as drafts, with the review step's edits, in one request.
 * Nothing is created without this call, and it is made only by the user's Save.
 */
export async function importGithubReposAction(
  input: unknown,
): Promise<{ ok: true; response: GithubImportResponse } | Failure> {
  if (!isRecord(input) || !Array.isArray(input.repoIds)) return invalid;
  const ids = input.repoIds;
  if (
    ids.length < 1 ||
    ids.length > IMPORT_MAX ||
    ids.some((id) => !Number.isSafeInteger(id) || (id as number) <= 0) ||
    new Set(ids).size !== ids.length
  ) {
    return invalid;
  }
  const repoIds = ids as number[];

  const edits: GithubImportEdit[] = [];
  if (input.edits !== undefined) {
    if (!isRecord(input.edits)) return invalid;
    for (const [key, value] of Object.entries(input.edits)) {
      const repoId = Number(key);
      // An edit for a repository that is not in this import is a mistake, not a feature.
      if (!Number.isSafeInteger(repoId) || !repoIds.includes(repoId)) return invalid;
      const edit = parseEdit(repoId, value);
      if (!edit) return invalid;
      if (Object.keys(edit).length > 1) edits.push(edit);
    }
  }
  try {
    return { ok: true, response: await importGithubRepos(repoIds, edits) };
  } catch (error) {
    return failed(error);
  }
}

/** Re-sync one imported project; the API decides ownership (404 for anyone else's). */
export async function syncProjectAction(
  input: unknown,
): Promise<{ ok: true; result: GithubSyncResult } | Failure> {
  if (
    !isRecord(input) ||
    typeof input.projectId !== "string" ||
    typeof input.dryRun !== "boolean"
  ) {
    return invalid;
  }
  try {
    return { ok: true, result: await syncGithubProject(input.projectId, input.dryRun) };
  } catch (error) {
    return failed(error);
  }
}
