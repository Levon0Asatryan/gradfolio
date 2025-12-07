"use client";

import { FC, memo, useCallback, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Image from "next/image";
import { ProjectAttachmentForm } from "./types";

export interface ProjectMediaUploadProps {
  attachments: ProjectAttachmentForm[];
  onAdd: (attachment: ProjectAttachmentForm) => void;
  onRemove: (id: string) => void;
}

const ProjectMediaUpload: FC<ProjectMediaUploadProps> = ({ attachments, onAdd, onRemove }) => {
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState<ProjectAttachmentForm["type"]>("image");
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = useCallback(() => {
    if (!newUrl) return;
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      type: newType,
      url: newUrl,
      title: newTitle,
      thumbnailUrl:
        newType === "video" ? `https://source.unsplash.com/random?sig=${Math.random()}` : undefined, // Mock thumb
    });
    setOpen(false);
    setNewUrl("");
    setNewTitle("");
    setNewType("image");
  }, [newUrl, newType, newTitle, onAdd]);

  return (
    <Box component="section" aria-label="Media Upload" sx={{ mb: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2">
          Attachments / Evidence
        </Typography>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpen(true)}>
          Add Media
        </Button>
      </Stack>

      {attachments.length === 0 ? (
        <Card
          variant="outlined"
          sx={{ p: 4, textAlign: "center", bgcolor: "background.default", borderStyle: "dashed" }}
        >
          <Typography color="text.secondary">No attachments added yet.</Typography>
          <Button sx={{ mt: 1 }} onClick={() => setOpen(true)}>
            Add your first attachment
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {attachments.map((att) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={att.id}>
              <Card variant="outlined" sx={{ position: "relative" }}>
                <IconButton
                  size="small"
                  onClick={() => onRemove(att.id)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    zIndex: 1,
                  }}
                  aria-label="Remove attachment"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <Box sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "action.hover" }}>
                  {att.type === "image" || (att.type === "video" && att.thumbnailUrl) ? (
                    <Image
                      src={att.type === "image" ? att.url : att.thumbnailUrl!}
                      alt={att.title || "Attachment"}
                      fill
                      sizes="(max-width: 600px) 100vw, 300px"
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {att.type.toUpperCase()}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="body2" noWrap title={att.title || att.url}>
                    {att.title || att.url}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Attachment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              fullWidth
            >
              <MenuItem value="image">Image</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="link">Link</MenuItem>
            </TextField>
            <TextField
              label="URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              fullWidth
              placeholder="e.g. https://..."
            />
            <TextField
              label="Title (Optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={!newUrl}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default memo(ProjectMediaUpload);
