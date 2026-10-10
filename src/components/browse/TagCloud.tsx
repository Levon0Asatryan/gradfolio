"use client";

import { FC } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { tagHref } from "@/lib/discovery/query";
import type { TagCloudItem } from "@/lib/api/types";

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Three size steps from the count; the step is a class of the component, never a number from data. */
export function sizeStep(count: number, max: number): 0 | 1 | 2 {
  if (max <= 0) return 0;
  const share = count / max;
  return share > 0.66 ? 2 : share > 0.33 ? 1 : 0;
}

const SIZES = ["0.875rem", "1.0625rem", "1.3125rem"] as const;

/**
 * The popular tags, alphabetical for scanning, with size for popularity. Size is never the
 * only carrier: the count is in each link's accessible name. Links, not chips: it is a list
 * of places to go.
 */
export const TagCloud: FC<{ items: TagCloudItem[] }> = ({ items }) => {
  const { t } = useLanguage();
  if (items.length === 0) {
    return <Typography color="text.secondary">{t.browse.cloudEmpty}</Typography>;
  }
  const max = Math.max(...items.map((i) => i.projects + i.people));
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Box
      component="ul"
      aria-label={t.browse.cloudTitle}
      sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexWrap: "wrap", gap: 1.5 }}
    >
      {sorted.map((item) => (
        <li key={item.name}>
          <Box
            component={Link}
            href={tagHref(item.name)}
            prefetch={false}
            aria-label={fill(t.browse.cloudItem, {
              tag: item.name,
              projects: String(item.projects),
              people: String(item.people),
            })}
            sx={({ palette }) => ({
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              px: 1.5,
              borderRadius: 999,
              border: 1,
              borderColor: palette.surface.line,
              color: palette.text.primary,
              fontWeight: 700,
              fontSize: SIZES[sizeStep(item.projects + item.people, max)],
              textDecoration: "none",
              overflowWrap: "anywhere",
              "&:hover": { borderColor: palette.primary.main },
            })}
          >
            {item.name}
          </Box>
        </li>
      ))}
    </Box>
  );
};
