"use client";

import { type FC, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { disconnectGithubAction, startGithubConnectAction } from "@/lib/integrations/actions";
import { errorCode } from "@/lib/integrations/errors";
import type { Integrations } from "@/lib/api/types";
import { GithubImportModal } from "@/components/github-import/GithubImportModal";
import IntegrationCard from "./IntegrationCard";

type Problem = { code: string; retryAfter?: number };

/**
 * The GitHub card: status, connect, and disconnect behind a confirmation.
 *
 * Honesty rules (API plan 2.3):
 * - A disconnect that fails with `GITHUB_REVOKE_FAILED` is **ambiguous**: GitHub may or may
 *   not have removed access. The page is refreshed at once so the card shows the API's
 *   current state, and the notice says so; it never says "nothing changed".
 * - `GITHUB_LINK_IN_PROGRESS` means a change is still finishing: the card shows the state so
 *   far, and the notice says to try again shortly.
 */
export const GithubCard: FC<{
  github: Integrations["github"];
  /** The page this card is on, so GitHub sends the user back to it. */
  returnTo?: "integrations" | "connections";
}> = ({ github, returnTo = "integrations" }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const text = t.integrations;
  const [busy, setBusy] = useState<"connect" | "disconnect" | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  // State updates land after the click handler returns, so a fast double click would pass a
  // `busy` check twice. The ref closes that gap.
  const inflight = useRef(false);
  const connected = github.status === "connected";

  function release() {
    inflight.current = false;
    setBusy(null);
  }

  async function connect() {
    if (inflight.current) return;
    inflight.current = true;
    setBusy("connect");
    setProblem(null);
    try {
      const result = await startGithubConnectAction(returnTo);
      if (!result.ok) {
        setProblem({ code: result.code, retryAfter: result.retryAfter });
        release();
        return;
      }
      if (result.state === "connected") {
        setToast(text.github.connectedToast);
        release();
        router.refresh();
        return;
      }
      // The URL was built on the server from this deployment's own Auth0 domain; only the
      // nonce in its query string came from the API. Still, only https is ever followed.
      if (new URL(result.url).protocol !== "https:") throw new Error("scheme");
      window.location.assign(result.url);
      // The page unloads; the button stays busy until it does.
    } catch {
      setProblem({ code: "UNKNOWN" });
      release();
    }
  }

  async function disconnect() {
    if (inflight.current) return;
    inflight.current = true;
    setBusy("disconnect");
    setProblem(null);
    try {
      const result = await disconnectGithubAction();
      setConfirming(false);
      if (result.ok) setToast(text.github.disconnectedToast);
      else setProblem({ code: result.code, retryAfter: result.retryAfter });
    } catch {
      setConfirming(false);
      setProblem({ code: "UNKNOWN" });
    } finally {
      release();
      // Whatever happened, show what the API says now: after an ambiguous revocation the
      // card may already read "not connected".
      router.refresh();
    }
  }

  const message = problem ? text.errors[errorCode(problem.code)] : null;
  const unsettled = problem?.code === "GITHUB_REVOKE_FAILED";

  return (
    <>
      <IntegrationCard
        id="github"
        name="GitHub"
        description={text.github.description}
        connected={connected}
        syncLabel={connected ? text.lastSynced : undefined}
        syncedAt={github.lastSyncedAt}
        neverText={text.neverSynced}
        detail={
          connected && github.login ? (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {text.github.connectedAs.replace("{login}", github.login)}
            </Typography>
          ) : !github.available ? (
            <Typography variant="body2" color="text.secondary">
              {text.github.unavailable}
            </Typography>
          ) : undefined
        }
        notice={
          problem && message ? (
            <Alert
              severity={unsettled ? "warning" : "error"}
              role="alert"
              onClose={() => setProblem(null)}
              closeText={text.dismiss}
              action={
                unsettled ? (
                  <Button color="inherit" size="small" onClick={() => router.refresh()}>
                    {text.checkStatus}
                  </Button>
                ) : undefined
              }
            >
              {message}
              {problem.retryAfter !== undefined &&
                ` ${text.retryIn.replace("{seconds}", String(problem.retryAfter))}`}
            </Alert>
          ) : undefined
        }
      >
        {connected && (
          <Button variant="contained" onClick={() => setImporting(true)}>
            {text.importButton}
          </Button>
        )}
        {connected ? (
          <Button
            variant="outlined"
            color="inherit"
            disabled={busy !== null}
            onClick={() => setConfirming(true)}
          >
            {text.disconnect}
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={busy !== null || !github.available}
            onClick={() => void connect()}
            startIcon={busy === "connect" ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {busy === "connect" ? text.github.opening : text.connect}
          </Button>
        )}
      </IntegrationCard>

      <GithubImportModal open={importing} onClose={() => setImporting(false)} />

      <Dialog
        open={confirming}
        onClose={() => busy === null && setConfirming(false)}
        aria-labelledby="disconnect-github-title"
        aria-describedby="disconnect-github-body"
        fullWidth
        maxWidth="xs"
        // `autoFocus` is lost while the dialog fades in (its content is `visibility: hidden`).
        slotProps={{ transition: { onEntered: () => cancel.current?.focus() } }}
      >
        <DialogTitle id="disconnect-github-title">
          {text.dialog.disconnectTitle.replace("{name}", "GitHub")}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="disconnect-github-body">
            {text.dialog.disconnectBody}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            ref={cancel}
            color="inherit"
            disabled={busy !== null}
            onClick={() => setConfirming(false)}
          >
            {text.dialog.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy !== null}
            onClick={() => void disconnect()}
          >
            {busy === "disconnect" ? text.github.disconnecting : text.disconnect}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToast(null)} closeText={text.dismiss}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
};
