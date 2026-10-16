"use client";

import type { FC } from "react";
import Chip from "@mui/material/Chip";
import GitHub from "@mui/icons-material/GitHub";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * "From GitHub" on a project that was imported. Text and an icon (never the icon alone), and
 * only from the API's `source`: a repository link on a manual project does not make it one.
 */
const SourceBadge: FC<{ source: "manual" | "github" | undefined }> = ({ source }) => {
  const { t } = useLanguage();
  if (source !== "github") return null;
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<GitHub />}
      label={t.integrations.sourceBadge}
      sx={{ flexShrink: 0 }}
    />
  );
};

export default SourceBadge;
