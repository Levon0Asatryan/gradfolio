"use client";

import Link from "next/link";
import { type FC, useState } from "react";
import { Alert, Link as MuiLink, List, ListItem, Stack, Typography } from "@mui/material";
import { PublishButton } from "@/components/project/PublishButton";
import { PublishStatus, usePublishStatus } from "@/components/project/PublishStatus";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { GithubImportOutcome } from "@/lib/api/types";

/** What the import did, per repository. Created ones are drafts: the page says where to publish. */
export const ImportResult: FC<{
  results: GithubImportOutcome[];
  names: Record<number, string>;
}> = ({ results, names }) => {
  const { t } = useLanguage();
  const text = t.integrations.import;
  const created = results.filter((r) => r.outcome === "created");
  const exists = results.filter((r) => r.outcome === "exists");
  const skipped = results.filter((r) => r.outcome === "skipped");
  return (
    <Stack spacing={2}>
      {created.length > 0 && (
        <Alert severity="success">
          <Typography>{text.created.replace("{count}", String(created.length))}</Typography>
          <Typography variant="body2">{text.createdHelp}</Typography>
        </Alert>
      )}
      {exists.length > 0 && (
        <Alert severity="info">{text.exists.replace("{count}", String(exists.length))}</Alert>
      )}
      {skipped.length > 0 && (
        <Alert severity="warning" role="alert">
          {text.skipped.replace("{count}", String(skipped.length))}
        </Alert>
      )}
      <List disablePadding aria-label={text.resultTitle}>
        {results.map((r) => (
          <ListItem key={r.repoId} disableGutters sx={{ display: "block" }}>
            <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
              {names[r.repoId] ?? r.repoId}
            </Typography>
            {r.outcome === "skipped" && r.reason && (
              <Typography variant="body2">{text.reasons[r.reason]}</Typography>
            )}
            {r.notes.map((n) => (
              <Typography key={n} variant="body2">
                {text.notes[n]}
              </Typography>
            ))}
            {r.projectId && r.outcome !== "skipped" && (
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <MuiLink component={Link} href={`/projects/${r.projectId}/edit`} variant="body2">
                  {text.editDraft}
                </MuiLink>
                {r.outcome === "created" && (
                  <PublishNow projectId={r.projectId} title={names[r.repoId] ?? ""} />
                )}
              </Stack>
            )}
          </ListItem>
        ))}
      </List>
    </Stack>
  );
};

/**
 * Publish now for one created project. Once published the button is gone, so the row keeps a
 * status line (announced, and holding the focus the button had) instead of offering it again.
 */
const PublishNow: FC<{ projectId: string; title: string }> = ({ projectId, title }) => {
  const { t } = useLanguage();
  const publishStatus = usePublishStatus();
  const [published, setPublished] = useState(false);
  return (
    <>
      {!published && (
        // GitHub imports are of public repositories, so a published one is public.
        <PublishButton
          projectId={projectId}
          title={title}
          isPublic
          label={t.projects.publish.publishNow}
          variant="text"
          size="small"
          onDone={(state) => {
            publishStatus.onDone(state);
            setPublished(true);
          }}
        />
      )}
      <PublishStatus text={publishStatus.status} lineRef={publishStatus.line} />
    </>
  );
};
