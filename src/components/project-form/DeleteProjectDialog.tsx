"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { deleteProjectAction } from "@/lib/projects/actions";

/** The button and the confirmation. The dialog names the project and cannot be confirmed by accident: Cancel has the focus. */
export const DeleteProjectDialog: FC<{
  projectId: string;
  name: string;
  onDeleted: () => void;
}> = ({ projectId, name, onDeleted }) => {
  const { t } = useLanguage();
  const text = t.projects.form;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const result = await deleteProjectAction(projectId);
      if (result.ok || result.code === "NOT_FOUND") {
        onDeleted();
        router.push("/projects?flash=deleted");
        return;
      }
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button color="error" variant="outlined" onClick={() => setOpen(true)}>
        {text.deleteButton}
      </Button>
      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        aria-labelledby="delete-project-title"
        aria-describedby="delete-project-body"
      >
        <DialogTitle id="delete-project-title">
          {text.deleteTitle.replace("{name}", name)}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-project-body">{text.deleteBody}</DialogContentText>
          {failed && (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              {text.deleteFailed}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setOpen(false)} disabled={busy}>
            {text.cancel}
          </Button>
          <Button color="error" variant="contained" onClick={confirm} disabled={busy}>
            {busy ? text.deleting : text.deleteConfirm}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
