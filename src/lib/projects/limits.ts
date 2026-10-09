import type { Limit } from "@/lib/profile/limits";

/**
 * How much each project field holds, from gradfolio-api (`src/core/validation/columns.ts`,
 * `json-shapes.ts` and the project config defaults, at the commit in
 * `src/lib/api/openapi.source`). openapi.yaml carries the list sizes (`maxItems`) but not
 * the text limits, so they are kept here, in one place; the API stays the authority and
 * answers VALIDATION_FAILED past them. VARCHAR counts characters, TEXT counts UTF-8 bytes.
 */
const chars = (max: number): Limit => ({ kind: "chars", max });
const TEXT: Limit = { kind: "bytes", max: 65_535 };

export const PROJECT_LIMITS = {
  title: chars(500),
  summary: TEXT,
  course: chars(500),
  professor: chars(500),
  liveDemoUrl: TEXT,
  repoUrl: TEXT,
  heroImageUrl: TEXT,
  term: chars(255),
  linkLabel: chars(200),
  linkUrl: chars(2048),
  /** `PROJECT_DESCRIPTION_MAX_BYTES`, measured by the API after sanitizing. */
  description: { kind: "bytes", max: 100_000 } as Limit,
  technologies: 30,
  tags: 20,
  links: 10,
} as const;
