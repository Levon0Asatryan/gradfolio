import type { SuggestionItem } from "@/lib/api/types";

/** The groups the inbox shows, in this order. A reminder (`linkedin.reimport`) is in none. */
export const SUGGESTION_GROUPS = ["profile", "skills", "links", "projects", "university"] as const;
export type SuggestionGroup = (typeof SUGGESTION_GROUPS)[number];

type Kind = SuggestionItem["kind"];

/** Which group a kind belongs to; `null` for a kind the inbox does not list. */
export function groupOf(kind: Kind): SuggestionGroup | null {
  switch (kind) {
    case "profile.name":
    case "profile.headline":
    case "profile.bio":
    case "profile.location":
    case "profile.avatarUrl":
      return "profile";
    case "skill.add":
      return "skills";
    case "profile.links.github":
    case "profile.links.website":
    case "profile.links.linkedin":
    case "profile.links.twitter":
      return "links";
    // Only changes to projects already imported. `project.new` (every other GitHub repository)
    // is not listed: importing is the import dialog's job, by the student's own pick.
    case "project.update":
      return "projects";
    case "education.add":
    case "experience.add":
      return "university";
    default:
      return null;
  }
}

/** What the inbox lists: everything with a group. */
export const isInboxItem = (item: SuggestionItem): boolean =>
  item.status === "open" && groupOf(item.kind) !== null;

/** These two need the student's own values before the API accepts them. */
export const needsOverrides = (kind: Kind): kind is "education.add" | "experience.add" =>
  kind === "education.add" || kind === "experience.add";
