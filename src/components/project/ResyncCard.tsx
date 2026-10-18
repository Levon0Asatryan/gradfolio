"use client";

import { type FC, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  Link,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { GithubSyncResult } from "@/lib/api/types";
import { errorCode } from "@/lib/integrations/errors";
import { syncProjectAction } from "@/lib/integrations/importActions";

type Field = GithubSyncResult["fields"][number];

const shown = (value: Field["githubValue"]): string =>
  Array.isArray(value) ? value.join(", ") : (value ?? "");

/**
 * The owner's re-sync: a dry run first, so the user sees what would change, then Apply.
 * A field the user edited is never overwritten: GitHub's newer value only appears as a
 * conflict, read-only. Shown only on a GitHub-imported project of the owner; the API decides
 * ownership (404 for anyone else), so the card is presentation, not the guard.
 */
export const ResyncCard: FC<{ projectId: string; repoUrl: string | null }> = ({
  projectId,
  repoUrl,
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  const text = t.integrations.resync;
  const [busy, setBusy] = useState<"check" | "apply" | null>(null);
  const [result, setResult] = useState<GithubSyncResult | null>(null);
  const [applied, setApplied] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const lock = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);

  async function run(dryRun: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(dryRun ? "check" : "apply");
    setFailure(null);
    try {
      const response = await syncProjectAction({ projectId, dryRun });
      if (!response.ok) {
        setFailure(t.integrations.errors[errorCode(response.code)]);
        return;
      }
      setResult(response.result);
      if (!dryRun) {
        setApplied(true);
        router.refresh();
      } else {
        setApplied(false);
      }
    } catch {
      setFailure(t.integrations.errors.UNKNOWN);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }

  const changes = result?.fields.filter((f) => f.outcome === "updated").length ?? 0;
  const facts = result?.systemUpdated.length ?? 0;
  const nothing =
    result !== null &&
    changes === 0 &&
    facts === 0 &&
    !result.fields.some((f) => f.outcome === "conflict" || f.outcome === "kept");

  return (
    <Card component="section" aria-labelledby="resync-title">
      <CardContent>
        <Typography id="resync-title" component="h2" variant="h6" gutterBottom>
          {text.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {text.editedKept}
          {repoUrl && (
            <>
              {" "}
              <Link href={repoUrl} target="_blank" rel="noopener noreferrer" underline="always">
                {repoUrl.replace(/^https?:\/\//, "")}
              </Link>
            </>
          )}
        </Typography>
        {failure && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }}>
            {failure}
          </Alert>
        )}
        <Button
          ref={trigger}
          variant="outlined"
          disabled={busy !== null}
          onClick={() => void run(true)}
        >
          {busy === "check" ? text.checking : text.check}
        </Button>
      </CardContent>

      <Dialog
        open={result !== null}
        onClose={() => busy === null && setResult(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="resync-dialog-title"
      >
        <DialogTitle id="resync-dialog-title">{text.title}</DialogTitle>
        <DialogContent dividers>
          {applied && <Alert severity="success">{text.done}</Alert>}
          {!applied && nothing && <Alert severity="info">{text.nothing}</Alert>}
          <List disablePadding aria-label={text.title}>
            {result?.fields.map((f) => (
              <ListItem key={f.field} disableGutters sx={{ display: "block" }}>
                <Stack direction="row" justifyContent="space-between" gap={2} flexWrap="wrap">
                  <Typography sx={{ fontWeight: 700 }}>{text.fields[f.field]}</Typography>
                  <Typography variant="body2">
                    {applied && f.outcome === "updated"
                      ? text.outcomes.updated
                      : text.outcomes[f.outcome]}
                  </Typography>
                </Stack>
                {f.outcome === "conflict" && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {text.githubValue}
                    </Typography>
                    {/* GitHub's text as text, never as HTML. */}
                    <Typography
                      variant="body2"
                      sx={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
                    >
                      {shown(f.githubValue).slice(0, 500)}
                    </Typography>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
          {result && result.systemUpdated.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">{text.systemTitle}</Typography>
              <List disablePadding>
                {result.systemUpdated.map((s) => (
                  <ListItem key={s.field} disableGutters>
                    <Typography variant="body2">
                      {text.system[s.field]}: {String(s.value ?? "")}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {failure && (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              {failure}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setResult(null)} disabled={busy !== null}>
            {text.close}
          </Button>
          {!applied && (changes > 0 || facts > 0) && (
            <Button variant="contained" disabled={busy !== null} onClick={() => void run(false)}>
              {busy === "apply" ? text.applying : text.apply}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
};
