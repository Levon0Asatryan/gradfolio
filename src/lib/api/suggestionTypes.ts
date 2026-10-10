/**
 * PROVISIONAL. The shape of `GET /v1/search/suggestions?q=` as proposed to the API agent for
 * its next PR (prefix match on names, titles and registry terms; a small fixed limit per
 * group; public content only; no signed image URLs). When the contract is pinned this file
 * is deleted and `types.ts` names `components["schemas"][...]` instead (Q5).
 */
export interface SuggestedPerson {
  id: string;
  name: string;
  headline: string;
}

export interface SuggestedProject {
  id: string;
  title: string;
  category: "academic" | "personal" | "research" | "hackathon" | "course" | "other";
}

export interface SuggestedTag {
  name: string;
  projects: number;
  people: number;
}

export interface Suggestions {
  /** The query as the API normalized it. */
  query: string;
  people: SuggestedPerson[];
  projects: SuggestedProject[];
  tags: SuggestedTag[];
}
