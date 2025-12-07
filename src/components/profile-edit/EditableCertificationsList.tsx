"use client";

import { FC, memo, useCallback } from "react";
import { Box, Button, IconButton, Stack, Typography, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SectionCard from "@/components/profile/shared/SectionCard";
import EditableText from "@/components/shared/EditableText";
import type { Certification } from "@/data/profile.mock";

export interface EditableCertificationsListProps {
  items: Certification[];
  onUpdate: (items: Certification[]) => void;
}

const EditableCertificationsList: FC<EditableCertificationsListProps> = ({ items, onUpdate }) => {
  const handleUpdateItem = useCallback(
    (id: string, field: keyof Certification, value: any) => {
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
    const newItem: Certification = {
      id: `cert_${Date.now()}`,
      name: "",
      issuer: "",
      date: new Date().toISOString().slice(0, 7),
    };
    onUpdate([newItem, ...items]);
  }, [items, onUpdate]);

  return (
    <SectionCard
      title="Certifications"
      action={
        <Button startIcon={<AddIcon />} size="small" onClick={handleAddItem}>
          Add
        </Button>
      }
    >
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No certifications yet.
        </Typography>
      )}

      <Stack spacing={2}>
        {items.map((cert, index) => (
          <Box key={cert.id}>
            {index > 0 && <Divider sx={{ mb: 2 }} />}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ flex: 1 }}>
                <EditableText
                  value={cert.name}
                  onChange={(val) => handleUpdateItem(cert.id, "name", val)}
                  variant="subtitle2"
                  placeholder="Certification Name"
                />
                <Stack direction="row" spacing={1}>
                  <EditableText
                    value={cert.issuer}
                    onChange={(val) => handleUpdateItem(cert.id, "issuer", val)}
                    variant="body2"
                    placeholder="Issuer"
                    textSx={{ color: "text.secondary" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <EditableText
                    value={cert.date}
                    onChange={(val) => handleUpdateItem(cert.id, "date", val)}
                    variant="body2"
                    placeholder="Date (YYYY-MM)"
                    textSx={{ color: "text.secondary" }}
                  />
                </Stack>
              </Box>
              <IconButton size="small" color="error" onClick={() => handleDeleteItem(cert.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
};

export default memo(EditableCertificationsList);
