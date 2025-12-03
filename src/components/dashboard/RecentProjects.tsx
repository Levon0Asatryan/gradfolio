"use client";

import { FC, memo, useMemo } from "react";
import { Box, Card, CardContent, Chip, Link, Skeleton, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import type { Project } from "@/utils/types/dashboard.types";
import { formatDate } from "@/utils/helpers/formatDate";

export interface RecentProjectsProps {
  items?: Project[];
  onViewAll?: () => void;
  loading?: boolean;
  onItemClick?: (project: Project) => void;
}

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

const statusToColor = (status: Project["status"]): ChipColor => {
  switch (status) {
    case "ongoing":
      return "info";
    case "completed":
      return "success";
    case "archived":
      return "default";
    default:
      return "default";
  }
};

const RecentProjects: FC<RecentProjectsProps> = ({ items = [], onViewAll, loading, onItemClick }) => {
  const top = useMemo<Project[]>(() => {
    if (items.length === 0) return [];
    return [...items]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, Math.max(3, Math.min(4, items.length)));
  }, [items]);

  if (loading) {
    return (
      <Card component="section" aria-label="Recent Projects" variant="outlined" sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Recent Projects</Typography>
            <Skeleton variant="text" width={60} height={20} />
          </Stack>
          <Stack spacing={1.5}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} sx={{ p: 1 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton variant="text" width="60%" height={22} />
                    <Skeleton variant="rounded" width={70} height={20} />
                  </Stack>
                  <Skeleton variant="text" width="90%" height={18} />
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center" }}>
                    <Skeleton variant="rounded" width={64} height={20} />
                    <Skeleton variant="rounded" width={64} height={20} />
                    <Skeleton variant="rounded" width={64} height={20} />
                    <Box sx={{ flex: 1 }} />
                    <Skeleton variant="text" width={80} height={16} />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card component="section" aria-label="Recent Projects" variant="outlined" sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Recent Projects</Typography>
            <Link component="button" variant="body2" onClick={onViewAll} sx={{ textDecoration: "none" }}>
              View All
            </Link>
          </Stack>
          <Box sx={{ textAlign: "center", py: 5 }}>
            <FolderOpenIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No projects yet</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card component="section" aria-label="Recent Projects" variant="outlined" sx={{ transition: (t) => t.transitions.create("box-shadow"), "&:hover": { boxShadow: 6 } }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Recent Projects</Typography>
          <Link component="button" variant="body2" onClick={onViewAll} sx={{ textDecoration: "none" }}>
            View All
          </Link>
        </Stack>
        <Grid container spacing={1.5} columns={{ xs: 12 }}>
          {top.map((p) => (
            <Grid key={p.id} size={{ xs: 12 }}>
              <Stack
                spacing={0.5}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  transition: (t) => t.transitions.create(["background-color", "box-shadow", "transform"], { duration: 120 }),
                  cursor: onItemClick ? "pointer" : "default",
                  "&:hover": onItemClick ? { bgcolor: "action.hover" } : undefined,
                }}
                role={onItemClick ? "button" : undefined}
                tabIndex={onItemClick ? 0 : undefined}
                onClick={onItemClick ? () => onItemClick(p) : undefined}
                onKeyDown={onItemClick ? (e) => { if (e.key === "Enter") onItemClick(p); } : undefined}
                aria-label={onItemClick ? `Open ${p.title}` : undefined}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1" noWrap title={p.title} sx={{ fontWeight: 500, flex: 1, minWidth: 0 }}>
                    {p.title}
                  </Typography>
                  <Chip size="small" label={p.status} color={statusToColor(p.status)} variant="outlined" />
                </Stack>
                <Typography variant="body2" color="text.secondary" noWrap title={p.description}>
                  {p.description}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                  {p.technologies.slice(0, 4).map((t) => (
                    <Chip key={t} size="small" label={t} variant="outlined" />
                  ))}
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">{formatDate(p.lastUpdated)}</Typography>
                </Stack>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default memo(RecentProjects);
