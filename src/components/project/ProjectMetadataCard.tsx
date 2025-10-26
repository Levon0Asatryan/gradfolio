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
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return d;
  }
}

const ProjectMetadataCard: FC<ProjectMetadataCardProps> = ({ metadata }) => {
  if (!metadata) return null;

  const start = fmtDate(metadata.startDate);
  const end = fmtDate(metadata.endDate);

  return (
    <SectionCard title="Project Info">
      <Stack spacing={1}>
        {(start || end) && (
          <Typography variant="body2">
            <strong>Timeline:</strong> {start || "N/A"} {"–"} {end || "Present"}
          </Typography>
        )}
        {metadata.category && (
          <Typography variant="body2">
            <strong>Category:</strong> {metadata.category}
          </Typography>
        )}
        {metadata.course && (
          <Typography variant="body2">
            <strong>Course:</strong> {metadata.course}
          </Typography>
        )}
        {metadata.professor && (
          <Typography variant="body2">
            <strong>Professor:</strong> {metadata.professor}
          </Typography>
        )}
      </Stack>
    </SectionCard>
  );
};

export default memo(ProjectMetadataCard);
