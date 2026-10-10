/**
 * Search and tag input from untrusted places (the page's search params, a route segment).
 * The API answers 400 for what it will not take, so the page cleans first: a crafted URL
 * then shows a normal page instead of an error. Limits follow the API plan §3.1.
 */

/** Characters, not bytes (API plan §3.1). */
export const MAX_QUERY_LENGTH = 100;
export const MAX_QUERY_TOKENS = 6;
export const MAX_TOKEN_LENGTH = 50;
export const MAX_CURSOR_LENGTH = 600;
const MAX_TAG_LENGTH = 255;
/** Cards per page in a full list; the grouped view uses the API's own group size. */
export const SEARCH_PAGE_SIZE = 12;

export const SEARCH_TYPES = ["people", "projects"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export interface SearchQuery {
  q: string;
  type?: SearchType;
  cursor?: string;
}

type Raw = Record<string, unknown>;

const one = (value: unknown): string | undefined =>
  typeof value === "string"
    ? value
    : Array.isArray(value) && typeof value[0] === "string"
      ? value[0]
      : undefined;

/** Control, zero-width and line-separator characters. */
function isInvisible(code: number): boolean {
  return (
    code <= 0x1f ||
    (code >= 0x7f && code <= 0x9f) ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x2028 && code <= 0x202e) ||
    code === 0x2060 ||
    code === 0xfeff
  );
}

export function normalizeText(value: string): string {
  const spaced = Array.from(value.normalize("NFKC"), (ch) =>
    isInvisible(ch.codePointAt(0) ?? 0) ? " " : ch,
  ).join("");
  return spaced.replace(/\s+/g, " ").trim();
}

/**
 * The query the page searches for. Longer than the API takes is cut here (a pasted
 * paragraph still searches for its start); more words than allowed keeps the first ones.
 */
export function cleanQuery(value: string | undefined): string {
  if (!value) return "";
  const tokens = normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, MAX_QUERY_TOKENS)
    .map((token) => Array.from(token).slice(0, MAX_TOKEN_LENGTH).join(""));
  return Array.from(tokens.join(" ")).slice(0, MAX_QUERY_LENGTH).join("").trim();
}

export function parseSearchQuery(raw: Raw): SearchQuery {
  const query: SearchQuery = { q: cleanQuery(one(raw.q)) };
  const type = one(raw.type);
  if (type && (SEARCH_TYPES as readonly string[]).includes(type)) query.type = type as SearchType;
  const cursor = one(raw.cursor);
  if (query.type && cursor && cursor.length > 0 && cursor.length <= MAX_CURSOR_LENGTH) {
    query.cursor = cursor;
  }
  return query;
}

/**
 * A tag name from a route segment. Next hands the page the segment **still encoded** and
 * `generateMetadata` the **decoded** one (verified on the production build: `/tags/C%2523`
 * is `"C%2523"` in the page and `"C%23"` in the metadata). Decoding the first and not the
 * second is what keeps a tag whose name contains `%23` one tag; a second decode would turn
 * it into `C#`.
 */
export function tagNameFromPageParam(segment: string): string | null {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // A stray "%" that is not an escape stays as typed.
  }
  return tagNameFromDecoded(decoded);
}

/** The metadata's `params` are already decoded: never decode them again. */
export function tagNameFromDecoded(value: string): string | null {
  const name = normalizeText(value);
  if (!name || Array.from(name).length > MAX_TAG_LENGTH) return null;
  return name;
}

/** The link to a tag's page. */
export const tagHref = (name: string): string => `/tags/${encodeURIComponent(name)}`;

/** `/search?...` for a query, dropping what is empty. */
export function searchHref(query: SearchQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.type) params.set("type", query.type);
  if (query.cursor) params.set("cursor", query.cursor);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
