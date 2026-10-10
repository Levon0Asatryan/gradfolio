import { cache } from "react";
import Box from "@mui/material/Box";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import BackButton from "@/components/project/BackButton";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectDescription from "@/components/project/ProjectDescription";
import AttachmentsGallery from "@/components/project/AttachmentsGallery";
import ProjectMetadataCard from "@/components/project/ProjectMetadataCard";
import { TeamSection } from "@/components/team/TeamSection";
import TechTags from "@/components/project/TechTags";
import { OwnerBar } from "@/components/project/OwnerBar";
import { FlashToast } from "@/components/shared/FlashToast";
import { ProjectsError } from "@/components/projects/ProjectsError";
import { ApiError, getMe, getProject, listProjectTeam } from "@/lib/api/client";
import { auth0 } from "@/lib/auth0";
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
 * The owner's team with every status (`GET /v1/projects/{id}/team`; the public `team[]` is
 * accepted-only). A failure is reported, never shown as an empty team.
 */
async function loadManagedTeam(id: string) {
  try {
    return { managed: await listProjectTeam(id), managedFailed: false };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { managed: null, managedFailed: true };
  }
}

/**
 * The viewer's own account id, only for a signed-in non-owner, to offer "Leave" on their own
 * accepted row. Anything that goes wrong simply offers no Leave: the API still refuses a
 * stranger's call.
 */
async function loadViewerId(): Promise<string | null> {
  try {
    if (!(await auth0.getSession())) return null;
    return (await getMe()).id;
  } catch {
    return null;
  }
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
  const { managed, managedFailed } = project.isOwner
    ? await loadManagedTeam(id)
    : { managed: null, managedFailed: false };
  const viewerUserId = project.isOwner ? null : await loadViewerId();

  return (
    <PageContainer maxWidth={1100}>
      <BackButton />
      <FlashToast />
      {project.isOwner && (
        <OwnerBar projectId={project.id} isDraft={project.isDraft} isPublic={project.isPublic} />
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
          <TechTags items={project.technologies} />
          <TeamSection
            projectId={project.id}
            projectTitle={project.title}
            isOwner={project.isOwner}
            isDraft={project.isDraft}
            members={project.team}
            managed={managed}
            managedFailed={managedFailed}
            viewerUserId={viewerUserId}
          />
        </Box>
      </Box>
    </PageContainer>
  );
}
