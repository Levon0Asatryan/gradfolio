import { MAX_CURSOR_LENGTH, normalizeText } from "./query";

/** The values the API accepts (openapi `listProjects`); anything else is dropped, not forwarded. */
export const BROWSE_SORTS = ["newest", "updated"] as const;
export const BROWSE_CATEGORIES = [
  "academic",
  "personal",
  "research",
  "hackathon",
  "course",
  "other",
] as const;
export const BROWSE_STATUSES = ["ongoing", "completed", "archived"] as const;
/** Cards per page. */
export const BROWSE_PAGE_SIZE = 12;
const MAX_FILTER_LENGTH = 200;
const MIN_YEAR = 1950;
const MAX_YEAR = 2100;

export interface ProjectBrowseQuery {
  sort?: (typeof BROWSE_SORTS)[number];
  category?: (typeof BROWSE_CATEGORIES)[number];
  status?: (typeof BROWSE_STATUSES)[number];
  limit?: number;
  cursor?: string;
}

export interface PeopleBrowseQuery {
  school?: string;
  major?: string;
  gradYear?: number;
  limit?: number;
  cursor?: string;
}

type Raw = Record<string, unknown>;

const one = (value: unknown): string | undefined =>
  typeof value === "string"
    ? value
    : Array.isArray(value) && typeof value[0] === "string"
      ? value[0]
      : undefined;

const member = <T extends string>(list: readonly T[], value: string | undefined): T | undefined =>
  value !== undefined && (list as readonly string[]).includes(value) ? (value as T) : undefined;

const cursorOf = (raw: Raw): string | undefined => {
  const cursor = one(raw.cursor);
  return cursor && cursor.length <= MAX_CURSOR_LENGTH ? cursor : undefined;
};

/** A browse query from untrusted search params: every key is checked, unknown values dropped. */
export function parseProjectBrowse(raw: Raw): ProjectBrowseQuery {
  const query: ProjectBrowseQuery = {};
  const sort = member(BROWSE_SORTS, one(raw.sort));
  if (sort && sort !== "newest") query.sort = sort;
  const category = member(BROWSE_CATEGORIES, one(raw.category));
  if (category) query.category = category;
  const status = member(BROWSE_STATUSES, one(raw.status));
  if (status) query.status = status;
  const cursor = cursorOf(raw);
  if (cursor) query.cursor = cursor;
  return query;
}

export function parsePeopleBrowse(raw: Raw): PeopleBrowseQuery {
  const query: PeopleBrowseQuery = {};
  const text = (value: unknown): string | undefined => {
    const v = one(value);
    if (v === undefined) return undefined;
    const clean = normalizeText(v);
    return clean && Array.from(clean).length <= MAX_FILTER_LENGTH ? clean : undefined;
  };
  const school = text(raw.school);
  if (school) query.school = school;
  const major = text(raw.major);
  if (major) query.major = major;
  const year = one(raw.gradYear);
  if (year && /^\d{4}$/.test(year)) {
    const n = Number(year);
    if (n >= MIN_YEAR && n <= MAX_YEAR) query.gradYear = n;
  }
  const cursor = cursorOf(raw);
  if (cursor) query.cursor = cursor;
  return query;
}

/** `/browse/<kind>?...` from a query, dropping what is unset. */
export function browseHref(
  kind: "projects" | "people",
  query: ProjectBrowseQuery | PeopleBrowseQuery,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || key === "limit") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/browse/${kind}?${qs}` : `/browse/${kind}`;
}
