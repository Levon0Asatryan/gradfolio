import Grid from "@mui/material/Grid";
// import Link from "next/link"; // Removed
// import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // Removed
import BackButton from "@/components/project/BackButton";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectDescription from "@/components/project/ProjectDescription";
import AttachmentsGallery from "@/components/project/AttachmentsGallery";
import ProjectMetadataCard from "@/components/project/ProjectMetadataCard";
import TeamList from "@/components/project/TeamList";
import TechTagsClient from "@/components/project/TechTagsClient";
import { getProjectById } from "@/data/project.mock";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";

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
    <PageContainer gap={0}>
      <BackButton />

      <ProjectHeader
        title={data.title}
        aiSummary={data.aiSummary}
        heroImageUrl={data.heroImageUrl}
        repo={data.repo}
        liveDemoUrl={data.liveDemoUrl}
      />

      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ProjectDescription html={data.descriptionHtml} />
          <AttachmentsGallery items={data.attachments} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ProjectMetadataCard metadata={data.metadata} />
          <TechTagsClient items={data.technologies} />
          <TeamList members={data.team} />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
