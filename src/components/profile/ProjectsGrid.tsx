"use client";

import { FC, memo } from "react";
import { Button, Card, CardActionArea, CardContent, Stack, Chip, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import SectionCard from "./shared/SectionCard";
import Tag from "./shared/Tag";
import type { ProfileProject } from "@/lib/api/types";

import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectsGridProps {
  items: ProfileProject[];
  onAddProject?: () => void;
}

const ProjectsGrid: FC<ProjectsGridProps> = ({ items, onAddProject }) => {
  const { t } = useLanguage();
  const categories: Record<string, string> = t.projects.categories;

  return (
    <SectionCard
      title={t.common.projects}
      action={
        onAddProject && (
          <Button
            size="small"
            variant="contained"
            onClick={onAddProject}
            aria-label={t.common.addProject}
          >
            {t.common.addProject}
          </Button>
        )
      }
    >
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t.common.noProjectsYet}
        </Typography>
      ) : (
        <Grid container spacing={2} columns={{ xs: 12, sm: 12, md: 12 }}>
          {items.map((p) => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                <CardActionArea
                  component="a"
                  href={`/projects/${encodeURIComponent(p.id)}`}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                  }}
                >
                  <CardContent
                    sx={{ width: "100%", display: "flex", flexDirection: "column", flex: 1 }}
                  >
                    <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
                      {p.title}
                    </Typography>
                    {p.summary && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {p.summary}
                      </Typography>
                    )}
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                      <Chip size="small" variant="outlined" label={categories[p.category]} />
                      {p.isDraft && <Chip size="small" color="warning" label={t.profile.draft} />}
                      {!p.isPublic && (
                        <Chip size="small" color="warning" label={t.profile.privateProject} />
                      )}
                      {p.tags.map((tag) => (
                        <Tag key={tag} label={tag} />
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
