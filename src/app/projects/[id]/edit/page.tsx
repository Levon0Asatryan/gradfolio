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

export async function generateMetadata() {
  const t = await requestDictionary();
  return { title: t.projects.form.editTitle };
}

/**
 * Edit a project. The proxy sends a visitor to login; the API decides ownership:
 * a project of someone else, a private one, a draft and an unknown id all answer
 * 404 here, and `isOwner` is checked as well. That check is presentation only: the
 * save and delete actions send no owner flag and the API answers 404 to a non-owner.
 */
export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  let project;
  try {
    project = await getProject(id);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.code === "NOT_FOUND") notFound();
    return <ProjectsError what="project" code={error.code} returnTo={`/projects/${id}/edit`} />;
  }
  if (!project.isOwner) notFound();
  return <ProjectForm mode="edit" projectId={project.id} initial={toFormValues(project)} />;
}
