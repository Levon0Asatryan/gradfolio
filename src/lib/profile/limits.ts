/**
 * How much text each field holds, copied from gradfolio-api's column map
 * (`src/core/validation/columns.ts` at the commit in `src/lib/api/openapi.source`):
 * the contract (openapi.yaml) does not carry these, so they are kept here, in one
 * place, and the API stays the authority (it answers VALIDATION_FAILED past them).
 *
 * MySQL counts `VARCHAR(n)` in characters (code points) and `TEXT` in UTF-8
 * bytes, so a limit says which. That is also why no `maxLength` attribute is set
 * on the inputs: it counts UTF-16 units, so it would refuse text the API takes.
 * The counter and `parseEntry`/`parseHeaderPatch` use `measure` instead.
 */
export interface Limit {
  kind: "chars" | "bytes";
  max: number;
}

const chars = (max: number): Limit => ({ kind: "chars", max });
const TEXT: Limit = { kind: "bytes", max: 65_535 };

export const LIMITS = {
  name: chars(255),
  headline: chars(500),
  location: chars(255),
  bio: TEXT,
  avatarUrl: TEXT,
  contactEmail: chars(255),
  link: chars(500),
  institution: chars(500),
  degree: chars(500),
  field: chars(500),
  description: TEXT,
  title: chars(500),
  organization: chars(500),
  summary: TEXT,
  certName: chars(500),
  issuer: chars(500),
  credentialUrl: TEXT,
  /** One highlight or achievement. */
  listItem: chars(1000),
  /** One skill (also an experience skill). */
  term: chars(255),
} as const satisfies Record<string, Limit>;

const encoder = new TextEncoder();

export function measure(value: string, limit: Limit): number {
  return limit.kind === "chars" ? [...value].length : encoder.encode(value).length;
}

export const fits = (value: string, limit: Limit): boolean => measure(value, limit) <= limit.max;
