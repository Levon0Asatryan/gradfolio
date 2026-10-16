import type { GithubRepo } from "@/lib/api/types";

/** What the review step lets the user change for one repository. */
export interface Draft {
  title: string;
  summary: string;
  /** Comma-separated in the field, split on save. */
  technologies: string;
  repoUrl: string;
}

/** The repository's name without its owner. */
export const repoName = (repo: GithubRepo): string =>
  repo.fullName.split("/").pop() ?? repo.fullName;

/** The repository's page, from its full name (never from user input). */
const repoUrl = (repo: GithubRepo): string => `https://github.com/${repo.fullName}`;

/** What the draft starts as: the repository's own facts. The API fills the rest (README). */
export function initialDraft(repo: GithubRepo): Draft {
  return {
    title: repoName(repo),
    summary: repo.description ?? "",
    technologies: repo.language ?? "",
    repoUrl: repoUrl(repo),
  };
}

export const splitTechnologies = (value: string): string[] =>
  value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * The edits to send: only fields that differ from the starting draft, so an import the user
 * did not touch is the plain one, and the API's own defaults (and its re-sync snapshot) stay
 * what GitHub gave. A field the user changed counts as theirs and survives re-sync.
 */
export function editsFor(repos: GithubRepo[], drafts: Record<number, Draft>) {
  const edits: Record<
    string,
    { title?: string; summary?: string; technologies?: string[]; repoUrl?: string }
  > = {};
  for (const repo of repos) {
    const now = drafts[repo.repoId];
    if (!now) continue;
    const start = initialDraft(repo);
    const edit: (typeof edits)[string] = {};
    if (now.title.trim() !== start.title) edit.title = now.title.trim();
    if (now.summary.trim() !== start.summary.trim()) edit.summary = now.summary.trim();
    if (now.technologies.trim() !== start.technologies.trim()) {
      edit.technologies = splitTechnologies(now.technologies);
    }
    if (now.repoUrl.trim() !== start.repoUrl) edit.repoUrl = now.repoUrl.trim();
    if (Object.keys(edit).length > 0) edits[String(repo.repoId)] = edit;
  }
  return edits;
}
