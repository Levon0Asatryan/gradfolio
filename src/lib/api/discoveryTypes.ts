/**
 * PROVISIONAL. The discovery shapes of gradfolio-api PR (a), written from its plan
 * (`gradfolio-api/docs/m6-plan.md` §3.2) before its `openapi.yaml` exists. When the contract
 * is pinned (`sh scripts/sync-api-contract.sh <sha>`) this file is deleted and `types.ts`
 * names `components["schemas"][...]` instead (Q5): nothing else changes, because every
 * consumer imports these names from `@/lib/api/types`.
 */

/** A person in a result list. Never an e-mail, phone, birthday or link. */
export interface PersonSummary {
  id: string;
  name: string;
  headline: string;
  avatarUrl: string | null;
  verified: boolean;
  location: string | null;
  /** Up to 5, registry spelling. */
  skills: string[];
  projectCount: number;
}

/** A published project in a result list (not the owner's `ProjectSummary`). */
export interface DiscoveryProject {
  id: string;
  title: string;
  summary: string | null;
  category: "academic" | "personal" | "research" | "hackathon" | "course" | "other";
  status: "ongoing" | "completed" | "archived";
  heroImageUrl: string | null;
  technologies: string[];
  tags: string[];
  owner: { id: string; name: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

/** `GET /v1/search`: the top of each group. `hasMore` says "See all" leads somewhere. */
export interface SearchResults {
  /** The query as the API normalized it. */
  query: string;
  people: { items: PersonSummary[]; hasMore: boolean };
  projects: { items: DiscoveryProject[]; hasMore: boolean };
}

export interface PersonPage {
  items: PersonSummary[];
  nextCursor: string | null;
}

export interface DiscoveryProjectPage {
  items: DiscoveryProject[];
  nextCursor: string | null;
}

/** `GET /v1/tags?name=`; a tag no public item uses is a 404. */
export interface TagSummary {
  name: string;
  projectCount: number;
  peopleCount: number;
}
