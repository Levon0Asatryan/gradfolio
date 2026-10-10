import type { TeamsQuery } from "@/lib/api/client";

const SECTIONS = ["owned", "member", "incoming", "outgoing"] as const;
export type TeamsSection = (typeof SECTIONS)[number];
export const TEAMS_PAGE_SIZE = 10;
const MAX_CURSOR = 600;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/**
 * The cursor in the URL: at most one, for the list being extended (the API restarts the others;
 * a hand-edited URL with several keeps the first). Anything that is not a plausible cursor (empty, longer
 * than the API's 600, not text) is ignored, so the list starts from its first page instead of
 * the API answering 400 to a hand-edited URL.
 */
export function parseTeamsQuery(
  raw: Record<string, string | string[] | undefined>,
): Partial<Record<TeamsSection, string>> {
  const out: Partial<Record<TeamsSection, string>> = {};
  for (const section of SECTIONS) {
    const value = first(raw[`${section}Cursor`]);
    if (typeof value === "string" && value.length >= 1 && value.length <= MAX_CURSOR) {
      out[section] = value;
      break; // the contract: only the list being extended takes a cursor, the others restart
    }
  }
  return out;
}

export function toApiQuery(cursors: Partial<Record<TeamsSection, string>>): TeamsQuery {
  return {
    limit: TEAMS_PAGE_SIZE,
    ownedCursor: cursors.owned,
    memberCursor: cursors.member,
    incomingCursor: cursors.incoming,
    outgoingCursor: cursors.outgoing,
  };
}

/** `/teams` with these cursors, the other lists keeping the page they are on. */
export function teamsHref(cursors: Partial<Record<TeamsSection, string | null>>): string {
  const params = new URLSearchParams();
  for (const section of SECTIONS) {
    const value = cursors[section];
    if (value) params.set(`${section}Cursor`, value);
  }
  const qs = params.toString();
  return qs ? `/teams?${qs}` : "/teams";
}
