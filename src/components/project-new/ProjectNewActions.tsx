"use client";

import { FC, memo } from "react";
import { Button, Stack } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import Link from "next/link";

export interface ProjectNewActionsProps {
  onSave: () => void;
  isSaving?: boolean;
}

const ProjectNewActions: FC<ProjectNewActionsProps> = ({ onSave, isSaving = false }) => {
  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
      <Button
        variant="outlined"
        color="inherit"
        component={Link}
        href="/projects"
        startIcon={<CancelIcon />}
      >
        Cancel
      </Button>
      <Button variant="contained" onClick={onSave} disabled={isSaving} startIcon={<SaveIcon />}>
        {isSaving ? "Saving..." : "Create Project"}
      </Button>
    </Stack>
  );
};

export default memo(ProjectNewActions);
