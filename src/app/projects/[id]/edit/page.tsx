import { cache } from "react";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/project-form/ProjectForm";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { ApiError, getProject } from "@/lib/api/client";
import { toFormValues } from "@/lib/projects/form";
import { requestDictionary } from "@/lib/requestDictionary";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** One API call per request, shared by the metadata and the page. */
const loadProject = cache(async (id: string) => {
  try {
    return { project: await getProject(id) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { error };
  }
});

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const t = await requestDictionary();
  const { project } = await loadProject(id);
  // Only for the owner: the title of someone else's project is not for the tab.
  return {
    title: project?.isOwner
      ? `${t.projects.form.editTitle}: ${project.title}`
      : t.projects.form.editTitle,
  };
}

/**
 * Edit a project. The proxy sends a visitor to login; the API decides ownership:
 * a project of someone else, a private one, a draft and an unknown id all answer
 * 404 here, and `isOwner` is checked as well. That check is presentation only: the
 * save and delete actions send no owner flag and the API answers 404 to a non-owner.
 */
export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const { project, error } = await loadProject(id);
  if (error) {
    if (error.code === "NOT_FOUND") notFound();
    return <ProjectsError what="project" code={error.code} returnTo={`/projects/${id}/edit`} />;
  }
  if (!project) notFound();
  if (!project.isOwner) notFound();
  return <ProjectForm mode="edit" projectId={project.id} initial={toFormValues(project)} />;
}
