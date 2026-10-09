"use client";

import { FC, memo } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ProjectCard from "./ProjectCard";
import type { ProjectSummary } from "@/lib/api/types";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectsListProps {
  projects: ProjectSummary[];
  searchQuery?: string;
  /** A search or category filter is on: an empty list then means "no match", not "no projects". */
  filtered?: boolean;
  onClearFilters?: () => void;
}

const ProjectsList: FC<ProjectsListProps> = ({
  projects,
  searchQuery,
  filtered = false,
  onClearFilters,
}) => {
  const { t } = useLanguage();

  if (projects.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="h6" component="h2">
            {filtered ? t.projects.noMatches : t.common.noProjectsYet}
          </Typography>
          <Typography color="text.secondary">
            {filtered ? t.projects.noMatchesHelp : t.common.getStartedProject}
          </Typography>
        </Box>
        <Box>
          {filtered ? (
            <Button variant="outlined" onClick={onClearFilters}>
              {t.projects.clearFilters}
            </Button>
          ) : (
            <Button component={Link} href="/projects/new" variant="contained">
              {t.common.addProject}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
        gap: 3,
      }}
    >
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} highlightQuery={searchQuery} />
      ))}
    </Box>
  );
};

export default memo(ProjectsList);
