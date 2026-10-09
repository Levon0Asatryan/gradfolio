"use client";

import { FC } from "react";
import { Autocomplete, Chip, TextField } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { normalizeTerms } from "@/lib/projects/form";

/**
 * Technologies or tags: type a word, Enter adds it, Backspace on an empty box
 * removes the last, each chip has a remove button. Case-insensitive duplicates
 * and blanks are dropped the way the API drops them.
 */
export const TermsInput: FC<{
  id: string;
  label: string;
  value: string[];
  onChange: (terms: string[]) => void;
  max: number;
  error?: string;
}> = ({ id, label, value, onChange, max, error }) => {
  const { t } = useLanguage();
  const text = t.projects.form;
  return (
    <Autocomplete
      multiple
      freeSolo
      id={id}
      options={[]}
      value={value}
      onChange={(_e, next) => onChange(normalizeTerms(next))}
      renderValue={(terms, getItemProps) =>
        terms.map((term, index) => {
          const { key, ...props } = getItemProps({ index });
          return (
            <Chip
              key={key}
              {...props}
              size="small"
              label={term}
              aria-label={text.removeTerm.replace("{name}", term)}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={Boolean(error)}
          helperText={error ?? text.termsHelp.replace("{max}", String(max))}
        />
      )}
    />
  );
};
