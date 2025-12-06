"use client";

import { FC, memo } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import ProjectCard from "./ProjectCard";
import type { ProjectDetailData } from "@/data/project.mock";

export interface ProjectsListProps {
  projects: ProjectDetailData[];
  onAddProject?: () => void; // non-functional placeholder
  searchQuery?: string;
}

const ProjectsList: FC<ProjectsListProps> = ({ projects, onAddProject, searchQuery }) => {
  if (!projects || projects.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Box textAlign="center" sx={{ py: 6 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get started by adding your first project to showcase your work.
          </Typography>
          <Button variant="contained" onClick={onAddProject} aria-label="Add Project">
            Add Project
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
