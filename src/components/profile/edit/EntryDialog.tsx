"use client";

import { FC, FormEvent, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
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
import {
  FIELDS,
  YEAR_MAX,
  YEAR_MIN,
  parseEntry,
  type FieldSpec,
  type Section,
} from "@/lib/profile/sections";
import { counterText, fieldErrorText } from "../fieldErrorText";
import { measure } from "@/lib/profile/limits";
import { ChipListField } from "./ChipListField";
import { MonthField } from "./MonthField";
import { yearInputProps } from "./yearInput";
import { failureText, type Failure } from "./failureText";

/** The nullable end of a range, and the checkbox that says it is still going. */
const CURRENT: Record<string, "stillStudying" | "currentJob"> = {
  endYear: "stillStudying",
  end: "currentJob",
};

export type EntryValues = Record<string, unknown>;

const toText = (spec: FieldSpec, value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (spec.kind === "lines" || spec.kind === "chips") {
    return Array.isArray(value) ? value.join("\n") : "";
  }
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
  // "Still studying" / "currently work here": checked when the stored end is null.
  const [ongoing, setOngoing] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      Object.keys(CURRENT).map((key) => [key, entry !== null && entry[key] === null]),
    ),
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
        s.kind === "lines" || s.kind === "chips"
          ? (values[s.key] ?? "").split("\n")
          : (values[s.key] ?? ""),
      ]),
    );
    const checked = parseEntry(section, input, "create");
    if (!checked.ok) return setErrors(checked.errors);
    setErrors({});
    setSaving(true);
    try {
      const result = await saveEntryAction(section, entry?.id ?? null, checked.body);
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
              const label = labels[spec.key] ?? spec.key;
              const set = (v: string) => setValues((cur) => ({ ...cur, [spec.key]: v }));
              const value = values[spec.key] ?? "";
              const errorText = error ? fieldErrorText(t, error, spec.limit) : undefined;
              const current = CURRENT[spec.key];
              const isCurrent = current !== undefined && ongoing[spec.key] === true;

              const toggle = current && (
                <FormControlLabel
                  key={`${spec.key}-current`}
                  control={
                    <Checkbox
                      checked={isCurrent}
                      onChange={(e) => {
                        setOngoing((o) => ({ ...o, [spec.key]: e.target.checked }));
                        if (e.target.checked) set("");
                      }}
                    />
                  }
                  label={t.sectionEdit[current]}
                />
              );

              if (spec.kind === "month") {
                return (
                  <Stack key={spec.key} spacing={0.5}>
                    <MonthField
                      label={label}
                      value={value}
                      onChange={set}
                      required={spec.required}
                      disabled={isCurrent}
                      error={Boolean(error)}
                      helperText={errorText}
                    />
                    {toggle}
                  </Stack>
                );
              }
              if (spec.kind === "chips") {
                return (
                  <ChipListField
                    key={spec.key}
                    label={label}
                    items={value.split("\n").filter(Boolean)}
                    onChange={(items) => set(items.join("\n"))}
                    error={Boolean(error)}
                    helperText={errorText}
                    maxItems={spec.maxItems}
                  />
                );
              }

              const multi = spec.kind === "multiline" || spec.kind === "lines";
              const counter =
                spec.kind === "multiline" && spec.limit
                  ? counterText(t, measure(value, spec.limit), spec.limit)
                  : undefined;
              const field = (
                <TextField
                  key={spec.key}
                  label={label}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  required={spec.required}
                  disabled={isCurrent}
                  multiline={multi}
                  minRows={multi ? 2 : undefined}
                  type={spec.kind === "url" ? "url" : spec.kind === "year" ? "number" : "text"}
                  placeholder={spec.kind === "url" ? "https://" : undefined}
                  autoComplete={spec.kind === "url" ? "url" : "off"}
                  error={Boolean(error)}
                  helperText={errorText ?? counter}
                  size="small"
                  fullWidth
                  slotProps={
                    spec.kind === "year"
                      ? { htmlInput: yearInputProps(YEAR_MIN, YEAR_MAX) }
                      : undefined
                  }
                />
              );
              return toggle ? (
                <Stack key={spec.key} spacing={0.5}>
                  {field}
                  {toggle}
                </Stack>
              ) : (
                field
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
