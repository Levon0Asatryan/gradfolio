"use client";

import { FC } from "react";
import Link from "next/link";
import { Box, Button, Chip } from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { useLanguage } from "@/components/i18n/LanguageContext";
import DraftChip from "@/components/shared/DraftChip";
import { PublishButton } from "./PublishButton";
import { PublishStatus, usePublishStatus } from "./PublishStatus";

/**
 * Shown to the owner only (the API answers 404 to everyone else): the Edit link, the state of
 * the project (a Draft chip, or Private), and the quick Publish / Move back to drafts that
 * needs no edit form. Presentation, not a guard: the edit page and the API check ownership.
 */
export const OwnerBar: FC<{
  projectId: string;
  title: string;
  isDraft: boolean;
  isPublic: boolean;
}> = ({ projectId, title, isDraft, isPublic }) => {
  const { t } = useLanguage();
  const publishStatus = usePublishStatus();
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
        <>
          <PublishButton
            projectId={projectId}
            title={title}
            isPublic={isPublic}
            variant="outlined"
            onDone={publishStatus.onDone}
          />
          <DraftChip size="medium" />
        </>
      ) : (
        <>
          <PublishButton
            projectId={projectId}
            title={title}
            isPublic={isPublic}
            mode="draft"
            variant="text"
            onDone={publishStatus.onDone}
          />
          {!isPublic && <Chip variant="outlined" label={t.projects.private} />}
        </>
      )}
      {/* Outlives the button: the page swaps Publish for Move back to drafts. */}
      <PublishStatus text={publishStatus.status} lineRef={publishStatus.line} />
    </Box>
  );
};
