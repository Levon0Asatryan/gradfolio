"use client";

import { FC, memo, useCallback } from "react";
import { Box, Button, IconButton, Stack, Typography, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SectionCard from "@/components/profile/shared/SectionCard";
import EditableText from "@/components/shared/EditableText";
import type { Education } from "@/data/profile.mock";

export interface EditableEducationListProps {
  items: Education[];
  onUpdate: (items: Education[]) => void;
}

const EditableEducationList: FC<EditableEducationListProps> = ({ items, onUpdate }) => {
  const handleUpdateItem = useCallback(
    (id: string, field: keyof Education, value: any) => {
      const newItems = items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      onUpdate(newItems);
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

  const handleUpdateHighlight = useCallback(
    (eduId: string, index: number, value: string) => {
      const newItems = items.map((item) => {
        if (item.id === eduId) {
          const newHighlights = [...(item.highlights || [])];
          newHighlights[index] = value;
          return { ...item, highlights: newHighlights };
        }
        return item;
      });
      onUpdate(newItems);
    },
    [items, onUpdate],
  );

  const handleAddHighlight = useCallback(
    (eduId: string) => {
      const newItems = items.map((item) => {
        if (item.id === eduId) {
          return { ...item, highlights: [...(item.highlights || []), ""] };
        }
        return item;
      });
      onUpdate(newItems);
    },
    [items, onUpdate],
  );

  const handleDeleteHighlight = useCallback(
    (eduId: string, index: number) => {
      const newItems = items.map((item) => {
        if (item.id === eduId) {
          const newHighlights = [...(item.highlights || [])];
          newHighlights.splice(index, 1);
          return { ...item, highlights: newHighlights };
        }
        return item;
      });
      onUpdate(newItems);
    },
    [items, onUpdate],
  );

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
          <Box key={edu.id}>
            {index > 0 && <Divider sx={{ mb: 3 }} />}
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Box sx={{ flex: 1 }}>
                <EditableText
                  value={edu.institution}
                  onChange={(val) => handleUpdateItem(edu.id, "institution", val)}
                  variant="subtitle1"
                  placeholder="Institution Name"
                  sx={{ fontWeight: "bold" }}
                />
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                  <EditableText
                    value={edu.degree}
                    onChange={(val) => handleUpdateItem(edu.id, "degree", val)}
                    variant="body2"
                    placeholder="Degree"
                  />
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <EditableText
                    value={edu.field}
                    onChange={(val) => handleUpdateItem(edu.id, "field", val)}
                    variant="body2"
                    placeholder="Field of Study"
                  />
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 1 }}>
                  <EditableText
                    value={String(edu.startYear)}
                    onChange={(val) => handleUpdateItem(edu.id, "startYear", parseInt(val) || 0)}
                    variant="body2"
                    placeholder="Start Year"
                    textSx={{ color: "text.secondary" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    –
                  </Typography>
                  <EditableText
                    value={edu.endYear ? String(edu.endYear) : "Present"}
                    onChange={(val) =>
                      handleUpdateItem(
                        edu.id,
                        "endYear",
                        val === "Present" ? undefined : parseInt(val) || undefined,
                      )
                    }
                    variant="body2"
                    placeholder="End Year (or Present)"
                    textSx={{ color: "text.secondary" }}
                  />
                </Stack>
                <EditableText
                  value={edu.description || ""}
                  onChange={(val) => handleUpdateItem(edu.id, "description", val)}
                  variant="body2"
                  multiline
                  placeholder="Description (optional)"
                  sx={{ mb: 1, display: "block" }}
                />

                {/* Highlights */}
                <Box sx={{ pl: 2 }}>
                  {edu.highlights?.map((h, i) => (
                    <Stack key={i} direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2">•</Typography>
                      <EditableText
                        value={h}
                        onChange={(val) => handleUpdateHighlight(edu.id, i, val)}
                        variant="body2"
                        placeholder="Highlight item"
                        sx={{ flex: 1 }}
                      />
                      <IconButton size="small" onClick={() => handleDeleteHighlight(edu.id, i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => handleAddHighlight(edu.id)}
                    sx={{ mt: 0.5, textTransform: "none" }}
                  >
                    Add Highlight
                  </Button>
                </Box>
              </Box>
              <IconButton color="error" onClick={() => handleDeleteItem(edu.id)}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
};

export default memo(EditableEducationList);
