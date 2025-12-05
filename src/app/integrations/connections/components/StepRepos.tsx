"use client";

import React, { useMemo } from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

export type StepReposProps = {
  reposText: string;
  onReposChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const StepRepos: React.FC<StepReposProps> = ({ reposText, onReposChange }) => {
  const repoLines = useMemo(() => {
    return (reposText || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [reposText]);

  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      <Typography variant="h6" fontWeight={600}>
        Projects (GitHub Repos)
      </Typography>
      <TextField
        label="Repositories"
        placeholder={`Paste repo URLs or names, one per line`}
        value={reposText}
        onChange={onReposChange}
        fullWidth
        size="small"
        multiline
        minRows={6}
      />
      {repoLines.length > 0 ? (
        <List dense sx={{ pt: 0 }}>
          {repoLines.map((repo, idx) => (
            <ListItem key={`${repo}-${idx}`} dense disableGutters sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32, color: (t) => t.palette.text.secondary }}>
                <GitHubIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={repo} primaryTypographyProps={{ variant: "body2" }} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.disabled">
          No repositories added yet. Paste one per line above.
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        You can link repos now or skip and add them later from the Projects section.
      </Typography>
    </Stack>
  );
};
