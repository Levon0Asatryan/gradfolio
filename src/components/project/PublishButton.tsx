"use client";

import { type FC, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  Snackbar,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { setDraftStateAction } from "@/lib/projects/actions";

type Failure = { code: string; reasons?: Array<{ path: string; message: string }> };

/**
 * Publish a draft (or move a published project back to drafts) without opening the edit form.
 * The dialog says who can see the project afterwards before anything is sent; if the API
 * refuses, it stays open with the API's own reasons and an "Edit project" link. The button is
 * presentation: the API decides ownership (404 for anyone else's project).
 */
export const PublishButton: FC<{
  projectId: string;
  title: string;
  /** Whether the project is public: a published public project is visible to everyone. */
  isPublic: boolean;
  /** Default: publish a draft. `"draft"`: move a published project back to drafts. */
  mode?: "publish" | "draft";
  label?: string;
  variant?: "contained" | "outlined" | "text";
  size?: "small" | "medium";
  /** Called once the API has changed the project. */
  onDone?: (state: { isDraft: boolean }) => void;
}> = ({
  projectId,
  title,
  isPublic,
  mode = "publish",
  label,
  variant = "contained",
  size,
  onDone,
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  const text = t.projects.publish;
  const toDraft = mode === "draft";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);

  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const result = await setDraftStateAction({ id: projectId, draft: toDraft });
      if (!result.ok) {
        setFailure({ code: result.code, reasons: result.reasons });
        return;
      }
      setOpen(false);
      onDone?.({ isDraft: result.isDraft });
      setDone(toDraft ? text.doneDraft : text.done);
      router.refresh();
    } catch {
      setFailure({ code: "UNKNOWN" });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const known = failure
    ? ((text.errors as Record<string, string>)[failure.code] ?? text.errors.UNKNOWN)
    : null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => {
          setFailure(null);
          setOpen(true);
        }}
      >
        {label ?? (toDraft ? text.toDraft : text.publish)}
      </Button>

      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby={`publish-${projectId}-title`}
        aria-describedby={`publish-${projectId}-body`}
        // `autoFocus` is lost while the dialog fades in (its content is `visibility: hidden`).
        slotProps={{ transition: { onEntered: () => cancel.current?.focus() } }}
      >
        <DialogTitle id={`publish-${projectId}-title`}>
          {(toDraft ? text.draftTitle : text.title).replace("{name}", title)}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id={`publish-${projectId}-body`}>
            {toDraft ? text.draftBody : isPublic ? text.bodyPublic : text.bodyPrivate}
          </DialogContentText>
          {failure && known && (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">{text.refusedTitle}</Typography>
              <Typography variant="body2">{known}</Typography>
              {failure.reasons && (
                <>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {text.reasons}
                  </Typography>
                  <List dense disablePadding sx={{ listStyle: "disc", pl: 2 }}>
                    {failure.reasons.map((r, i) => (
                      <ListItem key={i} disableGutters sx={{ display: "list-item", py: 0 }}>
                        {r.path ? `${r.path}: ` : ""}
                        {r.message}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap" }}>
          <Button ref={cancel} color="inherit" onClick={() => setOpen(false)} disabled={busy}>
            {text.cancel}
          </Button>
          {failure && (
            <Button component={Link} href={`/projects/${projectId}/edit`}>
              {text.edit}
            </Button>
          )}
          <Button variant="contained" onClick={() => void confirm()} disabled={busy}>
            {busy ? text.working : toDraft ? text.confirmDraft : text.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={done !== null}
        autoHideDuration={5000}
        onClose={() => setDone(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setDone(null)} closeText={text.close}>
          {done}
        </Alert>
      </Snackbar>
    </>
  );
};
