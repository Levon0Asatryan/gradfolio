"use client";

import { FC, memo } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { ProjectFormState } from "./types";

export interface ProjectBasicInfoProps {
  values: ProjectFormState;
  onChange: (field: keyof ProjectFormState, value: string) => void;
}

const ProjectBasicInfo: FC<ProjectBasicInfoProps> = ({ values, onChange }) => {
  return (
    <Box component="section" aria-label="Basic Information" sx={{ mb: 4 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Basic Information
      </Typography>
      <Stack spacing={3}>
        <TextField
          label="Project Title"
          value={values.title}
          onChange={(e) => onChange("title", e.target.value)}
          fullWidth
          required
          placeholder="e.g. EcoRoute – CO₂-aware Navigation"
        />
        <TextField
          label="AI Summary"
          value={values.aiSummary}
          onChange={(e) => onChange("aiSummary", e.target.value)}
          fullWidth
          multiline
          minRows={3}
          placeholder="Brief description of the project..."
          helperText="This summary will be displayed on the project card."
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Live Demo URL"
            value={values.liveDemoUrl}
            onChange={(e) => onChange("liveDemoUrl", e.target.value)}
            fullWidth
            placeholder="https://..."
          />
          <TextField
            label="GitHub Repository URL"
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
