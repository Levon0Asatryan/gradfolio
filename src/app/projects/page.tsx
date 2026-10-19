import { ProjectsError } from "@/components/projects/ProjectsError";
import { ApiError, getIntegrations, listMyProjects } from "@/lib/api/client";
import { parseListQuery, PROJECTS_PAGE_SIZE } from "@/lib/projects/listQuery";
import type { GithubStatus } from "@/components/projects/AddProjectButton";
import ProjectsContent from "./ProjectsContent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Whether Add should offer the GitHub import. Only the API's word counts. If it cannot be read
 * the status is "unknown", never "not connected": the list still shows and Add says so.
 */
async function githubStatus(): Promise<GithubStatus> {
  try {
    return (await getIntegrations()).github.status === "connected" ? "connected" : "not_connected";
  } catch (error) {
    if (error instanceof ApiError) return "unknown";
    throw error;
  }
}

/**
 * The caller's own projects, every state (`GET /v1/me/projects`). The filters live
 * in the URL, so a filtered list can be reloaded and shared. A failed load is an
 * error, never "no projects yet".
 */
export default async function ProjectsPage({ searchParams }: PageProps) {
  const query = parseListQuery(await searchParams);
  let page;
  let github: GithubStatus;
  try {
    [page, github] = await Promise.all([
      listMyProjects({ ...query, limit: PROJECTS_PAGE_SIZE }),
      githubStatus(),
    ]);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <ProjectsError code={error.code} returnTo="/projects" />;
  }
  return (
    <ProjectsContent
      items={page.items}
      nextCursor={page.nextCursor}
      query={{ q: query.q, category: query.category, sort: query.sort }}
      github={github}
    />
  );
}
