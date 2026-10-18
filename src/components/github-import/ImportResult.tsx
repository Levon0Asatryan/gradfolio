"use client";

import Link from "next/link";
import { type FC, useEffect, useRef, useState } from "react";
import { Alert, Link as MuiLink, List, ListItem, Stack, Typography } from "@mui/material";
import { PublishButton } from "@/components/project/PublishButton";
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
  // Rows published from here: the row says so instead of offering Publish again.
  const [published, setPublished] = useState<Set<number>>(new Set());
  // Publishing replaces the row's button (and its dialog) with a status line, so the element
  // that had the focus disappears: the focus moves to that line, which is also announced.
  const [justPublished, setJustPublished] = useState<number | null>(null);
  const statusLines = useRef(new Map<number, HTMLElement>());
  useEffect(() => {
    if (justPublished !== null) statusLines.current.get(justPublished)?.focus();
  }, [justPublished]);

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
                {r.outcome === "created" &&
                  (published.has(r.repoId) ? (
                    <Typography
                      role="status"
                      tabIndex={-1}
                      variant="body2"
                      sx={{ fontWeight: 700 }}
                      ref={(el: HTMLElement | null) => {
                        if (el) statusLines.current.set(r.repoId, el);
                        else statusLines.current.delete(r.repoId);
                      }}
                    >
                      {t.projects.publish.done}
                    </Typography>
                  ) : (
                    // GitHub imports are of public repositories, so a published one is public.
                    <PublishButton
                      projectId={r.projectId}
                      title={names[r.repoId] ?? ""}
                      isPublic
                      label={t.projects.publish.publishNow}
                      variant="text"
                      size="small"
                      onDone={() => {
                        setPublished((prev) => new Set(prev).add(r.repoId));
                        setJustPublished(r.repoId);
                      }}
                    />
                  ))}
              </Stack>
            )}
          </ListItem>
        ))}
      </List>
    </Stack>
  );
};
