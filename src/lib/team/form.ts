import { type Limit, fits } from "@/lib/profile/limits";

/** `project_team_members.name` and `.role`, VARCHAR(255) (gradfolio-api columns.ts). */
const TEXT: Limit = { kind: "chars", max: 255 };

export type TeamField = "name" | "role";
export type TeamFieldError = "required" | "tooLong";

/** The role is optional: blank is "no role" (`null`), never an empty string. */
export function parseRole(raw: unknown): { role: string | null } | { error: TeamFieldError } {
  const role = typeof raw === "string" ? raw.trim() : "";
  if (role === "") return { role: null };
  return fits(role, TEXT) ? { role } : { error: "tooLong" };
}

/** A teammate without an account: a name is required. */
export function parseExternal(
  rawName: unknown,
  rawRole: unknown,
): { name: string; role: string | null } | { field: TeamField; error: TeamFieldError } {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (name === "") return { field: "name", error: "required" };
  if (!fits(name, TEXT)) return { field: "name", error: "tooLong" };
  const role = parseRole(rawRole);
  if ("error" in role) return { field: "role", error: role.error };
  return { name, role: role.role };
}

/** What `GET /api/users/lookup` forwards: 3 to 50 characters after trimming (the API's bounds). */
export function parseLookupQuery(raw: string | null): string | null {
  const q = (raw ?? "").trim();
  const length = [...q].length;
  return length >= 3 && length <= 50 ? q : null;
}
