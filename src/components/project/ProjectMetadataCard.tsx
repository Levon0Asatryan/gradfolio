"use client";

import { FC, memo } from "react";
import { Stack, Typography } from "@mui/material";
import SectionCard from "./SectionCard";
import type { ProjectMetadata } from "@/data/project.mock";

export interface ProjectMetadataCardProps {
  metadata?: ProjectMetadata;
}

function fmtDate(d?: string): string | undefined {
  if (!d) return undefined;
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return d;
  }
}

import { useLanguage } from "@/components/i18n/LanguageContext";

const ProjectMetadataCard: FC<ProjectMetadataCardProps> = ({ metadata }) => {
  const { t } = useLanguage();

  if (!metadata) return null;

  const start = fmtDate(metadata.startDate);
  const end = fmtDate(metadata.endDate);

  return (
    <SectionCard title={t.common.projectInfo}>
      <Stack spacing={1}>
        {(start || end) && (
          <Typography variant="body2">
            <strong>{t.common.timeline}</strong> {start || "N/A"} {"–"} {end || t.common.present}
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
    </SectionCard>
  );
};

export default memo(ProjectMetadataCard);
