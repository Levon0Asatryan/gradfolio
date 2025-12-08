"use client";

import React from "react";
import { Stack, TextField, Typography } from "@mui/material";

export type StepExperienceEducationProps = {
  experience: string;
  education: string;
  onExperienceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEducationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

import { useLanguage } from "@/components/i18n/LanguageContext";

export const StepExperienceEducation: React.FC<StepExperienceEducationProps> = ({
  experience,
  education,
  onExperienceChange,
  onEducationChange,
}) => {
  const { t } = useLanguage();

  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      <Typography variant="h6" fontWeight={600}>
        {t.integrations.steps.experience.title}
      </Typography>
      <TextField
        label={t.integrations.steps.experience.label}
        placeholder={t.integrations.steps.experience.placeholder}
        value={experience}
        onChange={onExperienceChange}
        fullWidth
        size="small"
        multiline
        minRows={4}
      />
      <TextField
        label={t.integrations.steps.experience.educationLabel}
        placeholder={t.integrations.steps.experience.educationPlaceholder}
        value={education}
        onChange={onEducationChange}
        fullWidth
        size="small"
        multiline
        minRows={3}
      />
    </Stack>
  );
};
