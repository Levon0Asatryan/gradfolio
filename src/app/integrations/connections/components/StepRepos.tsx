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

import { useLanguage } from "@/components/i18n/LanguageContext";

export const StepRepos: React.FC<StepReposProps> = ({ reposText, onReposChange }) => {
  const { t } = useLanguage();
  const repoLines = useMemo(() => {
    return (reposText || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [reposText]);

  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      <Typography variant="h6" fontWeight={600}>
        {t.integrations.steps.repos.title}
      </Typography>
      <TextField
        label={t.integrations.steps.repos.label}
        placeholder={t.integrations.steps.repos.placeholder}
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
          {t.integrations.steps.repos.empty}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        {t.integrations.steps.repos.hint}
      </Typography>
    </Stack>
  );
};
