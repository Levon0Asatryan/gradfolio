import type { GithubDraft, GithubRepo } from "@/lib/api/types";
import type { GithubOverride } from "@/lib/api/client";

/** What the review step lets the student change for one repository (links and README stay). */
export interface Draft {
  title: string;
  summary: string;
  /** Comma-separated in the field, split on save. */
  technologies: string;
}

/** The repository's name without its owner. */
export const repoName = (repo: GithubRepo): string =>
  repo.fullName.split("/").pop() ?? repo.fullName;

/** The draft as the API's preview has it: what an untouched Save would create. */
export function initialDraft(draft: GithubDraft): Draft {
  return {
    title: draft.title,
    summary: draft.summary ?? "",
    technologies: draft.technologies.join(", "),
  };
}

export const splitTechnologies = (value: string): string[] =>
  value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * The overrides to send: only fields that differ from the preview, so an import the student did
 * not touch is the plain one, and the API's own defaults (and its re-sync snapshot) stay what
 * GitHub gave. A field the student changed counts as theirs and survives a re-sync.
 */
export function overridesFor(
  previews: Record<number, GithubDraft>,
  drafts: Record<number, Draft>,
): Record<string, GithubOverride> {
  const out: Record<string, GithubOverride> = {};
  for (const [key, now] of Object.entries(drafts)) {
    const preview = previews[Number(key)];
    if (!preview) continue;
    const start = initialDraft(preview);
    const override: GithubOverride = {};
    if (now.title.trim() !== start.title) override.title = now.title.trim();
    if (now.summary.trim() !== start.summary.trim()) {
      override.summary = now.summary.trim() === "" ? null : now.summary.trim();
    }
    if (now.technologies.trim() !== start.technologies.trim()) {
      override.technologies = splitTechnologies(now.technologies);
    }
    if (Object.keys(override).length > 0) out[key] = override;
  }
  return out;
}

/**
 * The README as plain text for a read-only preview. Parsed in an inert document and read with
 * `textContent`: nothing from the HTML is ever inserted into the page as markup.
 */
export function plainText(html: string | null, max = 700): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
