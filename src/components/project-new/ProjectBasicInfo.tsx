"use client";

import { FC, memo } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { ProjectFormState } from "./types";

export interface ProjectBasicInfoProps {
  values: ProjectFormState;
  onChange: (field: keyof ProjectFormState, value: string) => void;
}

import { useLanguage } from "@/components/i18n/LanguageContext";

const ProjectBasicInfo: FC<ProjectBasicInfoProps> = ({ values, onChange }) => {
  const { t } = useLanguage();
  return (
    <Box component="section" aria-label={t.projects.form.basicInfo} sx={{ mb: 4 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {t.projects.form.basicInfo}
      </Typography>
      <Stack spacing={3}>
        <TextField
          label={t.projects.form.projectTitle}
          value={values.title}
          onChange={(e) => onChange("title", e.target.value)}
          fullWidth
          required
          placeholder={t.projects.form.projectTitlePlaceholder}
        />
        <TextField
          label={t.projects.form.aiSummary}
          value={values.aiSummary}
          onChange={(e) => onChange("aiSummary", e.target.value)}
          fullWidth
          multiline
          minRows={3}
          placeholder={t.projects.form.aiSummaryPlaceholder}
          helperText={t.projects.form.aiSummaryHelper}
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label={t.projects.form.liveDemoUrl}
            value={values.liveDemoUrl}
            onChange={(e) => onChange("liveDemoUrl", e.target.value)}
            fullWidth
            placeholder="https://..."
          />
          <TextField
            label={t.projects.form.repoUrl}
            value={values.repoUrl}
            onChange={(e) => onChange("repoUrl", e.target.value)}
            fullWidth
            placeholder="https://github.com/..."
          />
        </Stack>
      </Stack>
    </Box>
  );
};
export default memo(ProjectBasicInfo);
