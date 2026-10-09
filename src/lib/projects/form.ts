import type { components } from "@/lib/api/schema";
import type { ProjectWriteBody } from "@/lib/api/types";
import { fits, measure, type Limit } from "@/lib/profile/limits";
import type { FieldErrors } from "@/lib/profile/headerPatch";
import { PROJECT_LIMITS } from "./limits";

/**
 * Checks a project form. One module for the form and for the server actions: an
 * action is a public endpoint and trusts nothing it is sent, so it runs the same
 * check the form does. The API validates again and owns the limits; this rejects
 * what can never be right and shapes the body (trimmed, blank -> `null`, terms
 * normalized like the API does, so the API's spelling rules never surprise the form).
 */

export const CATEGORIES = [
  "academic",
  "personal",
  "research",
  "hackathon",
  "course",
  "other",
] as const;
export const STATUSES = ["ongoing", "completed", "archived"] as const;

export type CreateProjectBody = ProjectWriteBody;

export interface LinkRow {
  label: string;
  url: string;
}

/** What the form holds: strings and booleans only, as typed. */
export interface ProjectFormValues {
  title: string;
  summary: string;
  descriptionHtml: string;
  category: (typeof CATEGORIES)[number];
  status: (typeof STATUSES)[number];
  startDate: string;
  endDate: string;
  course: string;
  professor: string;
  liveDemoUrl: string;
  repoUrl: string;
  heroImageUrl: string;
  technologies: string[];
  tags: string[];
  links: LinkRow[];
  isPublic: boolean;
  isDraft: boolean;
}

export const EMPTY_PROJECT: ProjectFormValues = {
  title: "",
  summary: "",
  descriptionHtml: "",
  category: "other",
  status: "ongoing",
  startDate: "",
  endDate: "",
  course: "",
  professor: "",
  liveDemoUrl: "",
  repoUrl: "",
  heroImageUrl: "",
  technologies: [],
  tags: [],
  links: [],
  isPublic: true,
  isDraft: false,
};

const KEYS = new Set<string>(Object.keys(EMPTY_PROJECT));

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** NFC, trimmed, whitespace runs collapsed: the API's `normalizeTerm`. */
const normalizeTerm = (value: string): string =>
  value.normalize("NFC").trim().replace(/\s+/gu, " ");

/** Normalized, empties dropped, case-insensitive duplicates dropped (the first spelling stays). */
export function normalizeTerms(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const term = normalizeTerm(raw);
    const key = term.toLowerCase();
    if (term === "" || seen.has(key)) continue;
    seen.add(key);
    out.push(term);
  }
  return out;
}

/** A real calendar day, `YYYY-MM-DD`, 1000-01-01 or later (the API's range). */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value) && value >= "1000-01-01";
}

