"use server";

import { ApiError, createUpload } from "@/lib/api/client";
import { checkFile, type UploadKind } from "./rules";

export type SignResult =
  | { ok: true; uploadUrl: string; headers: Record<string, string>; fileUrl: string }
  | { ok: false; code: string };

const PURPOSES = ["avatar", "hero", "attachment"] as const;
type Purpose = (typeof PURPOSES)[number];

/**
 * Where a signed URL may point: Google Cloud Storage over https, never anything else. The
 * API's signer (`@google-cloud/storage` v4 `getSignedUrl`) returns the path style,
 * `https://storage.googleapis.com/<bucket>/<key>?...`; the virtual-host style
 * (`<bucket>.storage.googleapis.com`) is accepted too. Only the first is what production
 * sends, and matching only the second refused every upload (docs/fe-m4-verification.md).
 */
const STORAGE_HOST = /^(?:[a-z0-9._-]+\.)?storage\.googleapis\.com$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Asks the API for a signed `PUT` (`POST /v1/me/uploads`). A public endpoint: it takes
 * no user id (the session decides), re-checks type and size, and hands the browser only
 * the signed URL, the headers to send and the file URL: never the Auth0 token (Q11).
 * An unconfigured storage is the API's 503 `STORAGE_UNAVAILABLE`, passed through.
 */
export async function signUploadAction(input: unknown): Promise<SignResult> {
  const invalid: SignResult = { ok: false, code: "VALIDATION_FAILED" };
  if (!isRecord(input)) return invalid;
  const { purpose, contentType, size, projectId } = input;
  if (typeof purpose !== "string" || !(PURPOSES as readonly string[]).includes(purpose)) {
    return invalid;
  }
  if (typeof contentType !== "string" || typeof size !== "number" || !Number.isInteger(size)) {
    return invalid;
  }
  // A PDF is only ever an attachment; the other purposes take images.
  const kind: UploadKind = purpose === "attachment" ? "file" : "image";
  if (checkFile({ type: contentType, size }, kind) !== "ok") {
    return invalid;
  }
  const needsProject = purpose === "hero" || purpose === "attachment";
  if (needsProject && typeof projectId !== "string") return invalid;
  if (!needsProject && projectId !== undefined) return invalid;

  try {
    const ticket = await createUpload({
      purpose: purpose as Purpose,
      contentType: contentType as "image/png",
      size,
      ...(needsProject ? { projectId: projectId as string } : {}),
    });
    try {
      const url = new URL(ticket.uploadUrl);
      if (url.protocol !== "https:" || !STORAGE_HOST.test(url.hostname)) throw new Error("host");
    } catch {
      return { ok: false, code: "UPLOAD_URL_REJECTED" };
    }
    if (ticket.method !== "PUT") return { ok: false, code: "UPLOAD_URL_REJECTED" };
    return {
      ok: true,
      uploadUrl: ticket.uploadUrl,
      headers: ticket.headers,
      fileUrl: ticket.fileUrl,
    };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, code: error.code };
    throw error;
  }
}
