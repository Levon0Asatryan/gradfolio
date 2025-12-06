"use client";

import { FC, memo, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

export interface ProjectsListToolbarProps {
  categories?: Array<"course" | "personal" | "research" | "hackathon" | "other">;
  onAddProject?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
}

const defaultCategories = ["course", "personal", "research", "hackathon", "other"] as const;
const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Name (A-Z)", value: "name_asc" },
  { label: "Name (Z-A)", value: "name_desc" },
];

const ProjectsListToolbar: FC<ProjectsListToolbarProps> = ({
  categories,
  onAddProject,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}) => {
  const categoryOptions = useMemo(
    () => (categories && categories.length ? categories : defaultCategories),
    [categories],
  );

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
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ py: 2, px: 2 }}
      >
        <Typography variant="h5" component="h1" fontWeight="bold">
          Projects
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            inputProps={{ "aria-label": "Search projects" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={() => onSearchChange("")}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                height: 40,
                width: { xs: "100%", sm: 260 },
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "action.disabled",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
          />
          <Select
            size="small"
            displayEmpty
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            renderValue={(value) => (value ? String(value) : "All Categories")}
            inputProps={{ "aria-label": "Filter by category" }}
            sx={{ minWidth: 160, height: 40, borderRadius: 2 }}
          >
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {categoryOptions.map((c) => (
              <MenuItem key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            displayEmpty
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            renderValue={(val) => {
              const opt = sortOptions.find((o) => o.value === val);
              return opt ? opt.label : "Sort by";
            }}
            inputProps={{ "aria-label": "Sort projects" }}
            sx={{ minWidth: 140, height: 40, borderRadius: 2 }}
          >
            {sortOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            size="medium"
            startIcon={<AddIcon />}
            onClick={onAddProject}
            aria-label="Add Project"
            sx={{ height: 40, borderRadius: 2, px: 3, textTransform: "none", fontWeight: 600 }}
          >
            New Project
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default memo(ProjectsListToolbar);
