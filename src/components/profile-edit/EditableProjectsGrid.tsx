"use client";

import { FC, memo, useCallback } from "react";
import { Box, Button, Card, CardContent, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SectionCard from "@/components/profile/shared/SectionCard";
import EditableText from "@/components/shared/EditableText";
import type { Project } from "@/data/profile.mock";

export interface EditableProjectsGridProps {
  items: Project[];
  onUpdate: (items: Project[]) => void;
}

const EditableProjectsGrid: FC<EditableProjectsGridProps> = ({ items, onUpdate }) => {
  const handleUpdateItem = useCallback(
    (id: string, field: keyof Project, value: any) => {
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
    const newItem: Project = {
      id: `prj_${Date.now()}`,
      name: "",
      category: "other",
      summary: "",
      tags: [],
      href: "",
    };
    onUpdate([newItem, ...items]);
  }, [items, onUpdate]);

  return (
    <SectionCard
      title="Projects"
      action={
        <Button startIcon={<AddIcon />} size="small" onClick={handleAddItem}>
          Add
        </Button>
      }
    >
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No projects yet.
        </Typography>
      )}

      <Grid container spacing={2} columns={{ xs: 12, md: 12 }}>
        {items.map((project) => (
          <Grid key={project.id} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={{ height: "100%", position: "relative" }}>
              <IconButton
                sx={{ position: "absolute", top: 4, right: 4, zIndex: 1 }}
                size="small"
                color="error"
                onClick={() => handleDeleteItem(project.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <CardContent>
                <EditableText
                  value={project.name}
                  onChange={(val) => handleUpdateItem(project.id, "name", val)}
                  variant="h6"
                  component="h3"
                  placeholder="Project Name"
                />
                <EditableText
                  value={project.category}
                  onChange={(val) => handleUpdateItem(project.id, "category", val)}
                  variant="caption"
                  component="div"
                  sx={{ mb: 1, textTransform: "uppercase", color: "text.secondary" }}
                  placeholder="Category"
                />
                <EditableText
                  value={project.summary}
                  onChange={(val) => handleUpdateItem(project.id, "summary", val)}
                  variant="body2"
                  multiline
                  placeholder="Summary"
                  sx={{ mb: 2, display: "block" }}
                />

                <Box>
                  {/* Simplified tag editing for now: helper text */}
                  <Typography variant="caption" color="text.secondary" display="block">
                    Tags (comma separated):
                  </Typography>
                  <EditableText
                    value={project.tags.join(", ")}
                    onChange={(val) =>
                      handleUpdateItem(
                        project.id,
                        "tags",
                        val
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    variant="body2"
                    placeholder="tag1, tag2"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </SectionCard>
  );
};

export default memo(EditableProjectsGrid);
