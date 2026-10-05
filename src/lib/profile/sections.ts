import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";
import type { FieldError, FieldErrors } from "./headerPatch";

/**
 * The editable list sections (education, experience, certifications): which
 * fields each has, and one check for the form and the server action. The shapes
 * follow gradfolio-api's openapi.yaml (`createEducation` and friends); the API
 * validates again and owns the caps (409 LIMIT_REACHED).
 */

export const SECTIONS = ["education", "experience", "certifications"] as const;
export type Section = (typeof SECTIONS)[number];

export const isSection = (v: unknown): v is Section =>
  typeof v === "string" && (SECTIONS as readonly string[]).includes(v);

type Kind = "text" | "multiline" | "year" | "month" | "url" | "lines";
export interface FieldSpec {
  key: string;
  kind: Kind;
  /** Must be non-empty on create and whenever it is sent. */
  required?: boolean;
  /** An optional text/date/year that a blank value clears (`null`). */
  nullable?: boolean;
  /** `lines`: the most items the API takes. */
  maxItems?: number;
}

export const FIELDS = {
  education: [
    { key: "institution", kind: "text", required: true },
    { key: "degree", kind: "text", required: true },
    { key: "field", kind: "text", required: true },
    { key: "startYear", kind: "year", required: true },
    { key: "endYear", kind: "year", nullable: true },
    { key: "description", kind: "multiline", nullable: true },
    { key: "highlights", kind: "lines", maxItems: 20 },
  ],
  experience: [
    { key: "title", kind: "text", required: true },
    { key: "organization", kind: "text", required: true },
    { key: "start", kind: "month", required: true },
    { key: "end", kind: "month", nullable: true },
    { key: "summary", kind: "multiline", required: true },
    { key: "achievements", kind: "lines", maxItems: 20 },
    { key: "skills", kind: "lines", maxItems: 30 },
  ],
  certifications: [
    { key: "name", kind: "text", required: true },
    { key: "issuer", kind: "text", required: true },
    { key: "date", kind: "month", required: true },
    { key: "credentialUrl", kind: "url", nullable: true },
  ],
} as const satisfies Record<Section, readonly FieldSpec[]>;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

export type EntryResult =
  { ok: true; body: Record<string, unknown> } | { ok: false; errors: FieldErrors };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * `create`: every required field must be present and non-empty, so an entry is
 * never POSTed half-filled. `update`: any non-empty subset; a required field
 * that is sent must still be non-empty.
 */
export function parseEntry(
  section: Section,
  input: unknown,
  mode: "create" | "update",
): EntryResult {
  if (!isRecord(input)) return { ok: false, errors: { _: "invalid" } };
  const specs: readonly FieldSpec[] = FIELDS[section];
  const known = new Set(specs.map((s) => s.key));
  const errors: Record<string, FieldError> = {};
  const body: Record<string, unknown> = {};

  for (const key of Object.keys(input)) if (!known.has(key)) errors[key] = "invalid";

  for (const spec of specs) {
    const raw = input[spec.key];
    const sent = raw !== undefined;
    if (!sent) {
      if (mode === "create" && spec.required) errors[spec.key] = "required";
      continue;
    }

    if (spec.kind === "lines") {
      if (!Array.isArray(raw) || raw.some((x) => typeof x !== "string")) {
        errors[spec.key] = "invalid";
        continue;
      }
      const items = (raw as string[]).map((x) => x.trim()).filter(Boolean);
      if (items.length > (spec.maxItems ?? Infinity)) errors[spec.key] = "invalid";
      else body[spec.key] = items;
      continue;
    }

    if (spec.kind === "year") {
      const blank = raw === null || (typeof raw === "string" && raw.trim() === "");
      if (blank) {
        if (spec.required) errors[spec.key] = "required";
        else body[spec.key] = null;
        continue;
      }
      const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : NaN;
      if (!Number.isInteger(n) || n < YEAR_MIN || n > YEAR_MAX) errors[spec.key] = "invalid_year";
      else body[spec.key] = n;
      continue;
    }

    if (raw !== null && typeof raw !== "string") {
      errors[spec.key] = "invalid";
      continue;
    }
    const text = (raw ?? "").trim();
    if (text === "") {
      if (spec.required) errors[spec.key] = "required";
      else body[spec.key] = null;
      continue;
    }
    if (spec.kind === "month" && !MONTH.test(text)) errors[spec.key] = "invalid_month";
    else if (spec.kind === "url" && !safeHttpUrl(text)) errors[spec.key] = "invalid_url";
    else body[spec.key] = text;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  if (Object.keys(body).length === 0) return { ok: false, errors: { _: "invalid" } };
  return { ok: true, body };
}

/** `ids` for a reorder: non-empty strings the API will check against the caller's entries. */
export function parseIds(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 1000) return null;
  if (input.some((x) => typeof x !== "string" || x === "" || x.length > 36)) return null;
  return new Set(input).size === input.length ? (input as string[]) : null;
}

const SKILLS_MAX = 1000;

/** The skill list for `PUT /v1/me/skills`: trimmed, blanks dropped; the API normalizes and dedupes. */
export function parseSkills(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.some((x) => typeof x !== "string")) return null;
  const skills = (input as string[]).map((x) => x.trim()).filter(Boolean);
  return skills.length <= SKILLS_MAX ? skills : null;
}
