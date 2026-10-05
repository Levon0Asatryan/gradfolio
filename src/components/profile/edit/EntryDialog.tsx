"use client";

import { FC, FormEvent, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
} from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { saveEntryAction } from "@/lib/profile/actions";
import type { FieldError } from "@/lib/profile/headerPatch";
import { FIELDS, parseEntry, type FieldSpec, type Section } from "@/lib/profile/sections";
import { fieldErrorText } from "../fieldErrorText";
import { failureText, type Failure } from "./failureText";

export type EntryValues = Record<string, unknown>;

const toText = (spec: FieldSpec, value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (spec.kind === "lines") return Array.isArray(value) ? value.join("\n") : "";
  return String(value);
};

/**
 * Add or change one entry. Nothing half-filled is sent (`parseEntry` runs here and
 * again in the server action); a failed save keeps the dialog and the typed text.
 */
export const EntryDialog: FC<{
  section: Section;
  /** The entry being changed, or null to add one. */
  entry: (EntryValues & { id: string }) | null;
  onClose: () => void;
  onSaved: () => void;
  /** The data behind the dialog is out of date; reload it. */
  onStale: () => void;
}> = ({ section, entry, onClose, onSaved, onStale }) => {
  const { t } = useLanguage();
  const labels = t.sectionEdit.fields[section] as Record<string, string>;
  const specs: readonly FieldSpec[] = FIELDS[section];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(specs.map((s) => [s.key, toText(s, entry?.[s.key])])),
  );
  const [errors, setErrors] = useState<Partial<Record<string, FieldError>>>({});
  const [failure, setFailure] = useState<Failure | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setFailure(null);
    const input = Object.fromEntries(
      specs.map((s) => [
        s.key,
        s.kind === "lines" ? (values[s.key] ?? "").split("\n") : (values[s.key] ?? ""),
      ]),
    );
    const checked = parseEntry(section, input, "create");
    if (!checked.ok) return setErrors(checked.errors);
    setErrors({});
    setSaving(true);
    try {
      const result = await saveEntryAction(section, entry?.id ?? null, input);
      if (result.ok) return onSaved();
      if (result.fields) setErrors(result.fields);
      const f = failureText(t, result.code);
      setFailure(f);
      if (f.reload) onStale();
    } catch {
      setFailure(failureText(t, "UNKNOWN"));
    } finally {
      setSaving(false);
    }
  }

  const title = `${entry ? t.sectionEdit.edit : t.sectionEdit.add}: ${t.profile[section]}`;

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="entry-title"
    >
      <form onSubmit={submit} noValidate>
        <DialogTitle id="entry-title">{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {failure && (
              <Alert severity="error">
                {failure.text}
                {failure.signIn && (
                  <>
                    {" "}
                    <Link href="/auth/login?returnTo=/profile">{t.common.login}</Link>
                  </>
                )}
              </Alert>
            )}
            {specs.map((spec) => {
              const error = errors[spec.key];
              return (
                <TextField
                  key={spec.key}
                  label={labels[spec.key]}
                  value={values[spec.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [spec.key]: e.target.value }))}
                  required={spec.required}
                  multiline={spec.kind === "multiline" || spec.kind === "lines"}
                  minRows={spec.kind === "lines" || spec.kind === "multiline" ? 2 : undefined}
                  type={spec.kind === "url" ? "url" : "text"}
                  error={Boolean(error)}
                  helperText={error ? fieldErrorText(t, error) : undefined}
                  size="small"
                  fullWidth
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={saving}>
            {t.sectionEdit.cancel}
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? t.sectionEdit.saving : t.sectionEdit.save}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
