"use client";

import { FC, memo, useId, useMemo } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import type { DashboardProject } from "@/lib/api/types";
import Alert from "@mui/material/Alert";
import { formatDay } from "@/utils/helpers/formatDay";
import { CategoryChip } from "@/components/shared/CategoryChip";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface RecentProjectsProps {
  /** `null`: the list could not be loaded (shown as an error, never as "no projects"). */
  items: DashboardProject[] | null;
}

const SHOWN = 3;

const RecentProjectCard: FC<{ project: DashboardProject }> = ({ project: p }) => {
  const { t, language } = useLanguage();
  const titleId = useId();
  return (
    <Card sx={{ display: "flex", minWidth: 0 }}>
      <CardActionArea
        component={Link}
        href={`/projects/${p.id}`}
        aria-labelledby={titleId}
        sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1.5 }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <CategoryChip category={p.category} />
          <Typography variant="caption" color="text.secondary">
            {t.projects.status[p.status]}
          </Typography>
          {p.isDraft ? (
            <Chip size="small" variant="outlined" label={t.dashboard.statusDraft} />
          ) : !p.isPublic ? (
            <Chip size="small" variant="outlined" label={t.dashboard.statusPrivate} />
          ) : null}
          {p.role === "member" && (
            <Chip size="small" variant="outlined" label={t.dashboard.roleMember} />
          )}
        </Box>
        <Typography id={titleId} variant="subtitle1" component="h3" sx={{ fontWeight: 800 }}>
          {p.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.summary}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: "auto" }}>
          {p.technologies.slice(0, 3).map((tech) => (
            <Chip key={tech} size="small" label={tech} variant="outlined" />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" suppressHydrationWarning>
          {formatDay(p.updatedAt, language)}
        </Typography>
      </CardActionArea>
    </Card>
  );
};

const RecentProjects: FC<RecentProjectsProps> = ({ items }) => {
  const { t } = useLanguage();
  const headingId = useId();

  // The API already orders them by last change; this only caps the row.
  const top = useMemo(() => (items ?? []).slice(0, SHOWN), [items]);

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography id={headingId} variant="h6" component="h2">
          {t.dashboard.recentProjects}
        </Typography>
        <Button component={Link} href="/projects" variant="text">
          {t.common.viewAll}
        </Button>
      </Box>
      {items === null ? (
        <Alert severity="error">{t.dashboard.projectsLoadError}</Alert>
      ) : top.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <FolderOpenIcon color="disabled" sx={{ fontSize: 48 }} />
          <Typography color="text.secondary">{t.dashboard.noRecentProjects}</Typography>
        </Card>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 3,
          }}
        >
          {top.map((p) => (
            <RecentProjectCard key={p.id} project={p} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default memo(RecentProjects);
