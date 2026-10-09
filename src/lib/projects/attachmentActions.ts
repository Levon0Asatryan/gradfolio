"use server";

import {
  ApiError,
  addAttachment,
  deleteAttachment,
  reorderAttachments,
  updateAttachment,
} from "@/lib/api/client";
import type { ProjectAttachment } from "@/lib/api/types";
import type { FieldErrors } from "@/lib/profile/headerPatch";
import { parseAttachment } from "./attachments";
import { fieldsFromDetails } from "./form";

export type AttachmentActionResult<T = ProjectAttachment> =
  { ok: true; value: T } | { ok: false; code: string; fields?: FieldErrors };

const invalid: { ok: false; code: string } = { ok: false, code: "VALIDATION_FAILED" };

function failed(error: unknown): { ok: false; code: string; fields?: FieldErrors } {
  if (error instanceof ApiError) {
    return { ok: false, code: error.code, fields: fieldsFromDetails(error.details) };
  }
  throw error;
}

/**
 * Attachment writes. Public endpoints: the project id and the attachment id are only
 * path parts (the API answers 404 to anyone but the owner), no user id is taken, and
 * the body is checked before it is forwarded.
 */
export async function addAttachmentAction(
  projectId: unknown,
  input: unknown,
): Promise<AttachmentActionResult> {
  if (typeof projectId !== "string") return invalid;
  const parsed = parseAttachment(input);
  if (!parsed.ok) return { ok: false, code: "VALIDATION_FAILED", fields: parsed.errors };
  try {
    return { ok: true, value: await addAttachment(projectId, parsed.body) };
  } catch (error) {
    return failed(error);
  }
}

export async function updateAttachmentAction(
  projectId: unknown,
  attachmentId: unknown,
  input: unknown,
): Promise<AttachmentActionResult> {
  if (typeof projectId !== "string" || typeof attachmentId !== "string") return invalid;
  const parsed = parseAttachment(input);
  if (!parsed.ok) return { ok: false, code: "VALIDATION_FAILED", fields: parsed.errors };
  try {
    // The type is fixed on the server: only url and title are sent.
    const { url, title } = parsed.body;
    return { ok: true, value: await updateAttachment(projectId, attachmentId, { url, title }) };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteAttachmentAction(
  projectId: unknown,
  attachmentId: unknown,
): Promise<AttachmentActionResult<true>> {
  if (typeof projectId !== "string" || typeof attachmentId !== "string") return invalid;
  try {
    await deleteAttachment(projectId, attachmentId);
    return { ok: true, value: true };
  } catch (error) {
    return failed(error);
  }
}

/** `ids` is every attachment of the project, once each, in the new order. */
export async function reorderAttachmentsAction(
  projectId: unknown,
  ids: unknown,
): Promise<AttachmentActionResult<ProjectAttachment[]>> {
  if (
    typeof projectId !== "string" ||
    !Array.isArray(ids) ||
    ids.length > 1000 ||
    ids.some((id) => typeof id !== "string") ||
    new Set(ids).size !== ids.length
  ) {
    return invalid;
  }
  try {
    return { ok: true, value: await reorderAttachments(projectId, ids as string[]) };
  } catch (error) {
    return failed(error);
  }
}
