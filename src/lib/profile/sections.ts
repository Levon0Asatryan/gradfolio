import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";
import type { FieldError, FieldErrors } from "./headerPatch";
import { LIMITS, fits, type Limit } from "./limits";

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

type Kind = "text" | "multiline" | "year" | "month" | "url" | "lines" | "chips";
export interface FieldSpec {
  key: string;
  kind: Kind;
  /** Must be non-empty on create and whenever it is sent. */
  required?: boolean;
  /** An optional text/date/year that a blank value clears (`null`). */
  nullable?: boolean;
  /** `lines`: the most items the API takes. */
  maxItems?: number;
  /** Must be sent (create) but may be blank: sent as "" and never null (`experience.summary`). */
  allowEmpty?: boolean;
  /** How much text it holds; for `lines`, one item's limit. */
  limit?: Limit;
}

export const FIELDS = {
  education: [
    { key: "institution", kind: "text", required: true, limit: LIMITS.institution },
    { key: "degree", kind: "text", required: true, limit: LIMITS.degree },
    { key: "field", kind: "text", required: true, limit: LIMITS.field },
    { key: "startYear", kind: "year", required: true },
    { key: "endYear", kind: "year", nullable: true },
    { key: "description", kind: "multiline", nullable: true, limit: LIMITS.description },
    { key: "highlights", kind: "lines", maxItems: 20, limit: LIMITS.listItem },
  ],
  experience: [
    { key: "title", kind: "text", required: true, limit: LIMITS.title },
    { key: "organization", kind: "text", required: true, limit: LIMITS.organization },
    { key: "start", kind: "month", required: true },
    { key: "end", kind: "month", nullable: true },
    { key: "summary", kind: "multiline", allowEmpty: true, limit: LIMITS.summary },
    { key: "achievements", kind: "lines", maxItems: 20, limit: LIMITS.listItem },
    { key: "skills", kind: "chips", maxItems: 30, limit: LIMITS.term },
  ],
  certifications: [
    { key: "name", kind: "text", required: true, limit: LIMITS.certName },
    { key: "issuer", kind: "text", required: true, limit: LIMITS.issuer },
    { key: "date", kind: "month", required: true },
    { key: "credentialUrl", kind: "url", nullable: true, limit: LIMITS.credentialUrl },
  ],
} as const satisfies Record<Section, readonly FieldSpec[]>;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
/** The API's bounds for a year (openapi.yaml: minimum 1900, maximum 2100). */
export const YEAR_MIN = 1900;
export const YEAR_MAX = 2100;

/** [start, end]: an end before its start is refused by the API (endYear >= startYear, end >= start). */
const RANGES: readonly (readonly [string, string])[] = [
  ["startYear", "endYear"],
  ["start", "end"],
];

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
      if (mode === "create" && (spec.required || spec.allowEmpty)) errors[spec.key] = "required";
      continue;
    }

    if (spec.kind === "lines" || spec.kind === "chips") {
      if (!Array.isArray(raw) || raw.some((x) => typeof x !== "string")) {
        errors[spec.key] = "invalid";
        continue;
      }
      const items = (raw as string[]).map((x) => x.trim()).filter(Boolean);
      if (items.length > (spec.maxItems ?? Infinity)) errors[spec.key] = "invalid";
      else if (spec.limit && items.some((x) => !fits(x, spec.limit as Limit))) {
        errors[spec.key] = "too_long";
      } else body[spec.key] = items;
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
      else body[spec.key] = spec.allowEmpty ? "" : null;
      continue;
    }
    if (spec.kind === "month" && !MONTH.test(text)) errors[spec.key] = "invalid_month";
    else if (spec.kind === "url" && !safeHttpUrl(text)) errors[spec.key] = "invalid_url";
    else if (spec.limit && !fits(text, spec.limit)) errors[spec.key] = "too_long";
    else body[spec.key] = text;
  }

  // The API checks these on the whole entry; say so on the field, before sending.
  for (const [from, to] of RANGES) {
    const a = body[from];
    const b = body[to];
    if (
      a !== undefined &&
      b !== undefined &&
      a !== null &&
      b !== null &&
      (b as never) < (a as never)
    ) {
      errors[to] = "invalid_range";
    }
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

/** One skill must fit `terms.name` (255 characters). */
const skillFits = (x: string) => fits(x, LIMITS.term);

/** The skill list for `PUT /v1/me/skills`: trimmed, blanks dropped; the API normalizes and dedupes. */
export function parseSkills(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.some((x) => typeof x !== "string")) return null;
  const skills = (input as string[]).map((x) => x.trim()).filter(Boolean);
  return skills.length <= SKILLS_MAX && skills.every(skillFits) ? skills : null;
}
