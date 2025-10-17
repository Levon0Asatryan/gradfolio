"use client";

import React from "react";
import { Stack, TextField, Typography } from "@mui/material";

export type StepExperienceEducationProps = {
  experience: string;
  education: string;
  onExperienceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEducationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const StepExperienceEducation: React.FC<StepExperienceEducationProps> = ({
  experience,
  education,
  onExperienceChange,
  onEducationChange,
}) => {
  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      <Typography variant="h6" fontWeight={600}>
        Experience & Education
      </Typography>
      <TextField
        label="Experience"
        placeholder="Summarize your relevant work experience..."
        value={experience}
        onChange={onExperienceChange}
        fullWidth
        size="small"
        multiline
        minRows={4}
      />
      <TextField
        label="Education"
        placeholder="Schools, degrees, courses..."
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