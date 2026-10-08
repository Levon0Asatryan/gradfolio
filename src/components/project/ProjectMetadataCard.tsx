"use client";

import { FC, memo } from "react";
import { Stack, Typography } from "@mui/material";
import { Panel } from "@/components/layout/Panel";
import type { ProjectMetadata } from "@/data/project.mock";

export interface ProjectMetadataCardProps {
  metadata?: ProjectMetadata;
}

import { formatDay } from "@/utils/helpers/formatDay";
import { useLanguage } from "@/components/i18n/LanguageContext";

const ProjectMetadataCard: FC<ProjectMetadataCardProps> = ({ metadata }) => {
  const { t, language } = useLanguage();

  if (!metadata) return null;

  const start = metadata.startDate ? formatDay(metadata.startDate, language) : undefined;
  const end = metadata.endDate ? formatDay(metadata.endDate, language) : undefined;

  return (
    <Panel title={t.common.projectInfo}>
      <Stack spacing={1}>
        {(start || end) && (
          <Typography variant="body2">
            <strong>{t.common.timeline}</strong> {start || "—"} {"–"} {end || t.common.present}
          </Typography>
        )}
        {metadata.category && (
          <Typography variant="body2">
            <strong>{t.common.category}</strong>{" "}
            {t.projects.categories[metadata.category as keyof typeof t.projects.categories] ||
              metadata.category}
          </Typography>
        )}
        {metadata.course && (
          <Typography variant="body2">
            <strong>{t.common.course}</strong> {metadata.course}
          </Typography>
        )}
        {metadata.professor && (
          <Typography variant="body2">
            <strong>{t.common.professor}</strong> {metadata.professor}
          </Typography>
        )}
      </Stack>
    </Panel>
  );
};

export default memo(ProjectMetadataCard);
