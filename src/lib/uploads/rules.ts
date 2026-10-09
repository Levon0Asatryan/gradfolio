/**
 * What the API's `POST /v1/me/uploads` accepts (API plan §3.5): images png, jpeg,
 * webp and gif up to 5 MB, PDF up to 20 MB, nothing else (no SVG, no HTML). These
 * are the defaults of `UPLOAD_MAX_IMAGE_BYTES` and `UPLOAD_MAX_PDF_BYTES`. The
 * checks here only spare the user a round trip: the signature pins the exact type
 * and size, so the bucket enforces them whatever this file says.
 */
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const PDF_TYPE = "application/pdf";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

/** What a control accepts: an image only, or an image or a PDF. */
export type UploadKind = "image" | "file";

export type FileCheck = "ok" | "empty" | "type" | "too_big";

export function acceptAttribute(kind: UploadKind): string {
  return kind === "image" ? IMAGE_TYPES.join(",") : [...IMAGE_TYPES, PDF_TYPE].join(",");
}

/** The limit for a type, or undefined when the type is not allowed for this control. */
export function maxBytesFor(type: string, kind: UploadKind): number | undefined {
  if ((IMAGE_TYPES as readonly string[]).includes(type)) return MAX_IMAGE_BYTES;
  if (kind === "file" && type === PDF_TYPE) return MAX_PDF_BYTES;
  return undefined;
}

export function checkFile(file: { type: string; size: number }, kind: UploadKind): FileCheck {
  const max = maxBytesFor(file.type, kind);
  if (max === undefined) return "type";
  if (file.size <= 0) return "empty";
  if (file.size > max) return "too_big";
  return "ok";
}
