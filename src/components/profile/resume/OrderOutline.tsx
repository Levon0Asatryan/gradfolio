"use client";

import { Box, Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { RADIUS, surfaces } from "@/components/theme/tokens";

const LINES: Record<string, number> = {
  contact: 1,
  bio: 2,
  education: 1,
  experience: 2,
  projects: 3,
  skills: 1,
  certifications: 1,
};

/**
 * A small sketch of the page: one labelled strip per block that is on, in order. The
 * sheet stays white in both themes because it stands for paper. Decorative
 * (`aria-hidden`): the cards beside it carry the same information.
 */
export function OrderOutline({ items }: { items: { section: string; label: string }[] }) {
  const { t } = useLanguage();
  return (
    <Box
      aria-hidden="true"
      sx={{
        borderRadius: `${RADIUS.card}px`,
        p: 2,
        bgcolor: "action.hover",
      }}
    >
      <Typography
        variant="caption"
        sx={{ display: "block", mb: 1, fontWeight: 800, textTransform: "uppercase" }}
        color="text.secondary"
      >
        {t.resume.pageOrder}
      </Typography>
      <Box
        sx={(theme) => ({
          bgcolor: "#FFFFFF",
          color: "#1E293B",
          borderRadius: "6px",
          border: `1px solid ${surfaces(theme.palette.mode).line}`,
          p: 1.5,
          minHeight: 220,
        })}
      >
        <Box sx={{ height: 9, width: "60%", borderRadius: "3px", bgcolor: "#1E293B", mb: 1.5 }} />
        {items.map(({ section, label }, index) => (
          <Box
            key={section}
            sx={{ mb: 0.75, px: 1, py: 0.75, borderRadius: "6px", bgcolor: "#E8ECF2" }}
          >
            <Typography
              component="span"
              sx={{ display: "block", fontSize: 11, fontWeight: 800, color: "#2D4E8A" }}
            >
              {index + 1} {label}
            </Typography>
            {Array.from({ length: LINES[section] ?? 1 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  mt: 0.5,
                  height: 5,
                  borderRadius: "3px",
                  bgcolor: "#8E949D",
                  opacity: 0.55,
                  width: i === 0 ? "100%" : "65%",
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25 }}>
        {t.resume.outlineNote}
      </Typography>
    </Box>
  );
}
