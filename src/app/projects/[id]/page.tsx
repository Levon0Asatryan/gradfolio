import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import BackButton from "@/components/project/BackButton";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectDescription from "@/components/project/ProjectDescription";
import AttachmentsGallery from "@/components/project/AttachmentsGallery";
import ProjectMetadataCard from "@/components/project/ProjectMetadataCard";
import TeamList from "@/components/project/TeamList";
import TechTagsClient from "@/components/project/TechTagsClient";
import { getProjectById } from "@/data/project.mock";
import { notFound } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = getProjectById(id);
  return {
    title: project ? `${project.title} – Project` : "Project",
    description: project?.aiSummary,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const data = getProjectById(id);
  if (!data) return notFound();

  return (
    <PageContainer maxWidth={1100}>
      <BackButton />

      <ProjectHeader
        title={data.title}
        aiSummary={data.aiSummary}
        category={data.metadata?.category}
        heroImageUrl={data.heroImageUrl}
        repo={data.repo}
        liveDemoUrl={data.liveDemoUrl}
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
          <ProjectDescription html={data.descriptionHtml} />
          <AttachmentsGallery items={data.attachments} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <ProjectMetadataCard metadata={data.metadata} />
          <TechTagsClient items={data.technologies} />
          <TeamList members={data.team} />
        </Box>
      </Box>
    </PageContainer>
  );
}
