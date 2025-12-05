"use client";

import { FC, memo, ReactElement } from "react";
import { Box, Card, CardContent, Stack, Typography, Chip, Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { DashboardStats as DashboardStatsType } from "@/utils/types/dashboard.types";

export interface DashboardStatsProps {
  stats?: DashboardStatsType;
  loading?: boolean;
  onStatClick?: (key: keyof DashboardStatsType) => void;
}

interface StatCardProps {
  label: string;
  value?: number;
  icon: ReactElement;
  onClick?: () => void;
}

const StatCard: FC<StatCardProps> = ({ label, value, icon, onClick }) => {
  const isEmpty = value === undefined || value === null;
  return (
    <Card
      component="section"
      variant="outlined"
      sx={{
        transition: (theme) =>
          theme.transitions.create(["box-shadow", "transform"], { duration: 150 }),
        cursor: onClick ? "pointer" : "default",
        "&:hover": { boxShadow: 6 },
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
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
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
            {isEmpty ? (
              <Chip size="small" label="No data" sx={{ mt: 0.5 }} />
            ) : (
              <Typography variant="h5" sx={{ mt: 0.5 }}>
                {value}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const DashboardStats: FC<DashboardStatsProps> = ({ stats, loading, onStatClick }) => {
  const items = [
    {
      key: "totalPublications" as const,
      label: "Publications",
      value: stats?.totalPublications,
      icon: <ArticleIcon />,
    },
    {
      key: "totalProjects" as const,
      label: "Projects",
      value: stats?.totalProjects,
      icon: <FolderIcon />,
    },
    {
      key: "profileViews" as const,
      label: "Profile Views",
      value: stats?.profileViews,
      icon: <VisibilityIcon />,
    },
    {
      key: "recentActivities" as const,
      label: "Recent Activities",
      value: stats?.recentActivities,
      icon: <TrendingUpIcon />,
    },
  ] as const;

  return (
    <Box component="section" aria-label="Dashboard Stats" sx={{ mb: 2 }}>
      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        {items.map((it) => (
          <Grid key={it.key} size={{ xs: 12, sm: 6, md: 4 }}>
            {loading ? (
              <Card component="section" variant="outlined" sx={{ p: 1 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton
                      variant="rounded"
                      width={40}
                      height={40}
                      sx={{ borderRadius: 1, flexShrink: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width={100} height={16} />
                      <Skeleton variant="text" width={60} height={32} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <StatCard
                label={it.label}
                value={it.value}
                icon={it.icon}
                onClick={onStatClick ? () => onStatClick(it.key) : undefined}
              />
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default memo(DashboardStats);
