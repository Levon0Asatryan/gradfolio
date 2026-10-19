import { ApiError, listMyProjects } from "@/lib/api/client";

/** 50 is the API's default page; 10 pages is far beyond the per-user project cap. */
const PAGE = 50;
const MAX_PAGES = 10;

/**
 * Whether to offer the GitHub import on the integrations pages: `true` only when the API says
 * GitHub is connected and the student has **no** project with `source: "github"` (drafts count).
 * If the list cannot be read to the end, the answer is `false`: a reminder built on a guess
 * about what the student has imported would be wrong.
 */
export async function offerGithubImport(connected: boolean): Promise<boolean> {
  if (!connected) return false;
  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await listMyProjects({ limit: PAGE, ...(cursor ? { cursor } : {}) });
      if (result.items.some((project) => project.source === "github")) return false;
      if (!result.nextCursor) return true;
      cursor = result.nextCursor;
    }
    return false;
  } catch (error) {
    if (error instanceof ApiError) return false;
    throw error;
  }
}
