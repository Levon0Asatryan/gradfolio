"use client";

import { FC, memo, useMemo, useState } from "react";
import { Box, Card, CardContent, Chip, Link, Stack, Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import type { Publication, Project } from "@/utils/types/dashboard.types";
import { formatDate } from "@/utils/helpers/formatDate";

export interface RecentWorkProps {
  projects?: Project[];
  publications?: Publication[];
  onViewAllProjects?: () => void;
  onViewAllPublications?: () => void;
  onProjectClick?: (p: Project) => void;
  onPublicationClick?: (p: Publication) => void;
}

type View = "all" | "projects" | "publications";

const RecentWork: FC<RecentWorkProps> = ({
  projects = [],
  publications = [],
  onViewAllProjects,
  onViewAllPublications,
  onProjectClick,
  onPublicationClick,
}) => {
  const [view, setView] = useState<View>("all");

  const allItems = useMemo(() => {
    const proj = projects.map((p) => ({
      kind: "project" as const,
      id: p.id,
      title: p.title,
      subtitle: p.description,
      date: p.lastUpdated,
      status: p.status,
      tags: p.technologies,
      raw: p,
    }));
    const pubs = publications.map((x) => ({
      kind: "publication" as const,
      id: x.id,
      title: x.title,
      subtitle: x.journal,
      date: x.date,
      status: x.status,
      tags: x.authors,
      raw: x,
    }));
    return [...proj, ...pubs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [projects, publications]);

  const content = (
    <Grid container spacing={1.5} columns={{ xs: 12 }}>
      {(view === "all"
        ? allItems
        : view === "projects"
          ? allItems.filter((i) => i.kind === "project")
          : allItems.filter((i) => i.kind === "publication")
      )
        .slice(0, 5)
        .map((it) => (
          <Grid key={`${it.kind}_${it.id}`} size={{ xs: 12 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{
                p: 1,
                borderRadius: 1,
                transition: (t) =>
                  t.transitions.create(["background-color", "box-shadow"], { duration: 120 }),
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (it.kind === "project") onProjectClick?.(it.raw as Project);
                else onPublicationClick?.(it.raw as Publication);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (it.kind === "project") onProjectClick?.(it.raw as Project);
                  else onPublicationClick?.(it.raw as Publication);
                }
              }}
              aria-label={`Open ${it.title}`}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  color: "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-hidden
              >
                {it.kind === "project" ? (
                  <FolderIcon fontSize="small" />
                ) : (
                  <ArticleIcon fontSize="small" />
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1" noWrap title={it.title} sx={{ fontWeight: 500 }}>
                    {it.title}
                  </Typography>
                  <Chip size="small" label={String(it.status)} variant="outlined" />
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 0.25, flexWrap: "wrap" }}
                >
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {it.subtitle}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(it.date)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Grid>
        ))}
    </Grid>
  );

  return (
    <Card
      component="section"
      aria-label="Recent Work"
      variant="outlined"
      sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6">Recent Work</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Link
              component="button"
              variant="body2"
              onClick={onViewAllProjects}
              sx={{ textDecoration: "none" }}
            >
              View Projects
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={onViewAllPublications}
              sx={{ textDecoration: "none" }}
            >
              View Publications
            </Link>
          </Stack>
        </Stack>
        <Tabs
          value={view}
          onChange={(_, v) => setView(v)}
          aria-label="Recent work filter"
          sx={{ mb: 1 }}
        >
          <Tab label="All" value="all" />
          <Tab label="Projects" value="projects" />
          <Tab label="Publications" value="publications" />
        </Tabs>
        {content}
      </CardContent>
    </Card>
  );
};

export default memo(RecentWork);
