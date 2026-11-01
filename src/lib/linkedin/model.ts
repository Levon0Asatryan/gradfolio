import type { LinkedinPreview } from "@/lib/api/types";
import { FIELDS, parseEntry } from "@/lib/profile/sections";
import type { FieldErrors } from "@/lib/profile/headerPatch";

/** The three entry sections; skills are a plain list and have their own row kind. */
export const ENTRY_SECTIONS = ["experience", "education", "certifications"] as const;
export type EntrySection = (typeof ENTRY_SECTIONS)[number];

export type RowStatus = "new" | "duplicate" | "invalid";

export interface EntryRow {
  id: string;
  section: EntrySection;
  status: RowStatus;
  /** The fields as text, the way the manual form holds them; what the member edits. */
  values: Record<string, string>;
}

export interface SkillRow {
  id: string;
  name: string;
  status: RowStatus;
}

export interface ReviewModel {
  entries: EntryRow[];
  skills: SkillRow[];
}

const toText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("\n");
  return String(value);
};

/** The preview as rows. Ids are positions: stable for one preview, never sent anywhere. */
export function rowsFromPreview(preview: LinkedinPreview): ReviewModel {
  const entries = ENTRY_SECTIONS.flatMap((section) =>
    preview[section].map((item, i) => ({
      id: `${section}-${i}`,
      section,
      status: item.status,
      values: Object.fromEntries(
        FIELDS[section].map((spec) => [spec.key, toText(item.fields[spec.key])]),
      ),
    })),
  );
  const skills = preview.skills.map((s, i) => ({
    id: `skills-${i}`,
    name: s.name,
    status: s.status,
  }));
  return { entries, skills };
}

/** What `parseEntry` takes from the text values: lists split on lines, the rest as typed. */
function entryInput(section: EntrySection, values: Record<string, string>) {
  return Object.fromEntries(
    FIELDS[section].map((spec) => {
      const text = values[spec.key] ?? "";
      return [spec.key, spec.kind === "lines" || spec.kind === "chips" ? text.split("\n") : text];
    }),
  );
}

/** The errors of a row as it stands, or null when it can be saved. */
export function rowErrors(row: EntryRow): FieldErrors | null {
  const checked = parseEntry(row.section, entryInput(row.section, row.values), "create");
  return checked.ok ? null : checked.errors;
}

/** New rows that can be saved start ticked; duplicates and broken rows never do. */
export function defaultSelection(model: ReviewModel): Set<string> {
  return new Set([
    ...model.entries.filter((r) => r.status === "new" && rowErrors(r) === null).map((r) => r.id),
    ...model.skills.filter((s) => s.status === "new").map((s) => s.id),
  ]);
}

/** A duplicate is already on the profile: it cannot be ticked. A broken row can once fixed. */
export const canSelect = (row: EntryRow | SkillRow): boolean =>
  row.status !== "duplicate" && ("name" in row || rowErrors(row) === null);

export interface ConfirmPayload {
  experience: Record<string, unknown>[];
  education: Record<string, unknown>[];
  certifications: Record<string, unknown>[];
  skills: string[];
}

/** The body for confirm: exactly the ticked rows that can be saved. Null when none is. */
export function buildConfirm(
  model: ReviewModel,
  selected: ReadonlySet<string>,
): ConfirmPayload | null {
  const payload: ConfirmPayload = { experience: [], education: [], certifications: [], skills: [] };
  for (const row of model.entries) {
    if (!selected.has(row.id) || !canSelect(row)) continue;
    const checked = parseEntry(row.section, entryInput(row.section, row.values), "create");
    if (checked.ok) payload[row.section].push(checked.body);
  }
  for (const skill of model.skills) {
    if (selected.has(skill.id) && canSelect(skill)) payload.skills.push(skill.name);
  }
  const total =
    payload.experience.length +
    payload.education.length +
    payload.certifications.length +
    payload.skills.length;
  return total === 0 ? null : payload;
}
