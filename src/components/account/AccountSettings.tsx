"use client";

import { FC, FormEvent, useState } from "react";
import {
  Alert,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
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
    <Stack spacing={2} component="section" aria-label={text.settings}>
      <Typography variant="h6" component="h2">
        {text.settings}
      </Typography>

      {message?.kind === "error" && <Alert severity="error">{text[message.key]}</Alert>}
      {message?.kind === "saved" && (
        <Alert severity="success" role="status">
          {text.saved}
        </Alert>
      )}

      <Stack>
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              disabled={busy !== null}
              onChange={(e) => void toggle(e.target.checked)}
            />
          }
          label={text.publicProfile}
        />
        <Typography variant="body2" color="text.secondary">
          {isPublic ? text.publicProfileOn : text.publicProfileOff}
        </Typography>
      </Stack>

      <Stack component="form" onSubmit={saveEmail} noValidate spacing={1}>
        <TextField
          label={text.contactEmail}
          type="email"
          size="small"
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
    </Stack>
  );
};
