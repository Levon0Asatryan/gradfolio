"use client";

import { FC, memo, useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export interface ProjectsListToolbarProps {
  categories?: Array<"course" | "personal" | "research" | "hackathon" | "other">;
  onAddProject?: () => void;
}

const defaultCategories = ["course", "personal", "research", "hackathon", "other"] as const;

type Category = (typeof defaultCategories)[number];

const ProjectsListToolbar: FC<ProjectsListToolbarProps> = ({ categories, onAddProject }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");

  const categoryOptions = useMemo(
    () => (categories && categories.length ? categories : defaultCategories),
    [categories],
  );

  const handleCategoryChange = (e: SelectChangeEvent) => {
    setCategory((e.target.value as Category) ?? "");
  };

  return (
    <Box
      component="section"
      aria-label="Projects Toolbar"
      sx={{
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        mb: 2,
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: (t) => t.palette.background.default,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ py: 1, px: 2 }}
      >
        <Typography variant="h5" component="h1">
          Projects
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          pr={4}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            label="Search projects"
            placeholder="Search by title or tech…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ "aria-label": "Search projects" }}
            InputProps={{
              sx: {
                height: 32,
                "& input": {
                  padding: "0 8px",
                  height: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                },
              },
            }}
          />
          <Select
            size="small"
            displayEmpty
            value={category}
            onChange={handleCategoryChange}
            renderValue={(value) => (value ? String(value) : "All categories")}
            inputProps={{ "aria-label": "Filter by category" }}
            sx={{ minWidth: 160, height: 32 }}
          >
            <MenuItem value="">
              <em>All categories</em>
            </MenuItem>
            {categoryOptions.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddProject}
            aria-label="Add Project"
            sx={{ height: 32 }}
          >
            Add Project
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default memo(ProjectsListToolbar);
