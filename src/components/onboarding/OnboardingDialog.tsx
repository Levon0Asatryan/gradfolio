"use client";

import { FC, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { completeOnboardingAction } from "@/lib/profile/actions";

/**
 * First-login onboarding. Every way out (set up, connect, skip, Escape) records
 * that onboarding is done, so it is not offered again; a failed save keeps the
 * dialog open and says so instead of pretending.
 */
export const OnboardingDialog: FC = () => {
  const { t } = useLanguage();
  const text = t.onboarding;
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function finish(next?: string) {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const result = await completeOnboardingAction();
      if (!result.ok) return setFailed(true);
      setOpen(false);
      if (next) router.push(next);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => void finish()} aria-labelledby="onboarding-title">
      <DialogTitle id="onboarding-title">{text.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text.body}</DialogContentText>
        {failed && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {text.error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => void finish()} disabled={busy}>
          {text.skip}
        </Button>
        <Button onClick={() => void finish("/integrations/connections")} disabled={busy}>
          {text.connectAccounts}
        </Button>
        <Button variant="contained" onClick={() => void finish("/profile")} disabled={busy}>
          {text.setupProfile}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
