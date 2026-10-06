"use client";

import { FC, memo, ReactElement } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FolderIcon from "@mui/icons-material/Folder";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import type { DashboardStats as DashboardStatsType } from "@/utils/types/dashboard.types";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface DashboardStatsProps {
  stats?: DashboardStatsType;
}

type Tone = "primary" | "success" | "info" | "secondary";

interface StatCardProps {
  label: string;
  value?: number;
  noData: string;
  icon: ReactElement;
  tone: Tone;
}

const StatCard: FC<StatCardProps> = ({ label, value, noData, icon, tone }) => (
  <Card
    component="li"
    sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, minWidth: 0, listStyle: "none" }}
  >
    <Box
      aria-hidden
      sx={({ palette }) => ({
        width: 40,
        height: 40,
        flex: "none",
        borderRadius: 3,
        display: "grid",
        placeItems: "center",
        color: palette[tone].main,
        bgcolor: `color-mix(in srgb, ${palette[tone].main} 12%, ${palette.background.paper})`,
      })}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="h5"
        component="p"
        sx={{ lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}
      >
        {value ?? noData}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
        {label}
      </Typography>
    </Box>
  </Card>
);

const DashboardStats: FC<DashboardStatsProps> = ({ stats }) => {
  const { t } = useLanguage();
  const s = t.dashboard.stats;
  const items: Array<Omit<StatCardProps, "noData"> & { key: string }> = [
    {
      key: "projects",
      label: s.totalProjects,
      value: stats?.totalProjects,
      icon: <FolderIcon />,
      tone: "primary",
    },
    {
      key: "stars",
      label: s.githubStars,
      value: stats?.githubStars,
      icon: <GitHubIcon />,
      tone: "info",
    },
    {
      key: "connections",
      label: s.linkedinConnections,
      value: stats?.linkedinConnections,
      icon: <LinkedInIcon />,
      tone: "secondary",
    },
    {
      key: "activity",
      label: s.recentActivities,
      value: stats?.recentActivities,
      icon: <TrendingUpIcon />,
      tone: "success",
    },
  ];

  return (
    <Box
      component="ul"
      aria-label={t.dashboard.overview}
      sx={{
        m: 0,
        p: 0,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        gap: 2,
      }}
    >
      {items.map(({ key, ...it }) => (
        <StatCard key={key} noData={t.dashboard.noData} {...it} />
      ))}
    </Box>
  );
};

export default memo(DashboardStats);
