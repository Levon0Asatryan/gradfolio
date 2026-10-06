"use client";

import { FC, FormEvent, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { AccountCard } from "./AccountCard";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Dictionary } from "@/data/locales/types";
import { updateProfileAction } from "@/lib/profile/actions";
import { parseHeaderPatch } from "@/lib/profile/headerPatch";

export interface AccountSettingsValues {
  isPublic: boolean;
  contactEmail: string | null;
}

type AccountText = Dictionary["account"];

function failureText(code: string): keyof AccountText {
  if (code === "UNAUTHENTICATED") return "errorSignInAgain";
  if (code === "VALIDATION_FAILED") return "errorValidation";
  return "errorSave";
}

/**
 * Privacy toggle and contact email (3.9). Each saves through the same server
 * action as the profile editor. The switch shows the saved state, not a hope:
 * it flips only after the API said yes (Q3: private = 404 to everyone else).
 */
export const AccountSettings: FC<{ initial: AccountSettingsValues }> = ({ initial }) => {
  const { t } = useLanguage();
  const text = t.account;
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [savedEmail, setSavedEmail] = useState(initial.contactEmail ?? "");
  const [email, setEmail] = useState(savedEmail);
  const [emailError, setEmailError] = useState(false);
  const [busy, setBusy] = useState<"visibility" | "email" | null>(null);
  const [message, setMessage] = useState<
    { kind: "error"; key: keyof AccountText } | { kind: "saved" } | null
  >(null);

  async function send(patch: unknown, which: "visibility" | "email"): Promise<boolean> {
    setBusy(which);
    setMessage(null);
    try {
      const result = await updateProfileAction(patch);
      if (result.ok) {
        setMessage({ kind: "saved" });
        router.refresh();
        return true;
      }
      setMessage({ kind: "error", key: failureText(result.code) });
    } catch {
      setMessage({ kind: "error", key: "errorSave" });
    } finally {
      setBusy(null);
    }
    return false;
  }

  async function toggle(next: boolean) {
    if (await send({ isPublic: next }, "visibility")) setIsPublic(next);
  }

  async function saveEmail(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const checked = parseHeaderPatch({ contactEmail: email });
    if (!checked.ok) return setEmailError(true);
    setEmailError(false);
    if (await send({ contactEmail: email }, "email")) setSavedEmail(email.trim());
  }

  return (
    <>
      {/* A toast, not a block in the grid: a message that appears in the flow pushes the cards around. */}
      <Snackbar
        open={message !== null}
        autoHideDuration={message?.kind === "saved" ? 4000 : null}
        onClose={(_, reason) => reason !== "clickaway" && setMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {message ? (
          <Alert
            severity={message.kind === "saved" ? "success" : "error"}
            variant="filled"
            role={message.kind === "saved" ? "status" : "alert"}
            closeText={t.common.close}
            onClose={() => setMessage(null)}
          >
            {message.kind === "saved" ? text.saved : text[message.key]}
          </Alert>
        ) : undefined}
      </Snackbar>

      <AccountCard title={text.privacy}>
        <Stack spacing={1}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
            sx={{ columnGap: 2, rowGap: 1 }}
          >
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  color="success"
                  checked={isPublic}
                  disabled={busy !== null}
                  onChange={(e) => void toggle(e.target.checked)}
                />
              }
              label={text.publicProfile}
            />
            <Chip
              size="small"
              color={isPublic ? "success" : "default"}
              label={isPublic ? text.statusPublic : text.statusPrivate}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {isPublic ? text.publicProfileOn : text.publicProfileOff}
          </Typography>
        </Stack>
      </AccountCard>

      <AccountCard title={text.contactSection}>
        <Stack component="form" onSubmit={saveEmail} noValidate spacing={2}>
          <TextField
            label={text.contactEmail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            helperText={emailError ? text.errorInvalidEmail : text.contactEmailHelp}
          />
          <div>
            <Button
              type="submit"
              variant="contained"
              disabled={busy !== null || email.trim() === savedEmail}
            >
              {busy === "email" ? text.saving : text.save}
            </Button>
          </div>
        </Stack>
      </AccountCard>
    </>
  );
};
