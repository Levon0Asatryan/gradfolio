"use server";

import {
  ApiError,
  confirmLinkedinImport,
  createLinkedinUpload,
  previewLinkedinImport,
} from "@/lib/api/client";
import type { LinkedinImportResult, LinkedinPreview } from "@/lib/api/types";
import { parseEntry, parseSkills, type Section } from "@/lib/profile/sections";
import { LINKEDIN_CONFIRM_MAX, LINKEDIN_ZIP_MAX_BYTES } from "./limits";

/**
 * Public endpoints, like every server action: no user id, nothing trusted. The caller is the
 * session; arguments are checked here before anything is forwarded (the API checks again).
 * The browser gets a signed URL and the headers to send, never the Auth0 token (Q11).
 */
export type Failure = { ok: false; code: string; retryAfter?: number };
const invalid: Failure = { ok: false, code: "VALIDATION_FAILED" };

/** Google Cloud Storage over https, as for every other upload (src/lib/uploads/actions.ts). */
const STORAGE_HOST = /^(?:[a-z0-9._-]+\.)?storage\.googleapis\.com$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

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

export type LinkedinSign =
  | {
      ok: true;
      uploadId: string;
      uploadUrl: string;
      headers: Record<string, string>;
    }
  | Failure;

/** Asks for a signed PUT for a ZIP of `size` bytes. */
export async function startLinkedinUploadAction(input: unknown): Promise<LinkedinSign> {
  if (!isRecord(input)) return invalid;
  const { size } = input;
  if (
    typeof size !== "number" ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > LINKEDIN_ZIP_MAX_BYTES
  ) {
    return invalid;
  }
  try {
    const ticket = await createLinkedinUpload(size);
    try {
      const url = new URL(ticket.uploadUrl);
      if (url.protocol !== "https:" || !STORAGE_HOST.test(url.hostname)) throw new Error("host");
    } catch {
      return { ok: false, code: "UPLOAD_URL_REJECTED" };
    }
    if (ticket.method !== "PUT") return { ok: false, code: "UPLOAD_URL_REJECTED" };
    return {
      ok: true,
      uploadId: ticket.uploadId,
      uploadUrl: ticket.uploadUrl,
      headers: ticket.headers,
    };
  } catch (error) {
    return failed(error);
  }
}

/** The proposal for an uploaded ZIP. Nothing is saved. */
export async function previewLinkedinAction(
  input: unknown,
): Promise<{ ok: true; preview: LinkedinPreview } | Failure> {
  if (!isRecord(input)) return invalid;
  const { uploadId } = input;
  if (typeof uploadId !== "string" || !UUID.test(uploadId)) return invalid;
  try {
    return { ok: true, preview: await previewLinkedinImport(uploadId) };
  } catch (error) {
    return failed(error);
  }
}

const SECTION_KEYS = [
  "experience",
  "education",
  "certifications",
] as const satisfies readonly Section[];

/**
 * Saves the kept entries. Each is checked like a manual entry (`parseEntry`, create), so
 * nothing half-filled is sent, and an empty selection is refused here: a confirm with
 * nothing in it would still stamp "last import".
 */
export async function confirmLinkedinAction(
  input: unknown,
): Promise<{ ok: true; result: LinkedinImportResult } | Failure> {
  if (!isRecord(input)) return invalid;
  const body: Record<string, unknown> = {};
  let total = 0;
  for (const key of SECTION_KEYS) {
    const list = input[key];
    if (!Array.isArray(list) || list.length > LINKEDIN_CONFIRM_MAX[key]) return invalid;
    const checked: Record<string, unknown>[] = [];
    for (const item of list) {
      const entry = parseEntry(key, item, "create");
      if (!entry.ok) return invalid;
      checked.push(entry.body);
    }
    body[key] = checked;
    total += checked.length;
  }
  const skills = parseSkills(input.skills);
  if (!skills || skills.length > LINKEDIN_CONFIRM_MAX.skills) return invalid;
  body.skills = skills;
  total += skills.length;
  if (total === 0) return invalid;
  try {
    return {
      ok: true,
      result: await confirmLinkedinImport(body as Parameters<typeof confirmLinkedinImport>[0]),
    };
  } catch (error) {
    return failed(error);
  }
}
