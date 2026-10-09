import type { AttachmentBody } from "@/lib/api/types";
import { fits, type Limit } from "@/lib/profile/limits";
import type { FieldErrors } from "@/lib/profile/headerPatch";

/**
 * Checks an attachment form. Like the project form: one module for the dialog and for the
 * server actions, which are public endpoints. The API validates again (API plan §5.5) and
 * owns the rules; this rejects what can never be right and shapes the body.
 */
export const ATTACHMENT_TYPES = ["image", "video", "pdf", "link"] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

/** The API's `PROJECT_MAX_ATTACHMENTS` default. */
export const MAX_ATTACHMENTS = 20;
const TITLE: Limit = { kind: "chars", max: 500 };
const URL_LIMIT: Limit = { kind: "bytes", max: 65_535 };

/** `ATTACHMENT_VIDEO_HOSTS` (API §5.5): the parsed hostname must be one of these. */
const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "player.vimeo.com",
]);

export interface AttachmentValues {
  type: AttachmentType;
  url: string;
  title: string;
}

export type AttachmentResult =
  { ok: true; body: AttachmentBody } | { ok: false; errors: FieldErrors };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseAttachment(input: unknown): AttachmentResult {
  if (!isRecord(input)) return { ok: false, errors: { _: "invalid" } };
  const errors: FieldErrors = {};
  for (const key of Object.keys(input)) {
    if (key !== "type" && key !== "url" && key !== "title") errors[key] = "invalid";
  }
  const type = input.type;
  if (typeof type !== "string" || !(ATTACHMENT_TYPES as readonly string[]).includes(type)) {
    errors.type = "invalid";
  }
  const url = typeof input.url === "string" ? input.url.trim() : "";
  if (url === "") errors.url = "required";
  else if (!fits(url, URL_LIMIT)) errors.url = "too_long";
  else {
    let parsed: URL | null = null;
    try {
      parsed = new URL(url);
    } catch {
      parsed = null;
    }
    // https only, no credentials, for every type (API §5.5).
    if (!parsed || parsed.protocol !== "https:" || parsed.username || parsed.password) {
      errors.url = "invalid_url";
    } else if (type === "video" && !VIDEO_HOSTS.has(parsed.hostname)) {
      errors.url = "invalid_host";
    }
  }
  const rawTitle = input.title;
  if (rawTitle !== undefined && rawTitle !== null && typeof rawTitle !== "string") {
    errors.title = "invalid";
  }
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (title !== "" && !fits(title, TITLE)) errors.title = "too_long";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    body: { type: type as AttachmentType, url, title: title === "" ? null : title },
  };
}
