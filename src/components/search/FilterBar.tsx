"use client";

import { FC, memo } from "react";
import { Chip, Stack, styled } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface FilterBarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = [
  "All",
  "Developers",
  "Designers",
  "Product Managers",
  "Data Scientists",
  "Researchers",
];

// Hide scrollbar but keep functionality
const ScrollContainer = styled(Stack)(({ theme }) => ({
  overflowX: "auto",
  scrollbarWidth: "none", // Firefox
  "&::-webkit-scrollbar": {
    display: "none", // Chrome/Safari
  },
  paddingBottom: theme.spacing(1), // Spacing for safe touch area
  maskImage: "linear-gradient(to right, black 90%, transparent 100%)", // Fade effect on edge
  WebkitMaskImage: "linear-gradient(to right, black 90%, transparent 100%)", // Webkit prefix
}));

const FilterBar: FC<FilterBarProps> = ({ activeCategory, onCategoryChange }) => {
  const { t } = useLanguage();

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "All":
        return t.search.categories.all;
      case "Developers":
        return t.search.categories.developers;
      case "Designers":
        return t.search.categories.designers;
      case "Product Managers":
        return t.search.categories.productManagers;
      case "Data Scientists":
        return t.search.categories.dataScientists;
      case "Researchers":
        return t.search.categories.researchers;
      default:
        return cat;
    }
  };

  return (
    <ScrollContainer
      direction="row"
      spacing={1}
      sx={{
        width: "100%",
        maxWidth: 1000,
        mx: "auto",
        mb: 4,
        px: 2,
        justifyContent: { md: "center", xs: "flex-start" }, // Center on desktop, start on mobile
      }}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = activeCategory === cat;
        return (
          <Chip
            key={cat}
            label={getCategoryLabel(cat)}
            clickable
            color={isSelected ? "primary" : "default"}
            variant={isSelected ? "filled" : "outlined"}
            onClick={() => onCategoryChange(cat)}
            sx={{
              fontWeight: isSelected ? 600 : 400,
              minWidth: "auto",
            }}
          />
        );
      })}
    </ScrollContainer>
  );
};

export default memo(FilterBar);
