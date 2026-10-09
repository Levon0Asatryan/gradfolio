import { ProjectsError } from "@/components/projects/ProjectsError";
import { ApiError, listMyProjects } from "@/lib/api/client";
import { parseListQuery, PROJECTS_PAGE_SIZE } from "@/lib/projects/listQuery";
import ProjectsContent from "./ProjectsContent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The caller's own projects, every state (`GET /v1/me/projects`). The filters live
 * in the URL, so a filtered list can be reloaded and shared. A failed load is an
 * error, never "no projects yet".
 */
export default async function ProjectsPage({ searchParams }: PageProps) {
  const query = parseListQuery(await searchParams);
  let page;
  try {
    page = await listMyProjects({ ...query, limit: PROJECTS_PAGE_SIZE });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return <ProjectsError code={error.code} returnTo="/projects" />;
  }
  return (
    <ProjectsContent
      items={page.items}
      nextCursor={page.nextCursor}
      query={{ q: query.q, category: query.category, sort: query.sort }}
    />
  );
}
