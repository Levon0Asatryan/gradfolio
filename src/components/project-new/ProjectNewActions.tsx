"use client";

import { FC, memo } from "react";
import { Button, Stack } from "@mui/material";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectNewActionsProps {
  onSave: () => void;
  isSaving?: boolean;
}

const ProjectNewActions: FC<ProjectNewActionsProps> = ({ onSave, isSaving = false }) => {
  const { t } = useLanguage();
  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end" useFlexGap flexWrap="wrap">
      <Button variant="outlined" color="inherit" component={Link} href="/projects">
        {t.projects.form.cancel}
      </Button>
      <Button variant="contained" onClick={onSave} disabled={isSaving}>
        {isSaving ? t.projects.form.saving : t.projects.form.createProject}
      </Button>
    </Stack>
  );
};

export default memo(ProjectNewActions);
