import type { SuggestionAcceptOverrides } from "@/lib/api/types";
import { LIMITS, fits } from "@/lib/profile/limits";
import { YEAR_MAX, YEAR_MIN } from "@/lib/profile/sections";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const text = (v: unknown, limit: typeof LIMITS.title): v is string =>
  typeof v === "string" && v.trim() !== "" && fits(v, limit);

/**
 * What the student typed for an education or experience entry: only the keys the form has,
 * each checked here; the API checks again and names `overrides.<field>` when one is missing.
 */
export function parseOverrides(input: unknown): SuggestionAcceptOverrides | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const o = input as Record<string, unknown>;
  const out: SuggestionAcceptOverrides = {};
  for (const key of Object.keys(o)) {
    const v = o[key];
    if (key === "degree" || key === "field" || key === "title") {
      if (!text(v, LIMITS[key])) return null;
      out[key] = v.trim();
    } else if (key === "startYear") {
      if (typeof v !== "number" || !Number.isInteger(v) || v < YEAR_MIN || v > YEAR_MAX) {
        return null;
      }
      out.startYear = v;
    } else if (key === "start") {
      if (typeof v !== "string" || !MONTH.test(v)) return null;
      out.start = v;
    } else return null;
  }
  return Object.keys(out).length > 0 ? out : null;
}
