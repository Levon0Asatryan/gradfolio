"use client";

import { FC, memo, ReactElement } from "react";
import { Box, Card, CardContent, Stack, Typography, Chip, Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FolderIcon from "@mui/icons-material/Folder";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import type { DashboardStats as DashboardStatsType } from "@/utils/types/dashboard.types";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface DashboardStatsProps {
  stats?: DashboardStatsType;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value?: number;
  icon: ReactElement;
}

const iconContainerSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  color: "primary.main",
  opacity: 0.8,
  bgcolor: "action.hover",
  borderRadius: "50%",
};

const StatCard: FC<StatCardProps> = ({ label, value, icon }) => {
  const isEmpty = value === undefined || value === null;
  return (
    <Card
      component="section"
      variant="outlined"
      sx={{
        height: "100%",
        userSelect: "none",
        bgcolor: "background.paper",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 600, letterSpacing: 1 }}
            >
              {label}
            </Typography>
            <Box sx={iconContainerSx}>{icon}</Box>
          </Stack>
          {isEmpty ? (
            <Chip size="small" label="No data" />
          ) : (
            <Typography variant="h3" fontWeight="bold" sx={{ lineHeight: 1 }}>
              {value}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const DashboardStats: FC<DashboardStatsProps> = ({ stats, loading }) => {
  const { t } = useLanguage();

  const items = [
    {
      key: "totalProjects" as const,
      label: t.dashboard.stats.totalProjects,
      value: stats?.totalProjects,
      icon: <FolderIcon />,
    },
    {
      key: "githubStars" as const,
      label: t.dashboard.stats.githubStars,
      value: stats?.githubStars,
      icon: <GitHubIcon />,
    },
    {
      key: "linkedinConnections" as const,
      label: t.dashboard.stats.linkedinConnections,
      value: stats?.linkedinConnections,
      icon: <LinkedInIcon />,
    },
    {
      key: "recentActivities" as const,
      label: t.dashboard.stats.recentActivities,
      value: stats?.recentActivities,
      icon: <TrendingUpIcon />,
    },
  ] as const;

  return (
    <Box component="section" aria-label="Dashboard Stats" sx={{ mb: 2 }}>
      <Grid container spacing={2} columns={{ xs: 12 }}>
        {items.map((it) => (
          <Grid key={it.key} size={{ xs: 12, sm: 6, md: 3 }}>
            {loading ? (
              <Card component="section" variant="outlined" sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Skeleton variant="text" width={80} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Stack>
                  <Skeleton variant="text" width={60} height={40} />
                </Stack>
              </Card>
            ) : (
              <StatCard label={it.label} value={it.value} icon={it.icon} />
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default memo(DashboardStats);
