"use client";

import { FC, useCallback } from "react";
import { Box, Button, IconButton, Stack, Typography, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditableText from "@/components/shared/EditableText";
import type { Education } from "@/data/profile.mock";

export interface EditableEducationItemProps {
  education: Education;
  onUpdate: (updated: Education) => void;
  onDelete: () => void;
  showDivider?: boolean;
}

const EditableEducationItem: FC<EditableEducationItemProps> = ({
  education: edu,
  onUpdate,
  onDelete,
  showDivider,
}) => {
  const handleFieldChange = useCallback(
    (field: keyof Education, value: any) => {
      onUpdate({ ...edu, [field]: value });
    },
    [edu, onUpdate],
  );

  const handleUpdateHighlight = useCallback(
    (index: number, value: string) => {
      const newHighlights = [...(edu.highlights || [])];
      newHighlights[index] = value;
      onUpdate({ ...edu, highlights: newHighlights });
    },
    [edu, onUpdate],
  );

  const handleAddHighlight = useCallback(() => {
    onUpdate({ ...edu, highlights: [...(edu.highlights || []), ""] });
  }, [edu, onUpdate]);

  const handleDeleteHighlight = useCallback(
    (index: number) => {
      const newHighlights = [...(edu.highlights || [])];
      newHighlights.splice(index, 1);
      onUpdate({ ...edu, highlights: newHighlights });
    },
    [edu, onUpdate],
  );

  return (
    <Box>
      {showDivider && <Divider sx={{ mb: 3 }} />}
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Box sx={{ flex: 1 }}>
          <EditableText
            value={edu.institution}
            onChange={(val) => handleFieldChange("institution", val)}
            variant="subtitle1"
            placeholder="Institution Name"
            sx={{ fontWeight: "bold" }}
          />
          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            <EditableText
              value={edu.degree}
              onChange={(val) => handleFieldChange("degree", val)}
              variant="body2"
              placeholder="Degree"
            />
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <EditableText
              value={edu.field}
              onChange={(val) => handleFieldChange("field", val)}
              variant="body2"
              placeholder="Field of Study"
            />
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <EditableText
              value={String(edu.startYear)}
              onChange={(val) => handleFieldChange("startYear", parseInt(val) || 0)}
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
                handleFieldChange(
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
            onChange={(val) => handleFieldChange("description", val)}
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
                  onChange={(val) => handleUpdateHighlight(i, val)}
                  variant="body2"
                  placeholder="Highlight item"
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" onClick={() => handleDeleteHighlight(i)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={handleAddHighlight}
              sx={{ mt: 0.5, textTransform: "none" }}
            >
              Add Highlight
            </Button>
          </Box>
        </Box>
        <IconButton color="error" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default EditableEducationItem;
