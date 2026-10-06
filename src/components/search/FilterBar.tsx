"use client";

import { FC, memo } from "react";
import Box from "@mui/material/Box";
import { FilterChip } from "@/components/shared/FilterChip";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface FilterBarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

/** The role filters; the keys are what `ExplorePage` matches on. */
const ROLE_FILTERS = [
  "All",
  "Developers",
  "Designers",
  "Product Managers",
  "Data Scientists",
  "Researchers",
] as const;

const FilterBar: FC<FilterBarProps> = ({ activeCategory, onCategoryChange }) => {
  const { t } = useLanguage();
  const c = t.search.categories;
  const labels: Record<(typeof ROLE_FILTERS)[number], string> = {
    All: c.all,
    Developers: c.developers,
    Designers: c.designers,
    "Product Managers": c.productManagers,
    "Data Scientists": c.dataScientists,
    Researchers: c.researchers,
  };

  return (
    <Box
      role="group"
      aria-label={t.projects.filterByCategory}
      sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
    >
      {ROLE_FILTERS.map((cat) => (
        <FilterChip
          key={cat}
          label={labels[cat]}
          selected={activeCategory === cat}
          onClick={() => onCategoryChange(cat)}
        />
      ))}
    </Box>
  );
};

export default memo(FilterBar);
