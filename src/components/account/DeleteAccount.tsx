"use client";

import { FC, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { AccountCard } from "./AccountCard";

/**
 * Delete the account (3.9). Needs an explicit "I understand", and signs the user
 * out right after the API says yes: the login outlives the account, and a token
 * that is still valid would create a new empty one on its next request.
 */
export const DeleteAccount: FC = () => {
  const { t } = useLanguage();
  const text = t.deleteAccount;
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setOpen(false);
    setUnderstood(false);
    setFailed(null);
  }

  async function remove() {
    if (busy || !understood) return;
    setBusy(true);
    setFailed(null);
    try {
      // A same-origin request that renders nothing: a server action would re-render this page,
      // and `GET /v1/me` on a token that is still valid creates a new empty account.
      const response = await fetch("/api/account", { method: "DELETE", cache: "no-store" });
      if (response.ok) {
        // Sign out at once. `replace`, so Back does not return to a page of a deleted account;
        // a plain navigation, as /auth/* is the SDK's and not a Next route. The dialog stays
        // busy: nothing else may run now.
        window.location.replace("/auth/logout");
        return;
      }
      const body: unknown = await response.json().catch(() => null);
      const code = (body as { code?: unknown } | null)?.code;
      setFailed(typeof code === "string" ? code : "UNKNOWN_ERROR");
    } catch {
      setFailed("UNKNOWN_ERROR");
    }
    setBusy(false);
  }

  return (
    <AccountCard className="span-all" title={text.title} help={text.body} color="error">
      <div>
        <Button color="error" variant="outlined" onClick={() => setOpen(true)}>
          {text.open}
        </Button>
      </div>

      <Dialog open={open} onClose={close} aria-labelledby="delete-account-title">
        <DialogTitle id="delete-account-title">{text.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{text.body}</DialogContentText>
          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
            }
            label={text.understand}
          />
          {failed && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {failed === "GITHUB_REVOKE_FAILED" ? text.errorGithub : text.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={busy}>
            {t.sectionEdit.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void remove()}
            disabled={busy || !understood}
          >
            {text.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </AccountCard>
  );
};
