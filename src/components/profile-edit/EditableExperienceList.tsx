"use client";

import { FC, memo, useCallback } from "react";
import { Box, Button, IconButton, Stack, Typography, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SectionCard from "@/components/profile/shared/SectionCard";
import EditableText from "@/components/shared/EditableText";
import type { Experience } from "@/data/profile.mock";

export interface EditableExperienceListProps {
  items: Experience[];
  onUpdate: (items: Experience[]) => void;
}

const EditableExperienceList: FC<EditableExperienceListProps> = ({ items, onUpdate }) => {
  const handleUpdateItem = useCallback(
    (id: string, field: keyof Experience, value: any) => {
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
    const newItem: Experience = {
      id: `exp_${Date.now()}`,
      title: "",
      organization: "",
      start: new Date().toISOString().slice(0, 7), // YYYY-MM
      summary: "",
      achievements: [],
      skills: [],
    };
    onUpdate([newItem, ...items]);
  }, [items, onUpdate]);

  const handleUpdateAchievement = useCallback(
    (expId: string, index: number, value: string) => {
      const newItems = items.map((item) => {
        if (item.id === expId) {
          const newAchievements = [...(item.achievements || [])];
          newAchievements[index] = value;
          return { ...item, achievements: newAchievements };
        }
        return item;
      });
      onUpdate(newItems);
    },
    [items, onUpdate],
  );

  const handleAddAchievement = useCallback(
    (expId: string) => {
      const newItems = items.map((item) => {
        if (item.id === expId) {
          return { ...item, achievements: [...(item.achievements || []), ""] };
        }
        return item;
      });
      onUpdate(newItems);
    },
    [items, onUpdate],
  );

  const handleDeleteAchievement = useCallback(
    (expId: string, index: number) => {
      const newItems = items.map((item) => {
        if (item.id === expId) {
          const newAchievements = [...(item.achievements || [])];
          newAchievements.splice(index, 1);
          return { ...item, achievements: newAchievements };
        }
        return item;
      });
      onUpdate(newItems);
    },
    [items, onUpdate],
  );

  return (
    <SectionCard
      title="Experience"
      action={
        <Button startIcon={<AddIcon />} size="small" onClick={handleAddItem}>
          Add
        </Button>
      }
    >
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No experience entries. Click Add to start.
        </Typography>
      )}

      <Stack spacing={3}>
        {items.map((exp, index) => (
          <Box key={exp.id}>
            {index > 0 && <Divider sx={{ mb: 3 }} />}
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Box sx={{ flex: 1 }}>
                <EditableText
                  value={exp.title}
                  onChange={(val) => handleUpdateItem(exp.id, "title", val)}
                  variant="subtitle1"
                  placeholder="Job Title"
                  sx={{ fontWeight: "bold" }}
                />
                <EditableText
                  value={exp.organization}
                  onChange={(val) => handleUpdateItem(exp.id, "organization", val)}
                  variant="body2"
                  placeholder="Organization"
                />
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 1 }}>
                  <EditableText
                    value={exp.start}
                    onChange={(val) => handleUpdateItem(exp.id, "start", val)}
                    variant="body2"
                    placeholder="Start Date (YYYY-MM)"
                    textSx={{ color: "text.secondary" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    –
                  </Typography>
                  <EditableText
                    value={exp.end || "Present"}
                    onChange={(val) =>
                      handleUpdateItem(exp.id, "end", val === "Present" ? undefined : val)
                    }
                    variant="body2"
                    placeholder="End Date (YYYY-MM or Present)"
                    textSx={{ color: "text.secondary" }}
                  />
                </Stack>
                <EditableText
                  value={exp.summary}
                  onChange={(val) => handleUpdateItem(exp.id, "summary", val)}
                  variant="body2"
                  multiline
                  placeholder="Summary"
                  sx={{ mb: 1, display: "block" }}
                />

                {/* Achievements */}
                <Box sx={{ pl: 2 }}>
                  {exp.achievements?.map((ach, i) => (
                    <Stack key={i} direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2">•</Typography>
                      <EditableText
                        value={ach}
                        onChange={(val) => handleUpdateAchievement(exp.id, i, val)}
                        variant="body2"
                        placeholder="Achievement"
                        sx={{ flex: 1 }}
                      />
                      <IconButton size="small" onClick={() => handleDeleteAchievement(exp.id, i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => handleAddAchievement(exp.id)}
                    sx={{ mt: 0.5, textTransform: "none" }}
                  >
                    Add Achievement
                  </Button>
                </Box>
              </Box>
              <IconButton color="error" onClick={() => handleDeleteItem(exp.id)}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
};

export default memo(EditableExperienceList);
