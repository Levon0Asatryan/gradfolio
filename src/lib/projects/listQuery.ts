import type { ProjectListQuery } from "@/lib/api/types";

/** The values the API accepts (openapi `listMyProjects`); anything else is dropped, not forwarded. */
export const PROJECT_SORTS = ["newest", "oldest", "updated", "name_asc", "name_desc"] as const;
export const PROJECT_CATEGORY_VALUES = [
  "academic",
  "personal",
  "research",
  "hackathon",
  "course",
  "other",
] as const;

/** The API's `q` limit is not published; the list page keeps it short (API plan §5.2: ≤ 100). */
export const MAX_QUERY_LENGTH = 100;
const MAX_CURSOR_LENGTH = 600;
/** Cards per page. The API's maximum is larger; this is what fits a screen of cards. */
export const PROJECTS_PAGE_SIZE = 12;

type Raw = Record<string, unknown>;

const one = (value: unknown): string | undefined =>
  typeof value === "string"
    ? value
    : Array.isArray(value) && typeof value[0] === "string"
      ? value[0]
      : undefined;

/**
 * A list query from untrusted input (the page's search params, or a server
 * action's argument). Public endpoints trust nothing: every key is checked and
 * unknown values are dropped, so a crafted URL cannot make the API answer 400.
 */
export function parseListQuery(raw: Raw): ProjectListQuery {
  const query: ProjectListQuery = {};
  const sort = one(raw.sort);
  if (sort && (PROJECT_SORTS as readonly string[]).includes(sort)) {
    query.sort = sort as (typeof PROJECT_SORTS)[number];
  }
  const category = one(raw.category);
  if (category && (PROJECT_CATEGORY_VALUES as readonly string[]).includes(category)) {
    query.category = category as (typeof PROJECT_CATEGORY_VALUES)[number];
  }
  const q = one(raw.q)?.trim();
  if (q) query.q = q.slice(0, MAX_QUERY_LENGTH);
  const cursor = one(raw.cursor);
  if (cursor && cursor.length <= MAX_CURSOR_LENGTH) query.cursor = cursor;
  return query;
}