/** An absolute URL with one of `protocols`, no credentials. */
function urlOk(value: string, protocols: readonly string[]): boolean {
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

const EMPTY_DESCRIPTION = /^\s*(<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)*$/i;

/** The editor's empty document (`<p></p>`) is no description. */
export const isEmptyDescription = (html: string): boolean => EMPTY_DESCRIPTION.test(html);

export type ProjectFormResult =
  { ok: true; body: CreateProjectBody } | { ok: false; errors: FieldErrors };

export function parseProjectForm(input: unknown): ProjectFormResult {
  if (!isRecord(input)) return { ok: false, errors: { _: "invalid" } };
  const errors: FieldErrors = {};
  for (const key of Object.keys(input)) if (!KEYS.has(key)) errors[key] = "invalid";

  const str = (key: keyof ProjectFormValues): string => {
    const v = input[key];
    if (v === undefined) return "";
    if (typeof v !== "string") {
      errors[key] = "invalid";
      return "";
    }
    return v.trim();
  };
  const within = (key: string, value: string, limit: Limit): boolean => {
    if (fits(value, limit)) return true;
    errors[key] = "too_long";
    return false;
  };
  const nullable = (key: keyof ProjectFormValues, limit: Limit): string | null => {
    const v = str(key);
    if (v === "") return null;
    return within(key, v, limit) ? v : null;
  };
  const url = (
    key: keyof ProjectFormValues,
    limit: Limit,
    protocols: readonly string[],
  ): string | null => {
    const v = str(key);
    if (v === "") return null;
    if (!within(key, v, limit)) return null;
    if (!urlOk(v, protocols)) {
      errors[key] = "invalid_url";
      return null;
    }
    return v;
  };
  const enumOf = <T extends string>(key: keyof ProjectFormValues, allowed: readonly T[]): T => {
    const v = input[key];
    if (typeof v === "string" && (allowed as readonly string[]).includes(v)) return v as T;
    errors[key] = "invalid";
    return allowed[0] as T;
  };
  const bool = (key: keyof ProjectFormValues): boolean => {
    const v = input[key];
    if (typeof v === "boolean") return v;
    errors[key] = "invalid";
    return false;
  };
  const list = (key: "technologies" | "tags", max: number): string[] => {
    const v = input[key];
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
      errors[key] = "invalid";
      return [];
    }
    const terms = normalizeTerms(v as string[]);
    // Two different limits, two different messages: how many, and how long each is.
    if (terms.some((t) => !fits(t, PROJECT_LIMITS.term))) errors[key] = "too_long";
    else if (terms.length > max) errors[key] = "too_many";
    return terms;
  };

  const title = str("title");
  if (title === "") errors.title = "required";
  else within("title", title, PROJECT_LIMITS.title);

  const rawDescription = typeof input.descriptionHtml === "string" ? input.descriptionHtml : "";
  if (input.descriptionHtml !== undefined && typeof input.descriptionHtml !== "string") {
    errors.descriptionHtml = "invalid";
  }
  const descriptionHtml = isEmptyDescription(rawDescription) ? null : rawDescription;
  if (
    descriptionHtml !== null &&
    measure(descriptionHtml, PROJECT_LIMITS.description) > PROJECT_LIMITS.description.max
  ) {
    errors.descriptionHtml = "too_long";
  }

  const startDate = str("startDate");
  const endDate = str("endDate");
  if (startDate !== "" && !isIsoDate(startDate)) errors.startDate = "invalid";
  if (endDate !== "" && !isIsoDate(endDate)) errors.endDate = "invalid";
  if (
    !errors.startDate &&
    !errors.endDate &&
    startDate !== "" &&
    endDate !== "" &&
    endDate < startDate
  ) {
    errors.endDate = "invalid_range";
  }

  const links: LinkRow[] = [];
  const rawLinks = input.links;
  if (rawLinks !== undefined) {
    if (!Array.isArray(rawLinks)) errors.links = "invalid";
    else {
      rawLinks.forEach((row: unknown, i) => {
        if (!isRecord(row) || typeof row.label !== "string" || typeof row.url !== "string") {
          errors[`links.${i}`] = "invalid";
          return;
        }
        const label = row.label.trim();
        const link = row.url.trim();
        // A fully blank row is an unused row, not an error.
        if (label === "" && link === "") return;
        if (label === "" || link === "") errors[`links.${i}`] = "required";
        else if (!fits(label, PROJECT_LIMITS.linkLabel) || !fits(link, PROJECT_LIMITS.linkUrl)) {
          errors[`links.${i}`] = "too_long";
        } else if (!urlOk(link, ["http:", "https:"])) errors[`links.${i}`] = "invalid_url";
        else links.push({ label, url: link });
      });
      if (rawLinks.length > PROJECT_LIMITS.links) errors.links = "too_many";
    }
  }

  const body: CreateProjectBody = {
    title,
    summary: nullable("summary", PROJECT_LIMITS.summary),
    descriptionHtml,
    category: enumOf("category", CATEGORIES),
    status: enumOf("status", STATUSES),
    isPublic: bool("isPublic"),
    isDraft: bool("isDraft"),
    liveDemoUrl: url("liveDemoUrl", PROJECT_LIMITS.liveDemoUrl, ["http:", "https:"]),
    repoUrl: url("repoUrl", PROJECT_LIMITS.repoUrl, ["http:", "https:"]),
    heroImageUrl: url("heroImageUrl", PROJECT_LIMITS.heroImageUrl, ["https:"]),
    technologies: list("technologies", PROJECT_LIMITS.technologies),
    tags: list("tags", PROJECT_LIMITS.tags),
    links,
    metadata: {
      startDate: startDate === "" ? null : startDate,
      endDate: endDate === "" ? null : endDate,
      course: nullable("course", PROJECT_LIMITS.course),
      professor: nullable("professor", PROJECT_LIMITS.professor),
    },
  };
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, body };
}

type Detail = components["schemas"]["ProjectDetail"];

/** A stored project as the form holds it. `files` and the read-only fields are not part of it. */
export function toFormValues(p: Detail): ProjectFormValues {
  return {
    title: p.title,
    summary: p.summary ?? "",
    descriptionHtml: p.descriptionHtml ?? "",
    category: p.category,
    status: p.status,
    startDate: p.metadata.startDate ?? "",
    endDate: p.metadata.endDate ?? "",
    course: p.metadata.course ?? "",
    professor: p.metadata.professor ?? "",
    liveDemoUrl: p.liveDemoUrl ?? "",
    repoUrl: p.repo.url ?? "",
    heroImageUrl: p.heroImageUrl ?? "",
    technologies: p.technologies,
    tags: p.tags,
    links: p.links.map((l) => ({ ...l })),
    isPublic: p.isPublic,
    isDraft: p.isDraft,
  };
}

/**
 * Which form fields the API refused, from its `details` (`{ path, message }[]`).
 * The path is the API's (`metadata.endDate`, `links.2.url`); the form's keys are
 * flat, so `metadata.` goes and a list is named by its row (`links.2`).
 */
export function fieldsFromDetails(details: unknown): FieldErrors | undefined {
  if (!Array.isArray(details)) return undefined;
  const fields: FieldErrors = {};
  for (const item of details) {
    const path = (item as { path?: unknown } | null)?.path;
    if (typeof path !== "string" || path === "") continue;
    const parts = path.replace(/^metadata\./, "").split(".");
    const head = parts[0] ?? "";
    const key =
      head === "links" && parts[1] !== undefined
        ? `links.${parts[1]}`
        : head === "technologies" || head === "tags"
          ? head
          : head;
    fields[key] = "invalid";
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}
