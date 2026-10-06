"use client";

import { FC, memo } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { PROJECT_CATEGORIES } from "@/components/theme/tokens";
import { FilterChip } from "@/components/shared/FilterChip";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface ProjectsListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** "" means every category. */
  category: string;
  onCategoryChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
}

const SORTS = ["newest", "oldest", "nameAZ", "nameZA"] as const;
const SORT_VALUE = {
  newest: "newest",
  oldest: "oldest",
  nameAZ: "name_asc",
  nameZA: "name_desc",
} as const;

const ProjectsListToolbar: FC<ProjectsListToolbarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}) => {
  const { t } = useLanguage();

  return (
    <Box
      component="section"
      aria-label={t.common.searchProjects}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <TextField
          fullWidth
          placeholder={t.common.searchProjects}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            htmlInput: { "aria-label": t.common.searchProjects },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t.projects.clearSearch}
                    onClick={() => onSearchChange("")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <TextField
          select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          label={t.common.sortBy}
          sx={{ minWidth: { sm: 220 } }}
        >
          {SORTS.map((s) => (
            <MenuItem key={s} value={SORT_VALUE[s]}>
              {t.projects.sort[s]}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Box
        role="group"
        aria-label={t.projects.filterByCategory}
        sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
      >
        <FilterChip
          label={t.search.categories.all}
          selected={category === ""}
          onClick={() => onCategoryChange("")}
        />
        {PROJECT_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            label={t.projects.categories[c]}
            selected={category === c}
            onClick={() => onCategoryChange(c)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default memo(ProjectsListToolbar);
