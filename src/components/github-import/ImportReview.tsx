"use client";

import { type FC } from "react";
import { Alert, Box, IconButton, Stack, TextField, Typography } from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { GithubRepo } from "@/lib/api/types";
import { PROJECT_LIMITS } from "@/lib/projects/limits";
import { type Draft, repoName, splitTechnologies } from "./model";

/** Whether a draft can be saved: the same rules the action and the API apply. */
export function draftProblem(draft: Draft): "title" | "technologies" | "repoUrl" | null {
  const title = draft.title.trim();
  if (title.length < 1 || [...title].length > PROJECT_LIMITS.title.max) return "title";
  if (splitTechnologies(draft.technologies).length > PROJECT_LIMITS.technologies)
    return "technologies";
  try {
    const u = new URL(draft.repoUrl.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return "repoUrl";
  } catch {
    return "repoUrl";
  }
  return null;
}

/**
 * The second step: the draft each repository will become, editable, and removable. Saving is
 * one request for all of them; nothing here is sent until the user presses Save.
 */
export const ImportReview: FC<{
  repos: GithubRepo[];
  drafts: Record<number, Draft>;
  onChange: (repoId: number, patch: Partial<Draft>) => void;
  onRemove: (repo: GithubRepo) => void;
  failure: string | null;
}> = ({ repos, drafts, onChange, onRemove, failure }) => {
  const { t } = useLanguage();
  const text = t.integrations.import;

  if (repos.length === 0) return <Alert severity="info">{text.nothingLeft}</Alert>;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {text.reviewHelp}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {text.descriptionNote}
      </Typography>
      {failure && (
        <Alert severity="error" role="alert">
          {failure}
        </Alert>
      )}
      {repos.map((repo) => {
        const draft = drafts[repo.repoId];
        if (!draft) return null;
        const problem = draftProblem(draft);
        return (
          <Box
            key={repo.repoId}
            component="section"
            aria-labelledby={`review-${repo.repoId}`}
            sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography id={`review-${repo.repoId}`} component="h3" variant="subtitle1">
                {repo.fullName}
              </Typography>
              <IconButton
                aria-label={text.remove.replace("{name}", repoName(repo))}
                onClick={() => onRemove(repo)}
              >
                <DeleteOutline />
              </IconButton>
            </Stack>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField
                label={text.fieldTitle}
                value={draft.title}
                onChange={(e) => onChange(repo.repoId, { title: e.target.value })}
                required
                size="small"
                error={problem === "title"}
                fullWidth
              />
              <TextField
                label={text.fieldSummary}
                value={draft.summary}
                onChange={(e) => onChange(repo.repoId, { summary: e.target.value })}
                size="small"
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label={text.fieldTechnologies}
                helperText={text.fieldTechnologiesHint}
                value={draft.technologies}
                onChange={(e) => onChange(repo.repoId, { technologies: e.target.value })}
                size="small"
                error={problem === "technologies"}
                fullWidth
              />
              <TextField
                label={text.fieldRepoUrl}
                value={draft.repoUrl}
                onChange={(e) => onChange(repo.repoId, { repoUrl: e.target.value })}
                size="small"
                type="url"
                error={problem === "repoUrl"}
                fullWidth
              />
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};
