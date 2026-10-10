/**
 * PROVISIONAL, like `discoveryTypes.ts` was. The shapes of gradfolio-api PR (b) (tag cloud and
 * user facets), written from its plan (`gradfolio-api/docs/m6-plan.md` §3.2) before its
 * `openapi.yaml` exists. When the contract is pinned this file is deleted and `types.ts` names
 * `components["schemas"][...]`. Browse results reuse `PersonPage` and `DiscoveryProjectPage`,
 * which are already in the contract.
 */
export interface TagCloudItem {
  name: string;
  projects: number;
  people: number;
}

/** Cached up to a minute by the API; `generatedAt` says when. */
export interface TagCloud {
  items: TagCloudItem[];
  generatedAt: string;
}

export interface FacetValue<T> {
  value: T;
  count: number;
}

/** What the people filters can be: only values that exist. Top 50 of each. */
export interface UserFacets {
  schools: FacetValue<string>[];
  majors: FacetValue<string>[];
  years: FacetValue<number>[];
}
