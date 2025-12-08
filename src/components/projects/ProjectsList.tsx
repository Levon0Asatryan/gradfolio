"use client";

import { FC, memo } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import ProjectCard from "./ProjectCard";
import type { ProjectDetailData } from "@/data/project.mock";

import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectsListProps {
  projects: ProjectDetailData[];
  onAddProject?: () => void; // non-functional placeholder
  searchQuery?: string;
}

const ProjectsList: FC<ProjectsListProps> = ({ projects, onAddProject, searchQuery }) => {
  const { t } = useLanguage();
  if (!projects || projects.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Box textAlign="center" sx={{ py: 6 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            {t.common.noProjectsYet}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t.common.getStartedProject}
          </Typography>
          <Button variant="contained" onClick={onAddProject} aria-label={t.common.addProject}>
            {t.common.addProject}
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3 }}>
      <Grid container spacing={2} columns={{ xs: 12, sm: 12, md: 12 }}>
        {projects.map((p) => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ProjectCard project={p} highlightQuery={searchQuery} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default memo(ProjectsList);
