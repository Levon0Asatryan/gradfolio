"use client";

import { FC, memo } from "react";
import { Stack, Typography } from "@mui/material";
import { Panel } from "@/components/layout/Panel";
import type { ProjectDetail } from "@/lib/api/types";

export interface ProjectMetadataCardProps {
  metadata: ProjectDetail["metadata"];
  /** Top-level on the API's project; shown with the rest of the facts. */
  category: string;
}

import { formatDay } from "@/utils/helpers/formatDay";
import { useLanguage } from "@/components/i18n/LanguageContext";

const ProjectMetadataCard: FC<ProjectMetadataCardProps> = ({ metadata, category }) => {
  const { t, language } = useLanguage();

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
        <Typography variant="body2">
          <strong>{t.common.category}</strong>{" "}
          {t.projects.categories[category as keyof typeof t.projects.categories] ?? category}
        </Typography>
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
