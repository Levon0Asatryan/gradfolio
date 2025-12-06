"use client";

import { FC, memo } from "react";
import { Button, Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import SectionCard from "./shared/SectionCard";
import Tag from "./shared/Tag";
import type { Project } from "@/data/profile.mock";

export interface ProjectsGridProps {
  items: Project[];
  onAddProject?: () => void;
}

const ProjectsGrid: FC<ProjectsGridProps> = ({ items, onAddProject }) => {
  return (
    <SectionCard
      title="Projects"
      action={
        <Button size="small" variant="contained" onClick={onAddProject} aria-label="Add Project">
          Add Project
        </Button>
      }
    >
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No projects yet — Add one
        </Typography>
      ) : (
        <Grid container spacing={2} columns={{ xs: 12, sm: 12, md: 12 }}>
          {items.map((p) => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" aria-label={`Project ${p.name}`}>
                <CardActionArea
                  {...(p.href
                    ? {
                        component: "a",
                        href: p.href,
                        target: "_blank",
                        rel: "noopener noreferrer",
                      }
                    : {})}
                >
                  <CardContent>
                    <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
                      {p.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {p.summary}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap">
                      {p.tags.map((t) => (
                        <Tag key={t} label={t} />
                      ))}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </SectionCard>
  );
};

export default memo(ProjectsGrid);
