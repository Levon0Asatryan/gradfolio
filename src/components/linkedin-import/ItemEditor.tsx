"use client";

import { type FC } from "react";
import { Stack, TextField } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { MonthField } from "@/components/profile/edit/MonthField";
import { yearInputProps } from "@/components/profile/edit/yearInput";
import { counterText, fieldErrorText } from "@/components/profile/fieldErrorText";
import { measure } from "@/lib/profile/limits";
import { FIELDS, YEAR_MAX, YEAR_MIN, type FieldSpec } from "@/lib/profile/sections";
import type { FieldErrors } from "@/lib/profile/headerPatch";
import type { EntryRow } from "@/lib/linkedin/model";

/**
 * The fields of one proposed entry, as the manual form has them. Lists (achievements, skills,
 * highlights) are one per line. An open end is a blank end; the check is `parseEntry`, shown
 * live, and the same one that runs again before anything is sent.
 */
export const ItemEditor: FC<{
  row: EntryRow;
  errors: FieldErrors | null;
  onChange: (values: Record<string, string>) => void;
}> = ({ row, errors, onChange }) => {
  const { t } = useLanguage();
  const labels = t.sectionEdit.fields[row.section] as Record<string, string>;
  const specs: readonly FieldSpec[] = FIELDS[row.section];
  const set = (key: string, value: string) => onChange({ ...row.values, [key]: value });

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {specs.map((spec) => {
        const label = labels[spec.key] ?? spec.key;
        const value = row.values[spec.key] ?? "";
        const error = errors?.[spec.key];
        const errorText = error ? fieldErrorText(t, error, spec.limit) : undefined;
        if (spec.kind === "month") {
          return (
            <MonthField
              key={spec.key}
              label={label}
              value={value}
              onChange={(v) => set(spec.key, v)}
              required={spec.required}
              error={Boolean(error)}
              helperText={errorText}
            />
          );
        }
        const multi = spec.kind === "multiline" || spec.kind === "lines" || spec.kind === "chips";
        const counter =
          spec.kind === "multiline" && spec.limit
            ? counterText(t, measure(value, spec.limit), spec.limit)
            : undefined;
        return (
          <TextField
            key={spec.key}
            label={label}
            value={value}
            onChange={(e) => set(spec.key, e.target.value)}
            required={spec.required}
            multiline={multi}
            minRows={multi ? 2 : undefined}
            type={spec.kind === "url" ? "url" : spec.kind === "year" ? "number" : "text"}
            placeholder={spec.kind === "url" ? "https://" : undefined}
            autoComplete="off"
            error={Boolean(error)}
            helperText={errorText ?? counter}
            size="small"
            fullWidth
            slotProps={
              spec.kind === "year" ? { htmlInput: yearInputProps(YEAR_MIN, YEAR_MAX) } : undefined
            }
          />
        );
      })}
    </Stack>
  );
};
