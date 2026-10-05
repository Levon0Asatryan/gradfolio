"use client";

import { FC } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { YEAR_MAX, YEAR_MIN } from "@/lib/profile/sections";
import { yearInputProps } from "./yearInput";

/**
 * A year and a month, as the API's `YYYY-MM` string. Two plain controls rather
 * than `<input type="month">` (no picker in desktop Firefox or Safari, which show
 * a bare text box) or MUI X (a date adapter and its locale packs for one field):
 * a localized month list and a year number work the same in every browser and
 * under jsdom. A half-filled value is passed up as typed (`2024-`), so the check
 * says so instead of the field looking empty.
 */
export const MonthField: FC<{
  label: string;
  /** `YYYY-MM`, a partial one, or "". */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}> = ({ label, value, onChange, required, disabled, error, helperText }) => {
  const { t } = useLanguage();
  const [year = "", month = ""] = value.split("-");

  // Names come from the dictionary: Intl has no Armenian data in every browser build.
  const months = t.sectionEdit.months.map((name, i) => ({
    value: String(i + 1).padStart(2, "0"),
    name,
  }));

  const emit = (y: string, m: string) => onChange(y === "" && m === "" ? "" : `${y}-${m}`);

  return (
    <Stack
      component="fieldset"
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      sx={{ border: 0, p: 0, m: 0 }}
    >
      <TextField
        select
        label={`${label}: ${t.sectionEdit.month}`}
        value={month}
        onChange={(e) => emit(year, e.target.value)}
        required={required}
        disabled={disabled}
        error={error}
        size="small"
        sx={{ flex: 2 }}
        slotProps={{ select: { displayEmpty: true } }}
      >
        <MenuItem value="" disabled>
          {t.sectionEdit.monthPlaceholder}
        </MenuItem>
        {months.map((m) => (
          <MenuItem key={m.value} value={m.value}>
            {m.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={`${label}: ${t.sectionEdit.year}`}
        type="number"
        value={year}
        onChange={(e) => emit(e.target.value, month)}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        size="small"
        sx={{ flex: 1 }}
        slotProps={{ htmlInput: yearInputProps(YEAR_MIN, YEAR_MAX) }}
      />
    </Stack>
  );
};
