"use client";

import type { FC } from "react";
import Chip from "@mui/material/Chip";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * "Draft" on a project only its owner can see. Text and an icon (never colour alone), one
 * component for every card and the project page, so the state looks the same everywhere.
 */
const DraftChip: FC<{ size?: "small" | "medium" }> = ({ size = "small" }) => {
  const { t } = useLanguage();
  return (
    <Chip
      size={size}
      color="warning"
      variant="outlined"
      icon={<EditNoteOutlined />}
      label={t.projects.draft}
      sx={{ flexShrink: 0, fontWeight: 700 }}
    />
  );
};

export default DraftChip;
