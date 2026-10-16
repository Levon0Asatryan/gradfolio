"use client";

import { type FC, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Link as MuiLink,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import StarBorder from "@mui/icons-material/StarBorder";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";
import TruncatedText from "@/components/shared/TruncatedText";
import type { GithubRateLimit, GithubRepo } from "@/lib/api/types";
import { IMPORT_MAX } from "@/lib/integrations/importLimits";
import type { Language } from "@/data/locales/types";

const LOCALES: Record<Language, string> = { en: "en-US", ru: "ru-RU", am: "hy-AM" };

/** A time of day in the reader's language; an engine without that locale falls back. */
export function timeOf(iso: string | null | undefined, language: Language): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALES[language], { hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
}

export interface PickerState {
  repos: GithubRepo[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  /** An error code from the last load, else null. */
  error: { code: string; retryAfter?: number } | null;
  rateLimit: GithubRateLimit | null;
  query: string;
}

/**
 * The first step: search, and one checkbox per repository. Every repository starts unselected;
 * an imported one is shown as "Imported" and cannot be selected. A failed load is an error
 * with Retry, never "No public repositories".
 */
export const RepoPicker: FC<{
  state: PickerState;
  selected: Map<number, GithubRepo>;
  onQuery: (q: string) => void;
  onToggle: (repo: GithubRepo) => void;
  onMore: () => void;
  onRetry: () => void;
  errorText: (code: string) => ReactNode;
}> = ({ state, selected, onQuery, onToggle, onMore, onRetry, errorText }) => {
  const { t, language } = useLanguage();
  const text = t.integrations.import;
  const full = selected.size >= IMPORT_MAX;
  const resets = timeOf(state.rateLimit?.resetsAt, language);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {text.intro}
      </Typography>
      <TextField
        type="search"
        label={text.searchLabel}
        value={state.query}
        onChange={(e) => onQuery(e.target.value)}
        size="small"
        fullWidth
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />

      <Typography variant="body2" role="status" aria-live="polite">
        {text.selected
          .replace("{count}", String(selected.size))
          .replace("{max}", String(IMPORT_MAX))}
        {full && ` ${text.maxReached.replace("{max}", String(IMPORT_MAX))}`}
      </Typography>

      {state.rateLimit &&
        state.rateLimit.remaining !== null &&
        state.rateLimit.remaining < 10 &&
        resets && (
          <Alert severity="warning">
            {text.rateLimit
              .replace("{remaining}", String(state.rateLimit.remaining))
              .replace("{time}", resets)}
          </Alert>
        )}

      {state.error && (
        <Alert
          severity="error"
          role="alert"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              {t.integrations.retry}
            </Button>
          }
        >
          {errorText(state.error.code)}
          {state.error.code === "GITHUB_NOT_CONNECTED" && (
            <>
              {" "}
              <MuiLink component={Link} href="/integrations">
                {text.connect}
              </MuiLink>
            </>
          )}
        </Alert>
      )}

      {state.loading && (
        <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3 }}>
          <CircularProgress size={20} />
          <Typography>{text.loading}</Typography>
        </Box>
      )}

      {!state.loading && !state.error && state.repos.length === 0 && (
        <Box sx={{ py: 3 }}>
          <Typography variant="subtitle1">{state.query ? text.noMatches : text.empty}</Typography>
          {!state.query && (
            <Typography variant="body2" color="text.secondary">
              {text.emptyHelp}
            </Typography>
          )}
        </Box>
      )}

      {state.repos.length > 0 && (
        <List disablePadding aria-label={text.title} sx={{ display: "grid", gap: 1 }}>
          {state.repos.map((repo) => {
            const isSelected = selected.has(repo.repoId);
            const disabled = repo.imported || (!isSelected && full);
            const labelId = `repo-${repo.repoId}-name`;
            const descId = `repo-${repo.repoId}-desc`;
            return (
              <ListItem
                key={repo.repoId}
                disablePadding
                sx={{
                  alignItems: "flex-start",
                  gap: 1,
                  p: 1.5,
                  border: 1,
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderRadius: 2,
                }}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => onToggle(repo)}
                  slotProps={{
                    input: { "aria-labelledby": labelId, "aria-describedby": descId },
                  }}
                  sx={{ p: 0.5 }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography id={labelId} sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                      {repo.fullName}
                    </Typography>
                    {repo.imported && (
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {text.imported}
                        {repo.projectId && (
                          <>
                            {" · "}
                            <MuiLink component={Link} href={`/projects/${repo.projectId}`}>
                              {text.openProject}
                            </MuiLink>
                          </>
                        )}
                      </Typography>
                    )}
                  </Stack>
                  <TruncatedText
                    id={descId}
                    text={repo.description ?? text.noDescription}
                    variant="body2"
                    color="text.secondary"
                    lines={2}
                  />
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    {repo.language && <Typography variant="caption">{repo.language}</Typography>}
                    <Typography
                      variant="caption"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                    >
                      <StarBorder sx={{ fontSize: 14 }} aria-hidden />
                      {text.stars.replace("{count}", String(repo.stars))}
                    </Typography>
                  </Stack>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}

      {state.nextCursor && !state.error && (
        <Button
          variant="outlined"
          onClick={onMore}
          disabled={state.loadingMore}
          sx={{ alignSelf: "flex-start" }}
        >
          {state.loadingMore ? text.loading : text.loadMore}
        </Button>
      )}
    </Stack>
  );
};
