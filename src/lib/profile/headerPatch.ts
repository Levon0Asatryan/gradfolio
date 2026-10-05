import type { ProfileHeaderPatch } from "@/lib/api/types";
import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";

/**
 * Checks a profile-header edit. One module for the form and for the server
 * action: the action is a public endpoint and trusts nothing it is sent, so it
 * runs the same check the form does. The API validates again and owns the
 * limits; this only rejects what can never be right and shapes the body
 * (trimmed, blank nullable field -> `null`).
 */

const NULLABLE_TEXT = ["bio", "location"] as const;
const LINK_KEYS = ["github", "linkedin", "twitter", "website"] as const;
const KEYS = new Set<string>([
  "name",
  "headline",
  "bio",
  "location",
  "avatarUrl",
  "contactEmail",
  "isPublic",
  "links",
]);
// One @, no spaces, a dot in the domain. Deliverability is the API's business.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldError = "required" | "invalid_url" | "invalid_email" | "invalid";
export type FieldErrors = Partial<Record<string, FieldError>>;

export type HeaderPatchResult =
  { ok: true; patch: ProfileHeaderPatch } | { ok: false; errors: FieldErrors };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseHeaderPatch(input: unknown): HeaderPatchResult {
  if (!isRecord(input)) return { ok: false, errors: { _: "invalid" } };

  const errors: FieldErrors = {};
  const patch: Record<string, unknown> = {};

  for (const key of Object.keys(input)) {
    if (!KEYS.has(key)) errors[key] = "invalid";
  }

  const text = (key: string): string | undefined => {
    const v = input[key];
    if (v === undefined) return undefined;
    if (typeof v !== "string") {
      errors[key] = "invalid";
      return undefined;
    }
    return v.trim();
  };

  const name = text("name");
  if (name !== undefined) {
    if (name === "") errors.name = "required";
    else patch.name = name;
  }
  const headline = text("headline");
  if (headline !== undefined) patch.headline = headline;

  for (const key of NULLABLE_TEXT) {
    const v = input[key] === null ? "" : text(key);
    if (v !== undefined) patch[key] = v === "" ? null : v;
  }

  const url = (key: string, v: unknown): string | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (typeof v !== "string") {
      errors[key] = "invalid";
      return undefined;
    }
    const trimmed = v.trim();
    if (trimmed === "") return null;
    if (!safeHttpUrl(trimmed)) {
      errors[key] = "invalid_url";
      return undefined;
    }
    return trimmed;
  };

  const avatarUrl = url("avatarUrl", input.avatarUrl);
  if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl;

  if (input.contactEmail !== undefined) {
    const v = input.contactEmail === null ? "" : text("contactEmail");
    if (v !== undefined) {
      if (v === "") patch.contactEmail = null;
      else if (!EMAIL.test(v)) errors.contactEmail = "invalid_email";
      else patch.contactEmail = v;
    }
  }

  if (input.isPublic !== undefined) {
    if (typeof input.isPublic === "boolean") patch.isPublic = input.isPublic;
    else errors.isPublic = "invalid";
  }

  if (input.links !== undefined) {
    if (!isRecord(input.links)) errors.links = "invalid";
    else {
      const links: Record<string, string | null> = {};
      for (const key of Object.keys(input.links)) {
        if (!(LINK_KEYS as readonly string[]).includes(key)) {
          errors[`links.${key}`] = "invalid";
          continue;
        }
        const v = url(`links.${key}`, input.links[key]);
        if (v !== undefined) links[key] = v;
      }
      patch.links = links;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  if (Object.keys(patch).length === 0) return { ok: false, errors: { _: "invalid" } };
  return { ok: true, patch: patch as ProfileHeaderPatch };
}
