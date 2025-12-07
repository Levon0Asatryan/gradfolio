"use client";

import { FC, memo, useCallback } from "react";
import { Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SectionCard from "@/components/profile/shared/SectionCard";
import EditableEducationItem from "./EditableEducationItem";
import type { Education } from "@/data/profile.mock";

export interface EditableEducationListProps {
  items: Education[];
  onUpdate: (items: Education[]) => void;
}

const EditableEducationList: FC<EditableEducationListProps> = ({ items, onUpdate }) => {
  const handleUpdateItem = useCallback(
    (updatedItem: Education) => {
      onUpdate(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    },
    [items, onUpdate],
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      onUpdate(items.filter((item) => item.id !== id));
    },
    [items, onUpdate],
  );

  const handleAddItem = useCallback(() => {
    const newItem: Education = {
      id: `edu_${Date.now()}`,
      institution: "",
      degree: "",
      field: "",
      startYear: new Date().getFullYear(),
      description: "",
      highlights: [],
    };
    onUpdate([newItem, ...items]);
  }, [items, onUpdate]);

  return (
    <SectionCard
      title="Education"
      action={
        <Button startIcon={<AddIcon />} size="small" onClick={handleAddItem}>
          Add
        </Button>
      }
    >
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No education entries. Click Add to start.
        </Typography>
      )}

      <Stack spacing={3}>
        {items.map((edu, index) => (
          <EditableEducationItem
            key={edu.id}
            education={edu}
            onUpdate={handleUpdateItem}
            onDelete={() => handleDeleteItem(edu.id)}
            showDivider={index > 0}
          />
        ))}
      </Stack>
    </SectionCard>
  );
};

export default memo(EditableEducationList);
