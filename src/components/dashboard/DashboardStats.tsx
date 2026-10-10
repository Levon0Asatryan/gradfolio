"use client";

import { FC, memo, ReactElement } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FolderIcon from "@mui/icons-material/Folder";
import PublicIcon from "@mui/icons-material/Public";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GitHubIcon from "@mui/icons-material/GitHub";
import type { DashboardStats as DashboardStatsType } from "@/lib/api/types";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface DashboardStatsProps {
  /** `null`: the numbers could not be loaded. That is shown, never as zeros. */
  stats: DashboardStatsType | null;
}

type Tone = "primary" | "success" | "info" | "secondary";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactElement;
  tone: Tone;
}

const StatCard: FC<StatCardProps> = ({ label, value, icon, tone }) => (
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
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
        {label}
      </Typography>
    </Box>
  </Card>
);

/**
 * The numbers the API counted. GitHub stars appear only when the API has a number (an import
 * stored some, M7): a tile that says "No data" for ever is noise, and a made-up number is a
 * wrong result. LinkedIn connections are not collected and have no tile.
 */
const DashboardStats: FC<DashboardStatsProps> = ({ stats }) => {
  const { t } = useLanguage();
  const s = t.dashboard.stats;

  if (stats === null) {
    return <Alert severity="error">{t.dashboard.statsLoadError}</Alert>;
  }

  const items: Array<StatCardProps & { key: string }> = [
    {
      key: "projects",
      label: s.totalProjects,
      value: stats.projects.total,
      icon: <FolderIcon />,
      tone: "primary",
    },
    {
      key: "published",
      label: s.published,
      value: stats.projects.published,
      icon: <PublicIcon />,
      tone: "success",
    },
    {
      key: "drafts",
      label: s.drafts,
      value: stats.projects.draft,
      icon: <EditNoteIcon />,
      tone: "secondary",
    },
  ];
  if (stats.githubStars !== null) {
    items.push({
      key: "stars",
      label: s.githubStars,
      value: stats.githubStars,
      icon: <GitHubIcon />,
      tone: "info",
    });
  }
  items.push({
    key: "activity",
    label: s.recentActivities,
    value: stats.recentActivities,
    icon: <TrendingUpIcon />,
    tone: "info",
  });

  return (
    <Box
      component="ul"
      aria-label={t.dashboard.overview}
      sx={{
        m: 0,
        p: 0,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(auto-fit, minmax(200px, 1fr))",
        },
        gap: 2,
      }}
    >
      {items.map(({ key, ...it }) => (
        <StatCard key={key} {...it} />
      ))}
    </Box>
  );
};

export default memo(DashboardStats);
