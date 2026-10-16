"use client";

import { type FC } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { GithubPreviewOutcome, GithubRepo } from "@/lib/api/types";
import { PROJECT_LIMITS } from "@/lib/projects/limits";
import { type Draft, plainText, repoName, splitTechnologies } from "./model";

/** Whether a draft can be saved: the same rules the action and the API apply. */
export function draftProblem(draft: Draft): "title" | "technologies" | null {
  const title = draft.title.trim();
  if (title.length < 1 || [...title].length > PROJECT_LIMITS.title.max) return "title";
  if (splitTechnologies(draft.technologies).length > PROJECT_LIMITS.technologies)
    return "technologies";
  return null;
}

export interface ReviewRow {
  repo: GithubRepo;
  preview: GithubPreviewOutcome | undefined;
}

/**
 * The second step: the draft each repository will become, as the API's preview reads it from
 * GitHub (README sanitized there), editable where the student may change it, removable. Saving
 * is one request for all of them; nothing here is sent until the student presses Save.
 */
export const ImportReview: FC<{
  rows: ReviewRow[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  drafts: Record<number, Draft>;
  onChange: (repoId: number, patch: Partial<Draft>) => void;
  onRemove: (repo: GithubRepo) => void;
  failure: string | null;
}> = ({ rows, loading, loadError, onRetry, drafts, onChange, onRemove, failure }) => {
  const { t } = useLanguage();
  const text = t.integrations.import;

  if (loading) {
    return (
      <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3 }}>
        <CircularProgress size={20} />
        <Typography>{text.previewLoading}</Typography>
      </Box>
    );
  }
  if (loadError) {
    return (
      <Alert
        severity="error"
        role="alert"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t.integrations.retry}
          </Button>
        }
      >
        {loadError}
      </Alert>
    );
  }
  if (rows.length === 0) return <Alert severity="info">{text.nothingLeft}</Alert>;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {text.reviewHelp}
      </Typography>
      {failure && (
        <Alert severity="error" role="alert">
          {failure}
        </Alert>
      )}
      {rows.map(({ repo, preview }) => {
        const heading = (
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
        );
        const frame = (children: React.ReactNode) => (
          <Box
            key={repo.repoId}
            component="section"
            aria-labelledby={`review-${repo.repoId}`}
            sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}
          >
            {heading}
            {children}
          </Box>
        );

        if (!preview || preview.outcome === "exists") {
          return frame(
            <Typography variant="body2">
              {text.imported}
              {preview?.projectId && (
                <>
                  {" · "}
                  <MuiLink component={Link} href={`/projects/${preview.projectId}`}>
                    {text.openProject}
                  </MuiLink>
                </>
              )}
            </Typography>,
          );
        }
        if (preview.outcome === "skipped") {
          return frame(
            <Alert severity="warning" sx={{ mt: 1 }}>
              {preview.reason ? text.reasons[preview.reason] : text.reasons.not_found}
            </Alert>,
          );
        }

        const draft = drafts[repo.repoId];
        const g = preview.draft;
        if (!draft || !g) return null;
        const problem = draftProblem(draft);
        const readme = plainText(g.descriptionHtml);
        return frame(
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
            <Box>
              <Typography variant="caption" color="text.secondary">
                {text.fieldRepoUrl}
              </Typography>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                {g.repoUrl}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {text.readmePreview}
              </Typography>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                {readme || text.noReadme}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {text.descriptionNote}
              </Typography>
            </Box>
            {preview.notes.map((n) => (
              <Alert key={n} severity="info">
                {text.notes[n]}
              </Alert>
            ))}
          </Stack>,
        );
      })}
    </Stack>
  );
};
