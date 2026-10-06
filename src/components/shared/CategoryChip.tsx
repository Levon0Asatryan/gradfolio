"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/components/theme/tokens";
import { useLanguage } from "@/components/i18n/LanguageContext";

export const isProjectCategory = (value: unknown): value is ProjectCategory =>
  PROJECT_CATEGORIES.includes(value as ProjectCategory);

/**
 * A project's category: its name in text, plus its colour from the theme (the
 * dot and the tint). Anything not a known category reads as "Other".
 */
export const CategoryChip: FC<{ category?: string | null }> = ({ category }) => {
  const { t } = useLanguage();
  const key: ProjectCategory = isProjectCategory(category) ? category : "other";
  return (
    <Box
      component="span"
      sx={({ palette }) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.25,
        borderRadius: 999,
        fontSize: "0.8125rem",
        fontWeight: 800,
        lineHeight: 1.5,
        color: palette.category[key].fg,
        bgcolor: palette.category[key].bg,
        "&::before": {
          content: '""',
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: "currentColor",
        },
      })}
    >
      {t.projects.categories[key]}
    </Box>
  );
};
