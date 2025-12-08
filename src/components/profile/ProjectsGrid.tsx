"use client";

import { FC, memo } from "react";
import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  Avatar,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import SectionCard from "./shared/SectionCard";
import Tag from "./shared/Tag";
import type { Project } from "@/data/profile.mock";

import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectsGridProps {
  items: Project[];
  onAddProject?: () => void;
}

const ProjectsGrid: FC<ProjectsGridProps> = ({ items, onAddProject }) => {
  const { t } = useLanguage();

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
                aria-label={`Project ${p.name}`}
                sx={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                <CardActionArea
                  component="a"
                  href={p.href || `/projects/${p.id}`}
                  target={p.href ? "_blank" : undefined}
                  rel={p.href ? "noopener noreferrer" : undefined}
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
                      {p.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {p.summary}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
                      {p.tags.map((t) => (
                        <Tag key={t} label={t} />
                      ))}
                    </Stack>

                    {p.team && p.team.length > 0 && (
                      <Stack direction="row" spacing={-1} sx={{ mt: "auto" }}>
                        {p.team.map((member) => (
                          <Tooltip key={member.id} title={member.name}>
                            <Avatar
                              src={member.avatarUrl}
                              alt={member.name}
                              sx={{ width: 24, height: 24, border: "2px solid white" }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    )}
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
