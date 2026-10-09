import { cache } from "react";
import Box from "@mui/material/Box";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import BackButton from "@/components/project/BackButton";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectDescription from "@/components/project/ProjectDescription";
import AttachmentsGallery from "@/components/project/AttachmentsGallery";
import ProjectMetadataCard from "@/components/project/ProjectMetadataCard";
import TeamList from "@/components/project/TeamList";
import TechTagsClient from "@/components/project/TechTagsClient";
import { OwnerStateChips } from "@/components/project/OwnerStateChips";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { ApiError, getProject } from "@/lib/api/client";
import { requestDictionary } from "@/lib/requestDictionary";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

/** One API call per request, shared by the metadata and the page (React's per-request cache). */
const loadProject = cache(async (id: string) => {
  try {
    return { project: await getProject(id) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { error };
  }
});

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params;
  const { project } = await loadProject(id);
  return {
    title: project ? `${project.title} – Project` : "Project",
    description: project ? (project.summary ?? undefined) : undefined,
  };
}

/**
 * A project (`GET /v1/projects/{id}`). A private or draft project of someone else
 * is the API's 404, the same as an unknown id (Q3). Any other failure is an error
 * screen, never a blank page.
 */
export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const { project, error } = await loadProject(id);
  if (error) {
    if (error.code === "NOT_FOUND") notFound();
    return <ProjectsError what="project" code={error.code} returnTo={`/projects/${id}`} />;
  }
  if (!project) return notFound();
  const t = await requestDictionary();

  return (
    <PageContainer maxWidth={1100}>
      <BackButton />
      {project.isOwner && (project.isDraft || !project.isPublic) && (
        <OwnerStateChips isDraft={project.isDraft} />
      )}

      <ProjectHeader
        title={project.title}
        summary={project.summary ?? project.aiSummary}
        category={project.category}
        heroImageUrl={project.heroImageUrl}
        repo={project.repo}
        liveDemoUrl={project.liveDemoUrl}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 2fr) minmax(0, 1fr)" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <ProjectDescription html={project.descriptionHtml} title={t.common.description} />
          <AttachmentsGallery items={project.attachments} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <ProjectMetadataCard metadata={project.metadata} category={project.category} />
          <TechTagsClient items={project.technologies} />
          <TeamList members={project.team} />
        </Box>
      </Box>
    </PageContainer>
  );
}
