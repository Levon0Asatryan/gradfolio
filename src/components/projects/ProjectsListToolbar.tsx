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

import { useLanguage } from "@/components/i18n/LanguageContext";

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
  const { t } = useLanguage();
  const categoryOptions = useMemo(
    () => (categories && categories.length ? categories : defaultCategories),
    [categories],
  );

  const sortOptions = [
    { label: t.projects.sort.newest, value: "newest" },
    { label: t.projects.sort.oldest, value: "oldest" },
    { label: t.projects.sort.nameAZ, value: "name_asc" },
    { label: t.projects.sort.nameZA, value: "name_desc" },
  ];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "course":
        return t.projects.categories.course;
      case "personal":
        return t.projects.categories.personal;
      case "research":
        return t.projects.categories.research;
      case "hackathon":
        return t.projects.categories.hackathon;
      case "other":
        return t.projects.categories.other;
      default:
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
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
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ py: 2, px: 2 }}
      >
        <Typography variant="h5" component="h1" fontWeight="bold">
          {t.common.projects}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder={t.common.searchProjects}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            inputProps={{ "aria-label": t.common.searchProjects }}
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
            renderValue={(value) =>
              value ? getCategoryLabel(String(value)) : t.common.allCategories
            }
            inputProps={{ "aria-label": "Filter by category" }}
            sx={{ minWidth: 160, height: 40, borderRadius: 2 }}
          >
            <MenuItem value="">
              <em>{t.common.allCategories}</em>
            </MenuItem>
            {categoryOptions.map((c) => (
              <MenuItem key={c} value={c}>
                {getCategoryLabel(c)}
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
              return opt ? opt.label : t.common.sortBy;
            }}
            inputProps={{ "aria-label": t.common.sortBy }}
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
            aria-label={t.common.addProject}
            sx={{ height: 40, borderRadius: 2, px: 3, textTransform: "none", fontWeight: 600 }}
          >
            {t.common.addNewProject}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default memo(ProjectsListToolbar);
