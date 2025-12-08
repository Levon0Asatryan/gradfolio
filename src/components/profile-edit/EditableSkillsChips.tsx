"use client";

import { FC, memo, useCallback, useState, KeyboardEvent } from "react";
import { Chip, TextField, Stack } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import AddIcon from "@mui/icons-material/Add";
import SectionCard from "@/components/profile/shared/SectionCard";

export interface EditableSkillsChipsProps {
  items: string[];
  onUpdate: (items: string[]) => void;
}

const EditableSkillsChips: FC<EditableSkillsChipsProps> = ({ items, onUpdate }) => {
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const handleDelete = useCallback(
    (skillToDelete: string) => {
      onUpdate(items.filter((skill) => skill !== skillToDelete));
    },
    [items, onUpdate],
  );

  const handleAdd = useCallback(() => {
    if (newSkill.trim()) {
      // Prevent duplicates
      if (!items.includes(newSkill.trim())) {
        onUpdate([...items, newSkill.trim()]);
      }
      setNewSkill("");
      setIsAdding(false);
    } else {
      setIsAdding(false);
    }
  }, [items, newSkill, onUpdate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        handleAdd();
      } else if (e.key === "Escape") {
        setNewSkill("");
        setIsAdding(false);
      }
    },
    [handleAdd],
  );

  return (
    <SectionCard title={t.profile.skills}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignItems: "center" }}>
        {items.map((skill) => (
          <Chip key={skill} label={skill} onDelete={() => handleDelete(skill)} />
        ))}

        {isAdding ? (
          <TextField
            size="small"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onBlur={handleAdd}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={t.profile.newSkill}
            sx={{ width: 120 }}
          />
        ) : (
          <Chip
            icon={<AddIcon />}
            label={t.profile.add}
            onClick={() => setIsAdding(true)}
            variant="outlined"
            clickable
          />
        )}
      </Stack>
    </SectionCard>
  );
};

export default memo(EditableSkillsChips);
