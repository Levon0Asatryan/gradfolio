"use client";

import { FC, KeyboardEvent, useState } from "react";
import { Button, Chip, FormHelperText, Stack, TextField } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { useLanguage } from "@/components/i18n/LanguageContext";

/** A short list of tokens (skills): type, Enter or Add, remove with the chip's x. */
export const ChipListField: FC<{
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  error?: boolean;
  helperText?: string;
  maxItems?: number;
  /** The text typed but not yet added, so a parent can count it as unsaved. */
  onDraftChange?: (draft: string) => void;
}> = ({ label, items, onChange, error, helperText, maxItems, onDraftChange }) => {
  const { t } = useLanguage();
  const [draft, setDraftState] = useState("");
  const setDraft = (d: string) => {
    setDraftState(d);
    onDraftChange?.(d);
  };

  function add() {
    const name = draft.trim();
    if (!name) return;
    if (!items.some((s) => s.toLowerCase() === name.toLowerCase())) onChange([...items, name]);
    setDraft("");
  }
  // Enter adds the chip; it must not submit the surrounding dialog form.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    add();
  };

  return (
    <Stack spacing={1}>
      {items.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {items.map((item) => (
            <Chip
              key={item}
              size="small"
              label={item}
              onDelete={() => onChange(items.filter((s) => s !== item))}
              deleteIcon={
                <CancelIcon aria-label={t.sectionEdit.removeItem.replace("{name}", item)} />
              }
            />
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          error={error}
          disabled={maxItems !== undefined && items.length >= maxItems}
          fullWidth
        />
        <Button variant="outlined" onClick={add}>
          {t.sectionEdit.add}
        </Button>
      </Stack>
      <FormHelperText error={error}>{helperText ?? t.sectionEdit.addItemHint}</FormHelperText>
    </Stack>
  );
};
