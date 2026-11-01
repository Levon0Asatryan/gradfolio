/**
 * What the API takes from a LinkedIn import (gradfolio-api `IMPORT_*` config and the
 * section caps). They only spare a round trip: the API checks every one again.
 */
export const LINKEDIN_ZIP_MAX_BYTES = 100_000_000;

/** The most entries one confirm sends per section (`maxItems` of the contract). */
export const LINKEDIN_CONFIRM_MAX = {
  experience: 500,
  education: 500,
  certifications: 500,
  skills: 1000,
} as const;
