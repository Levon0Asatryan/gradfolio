"use client";

import { type FC, type FormEvent, useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { MonthField } from "@/components/profile/edit/MonthField";
import { yearInputProps } from "@/components/profile/edit/yearInput";
import type { SuggestionAcceptOverrides } from "@/lib/api/types";
import { LIMITS, fits } from "@/lib/profile/limits";
import { YEAR_MAX, YEAR_MIN } from "@/lib/profile/sections";

type Errors = Partial<Record<"degree" | "field" | "startYear" | "title" | "start", string>>;

/**
 * What the API needs before it adds an education or experience entry: the student's own values
 * (the suggestion only knows the institution or organisation). Nothing is sent until Submit.
 */
export const OverridesForm: FC<{
  kind: "education.add" | "experience.add";
  busy: boolean;
  /** A refusal from the API, kept next to the fields (the suggestion is still open). */
  error: string | null;
  onSubmit: (overrides: SuggestionAcceptOverrides) => void;
  onCancel: () => void;
  idPrefix: string;
}> = ({ kind, busy, error, onSubmit, onCancel, idPrefix }) => {
  const { t } = useLanguage();
  const f = t.suggestions.form;
  const education = kind === "education.add";
  const [degree, setDegree] = useState("");
  const [field, setField] = useState("");
  const [startYear, setStartYear] = useState("");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const next: Errors = {};
    const text = (value: string, key: "degree" | "field" | "title") => {
      const v = value.trim();
      if (v === "") next[key] = f.required;
      else if (!fits(v, LIMITS[key])) next[key] = f.tooLong;
    };
    if (education) {
      text(degree, "degree");
      text(field, "field");
      const year = Number(startYear);
      if (startYear.trim() === "") next.startYear = f.required;
      else if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX) {
        next.startYear = f.invalidYear;
      }
    } else {
      text(title, "title");
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(start)) {
        next.start = start === "" ? f.required : f.invalidMonth;
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(
      education
        ? { degree: degree.trim(), field: field.trim(), startYear: Number(startYear) }
        : { title: title.trim(), start },
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={submit}
      aria-label={education ? f.educationLabel : f.experienceLabel}
      sx={{ mt: 1.5 }}
    >
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          {f.intro}
        </Typography>
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
        {education ? (
          <>
            <TextField
              id={`${idPrefix}-degree`}
              autoFocus
              size="small"
              required
              label={f.degree}
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              error={Boolean(errors.degree)}
              helperText={errors.degree}
            />
            <TextField
              size="small"
              required
              label={f.field}
              value={field}
              onChange={(e) => setField(e.target.value)}
              error={Boolean(errors.field)}
              helperText={errors.field}
            />
            <TextField
              size="small"
              required
              type="number"
              label={f.startYear}
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              error={Boolean(errors.startYear)}
              helperText={errors.startYear}
              slotProps={{ htmlInput: yearInputProps(YEAR_MIN, YEAR_MAX) }}
              sx={{ maxWidth: 200 }}
            />
          </>
        ) : (
          <>
            <TextField
              id={`${idPrefix}-title`}
              autoFocus
              size="small"
              required
              label={f.jobTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={Boolean(errors.title)}
              helperText={errors.title}
            />
            <MonthField
              label={f.start}
              value={start}
              onChange={setStart}
              required
              error={Boolean(errors.start)}
              helperText={errors.start}
            />
          </>
        )}
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" size="small" aria-disabled={busy}>
            {f.submit}
          </Button>
          <Button type="button" size="small" color="inherit" onClick={onCancel}>
            {f.cancel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
