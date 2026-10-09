"use client";

import { FC, FormEvent, useState } from "react";
import { Alert, Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Dictionary } from "@/data/locales/types";
import type { ProfileLinks } from "@/lib/api/types";
import { updateProfileAction } from "@/lib/profile/actions";
import { useUnsavedGuard } from "@/lib/profile/useUnsavedGuard";
import { UploadControl } from "@/components/uploads/UploadControl";
import { signUploadAction } from "@/lib/uploads/actions";
import { counterText, fieldErrorText } from "./fieldErrorText";
import { LIMITS, measure, type Limit } from "@/lib/profile/limits";
import { parseHeaderPatch, type FieldError } from "@/lib/profile/headerPatch";

export interface HeaderValues {
  name: string;
  headline: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  contactEmail: string | null;
  links: ProfileLinks;
}

type FormText = Dictionary["profileEdit"];
type LinkKey = keyof ProfileLinks;
const LINK_KEYS: LinkKey[] = ["github", "linkedin", "twitter", "website"];

/** What the form shows for a failed save: the API's code is the contract. */
function failureText(code: string): keyof FormText {
  if (code === "UNAUTHENTICATED") return "errorSignInAgain";
  if (code === "VALIDATION_FAILED") return "errorValidation";
  return "errorSave";
}

const toForm = (v: HeaderValues) => ({
  name: v.name,
  headline: v.headline,
  bio: v.bio ?? "",
  location: v.location ?? "",
  avatarUrl: v.avatarUrl ?? "",
  contactEmail: v.contactEmail ?? "",
  links: {
    github: v.links.github ?? "",
    linkedin: v.links.linkedin ?? "",
    twitter: v.links.twitter ?? "",
    website: v.links.website ?? "",
  },
});

/**
 * The owner's header editor. Saves through a server action (the API call and
 * the token stay on the server) and leaves only after the API said yes: a failed
 * save keeps the form and the typed values.
 */
export const ProfileHeaderForm: FC<{
  initial: HeaderValues;
  onSaved: () => void;
  onCancel: () => void;
}> = ({ initial, onSaved, onCancel }) => {
  const { t } = useLanguage();
  const text = t.profileEdit;
  const start = toForm(initial);
  const [values, setValues] = useState(start);
  const [errors, setErrors] = useState<Partial<Record<string, FieldError>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(start);
  useUnsavedGuard(dirty, text.leavePrompt);

  const set = (key: Exclude<keyof typeof values, "links">) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setLink = (key: LinkKey) => (value: string) =>
    setValues((v) => ({ ...v, links: { ...v.links, [key]: value } }));

  const fieldError = (key: string, limit?: Limit) => {
    const e = errors[key];
    return e ? fieldErrorText(t, e, limit) : undefined;
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving || uploading) return;
    setFailure(null);
    const checked = parseHeaderPatch(values);
    if (!checked.ok) {
      setErrors(checked.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const result = await updateProfileAction(values);
      if (result.ok) return onSaved();
      if (result.fields) setErrors(result.fields);
      setFailure(failureText(result.code));
    } catch {
      setFailure("errorSave");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: Exclude<keyof typeof values, "links">, label: string, extra = {}) => {
    const limit = LIMITS[key];
    return (
      <TextField
        label={label}
        value={values[key]}
        onChange={(e) => set(key)(e.target.value)}
        error={Boolean(errors[key])}
        // Long text shows how much of the column is used (the API's real limit).
        helperText={
          fieldError(key, limit) ??
          (key === "bio" ? counterText(t, measure(values[key], limit), limit) : undefined)
        }
        required={key === "name"}
        size="small"
        fullWidth
        {...extra}
      />
    );
  };

  return (
    <Box component="form" onSubmit={submit} noValidate sx={{ mb: 3 }} aria-label={text.title}>
      <Typography variant="h6" component="h1" sx={{ mb: 2 }}>
        {text.title}
      </Typography>
      <Stack spacing={2}>
        {failure && (
          <Alert severity="error">
            {text[failure as keyof FormText]}
            {failure === "errorSignInAgain" && (
              <>
                {" "}
                <Link href="/auth/login?returnTo=/profile">{t.common.login}</Link>
              </>
            )}
          </Alert>
        )}
        {field("name", text.name, { autoComplete: "name" })}
        {field("headline", text.headline, { autoComplete: "organization-title" })}
        {field("bio", text.bio, { multiline: true, minRows: 3 })}
        {field("location", text.location, { autoComplete: "address-level2" })}
        {field("avatarUrl", text.avatarUrl, {
          type: "url",
          autoComplete: "photo",
          placeholder: "https://",
        })}
        {field("contactEmail", text.contactEmail, { type: "email", autoComplete: "email" })}
        <UploadControl
          kind="image"
          sign={(req) => signUploadAction({ ...req, purpose: "avatar" })}
          onUploaded={(fileUrl) => set("avatarUrl")(fileUrl)}
          onBusyChange={setUploading}
        />
        {LINK_KEYS.map((key) => (
          <TextField
            key={key}
            label={text[key]}
            value={values.links[key] ?? ""}
            onChange={(e) => setLink(key)(e.target.value)}
            error={Boolean(errors[`links.${key}`])}
            helperText={fieldError(`links.${key}`, LIMITS.link)}
            type="url"
            autoComplete="url"
            placeholder="https://"
            size="small"
            fullWidth
          />
        ))}
        {dirty && (
          <Typography variant="body2" color="text.secondary" role="status">
            {text.unsaved}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={saving || uploading}>
            {saving ? text.saving : text.save}
          </Button>
          <Button type="button" onClick={onCancel} disabled={saving}>
            {text.cancel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
