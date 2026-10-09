"use client";

import { FC } from "react";
import Link from "next/link";
import { Box, Button, Chip } from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * Shown to the owner only (the API answers 404 to everyone else): the Edit link,
 * and why nobody else can open the project. Presentation, not a guard: the edit
 * page and the API check ownership themselves.
 */
export const OwnerBar: FC<{ projectId: string; isDraft: boolean; isPublic: boolean }> = ({
  projectId,
  isDraft,
  isPublic,
}) => {
  const { t } = useLanguage();
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      <Button
        component={Link}
        href={`/projects/${projectId}/edit`}
        variant="contained"
        startIcon={<EditOutlined />}
      >
        {t.projects.form.editProject}
      </Button>
      {isDraft ? (
        <Chip variant="outlined" label={t.projects.draft} />
      ) : !isPublic ? (
        <Chip variant="outlined" label={t.projects.private} />
      ) : null}
    </Box>
  );
};
