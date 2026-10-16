"use server";

import {
  ApiError,
  importGithubRepos,
  listGithubRepos,
  previewGithubImport,
  syncGithubProject,
  type GithubOverride,
} from "@/lib/api/client";
import type {
  GithubImportResponse,
  GithubPreviewResponse,
  GithubRepoPage,
  GithubSyncResult,
} from "@/lib/api/types";
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

/** An override from the review step: only these fields, each within the project limits. */
function parseOverride(value: unknown): GithubOverride | null {
  if (!isRecord(value)) return null;
  const out: GithubOverride = {};
  for (const [key, field] of Object.entries(value)) {
    if (key === "title") {
      if (typeof field !== "string") return null;
      const title = field.trim();
      if (title.length < 1 || [...title].length > PROJECT_LIMITS.title.max) return null;
      out.title = title;
    } else if (key === "summary") {
      if (field === null) out.summary = null;
      else if (
        typeof field === "string" &&
        new TextEncoder().encode(field).length <= PROJECT_LIMITS.summary.max
      ) {
        out.summary = field.trim();
      } else return null;
    } else if (key === "technologies") {
      if (
        !Array.isArray(field) ||
        field.length > PROJECT_LIMITS.technologies ||
        field.some((t) => typeof t !== "string" || t.trim().length < 1 || [...t].length > 100)
      ) {
        return null;
      }
      out.technologies = (field as string[]).map((t) => t.trim());
    } else {
      return null; // an unknown key is a refusal, not an ignore
    }
  }
  return out;
}

/** Validates `repoIds`: 1 to 10 distinct positive integers. */
function parseRepoIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  if (
    value.length < 1 ||
    value.length > IMPORT_MAX ||
    value.some((id) => !Number.isSafeInteger(id) || (id as number) <= 0) ||
    new Set(value).size !== value.length
  ) {
    return null;
  }
  return value as number[];
}

/** The drafts an import would create, for the review step. Saves nothing. */
export async function previewGithubImportAction(
  input: unknown,
): Promise<{ ok: true; response: GithubPreviewResponse } | Failure> {
  if (!isRecord(input)) return invalid;
  const repoIds = parseRepoIds(input.repoIds);
  if (!repoIds) return invalid;
  try {
    return { ok: true, response: await previewGithubImport(repoIds) };
  } catch (error) {
    return failed(error);
  }
}

/**
 * Import the chosen repositories as drafts, with the review step's overrides, in one request.
 * Nothing is created without this call, and it is made only by the student's Save.
 */
export async function importGithubReposAction(
  input: unknown,
): Promise<{ ok: true; response: GithubImportResponse } | Failure> {
  if (!isRecord(input)) return invalid;
  const repoIds = parseRepoIds(input.repoIds);
  if (!repoIds) return invalid;

  const overrides: Record<string, GithubOverride> = {};
  if (input.overrides !== undefined) {
    if (!isRecord(input.overrides)) return invalid;
    for (const [key, value] of Object.entries(input.overrides)) {
      const repoId = Number(key);
      // An override for a repository that is not in this import is a mistake, not a feature.
      if (!Number.isSafeInteger(repoId) || !repoIds.includes(repoId)) return invalid;
      const override = parseOverride(value);
      if (!override) return invalid;
      if (Object.keys(override).length > 0) overrides[String(repoId)] = override;
    }
  }
  try {
    return { ok: true, response: await importGithubRepos(repoIds, overrides) };
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
