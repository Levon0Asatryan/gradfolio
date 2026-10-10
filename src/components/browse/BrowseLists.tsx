"use client";

import { FC } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PersonCard from "@/components/search/PersonCard";
import ProjectResultCard from "@/components/search/ProjectResultCard";
import { Pager } from "@/components/search/Pager";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { DiscoveryProject, PersonSummary } from "@/lib/api/types";

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
  gap: 3,
} as const;

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** One page of a browse list, with its count announced politely and a pager of links. */
export const BrowseProjectsList: FC<{
  items: DiscoveryProject[];
  pager: { firstHref?: string; nextHref?: string };
}> = ({ items, pager }) => {
  const { t } = useLanguage();
  if (items.length === 0 && !pager.firstHref) {
    return (
      <Box role="status" sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" component="h2">
          {t.browse.noProjects}
        </Typography>
        <Typography color="text.secondary">{t.browse.tryClearing}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" role="status" aria-live="polite">
        {fill(t.search.showingResults, { count: String(items.length) })}
      </Typography>
      <Box sx={grid}>
        {items.map((p) => (
          <ProjectResultCard key={p.id} project={p} />
        ))}
      </Box>
      <Pager firstHref={pager.firstHref} nextHref={pager.nextHref} />
    </Box>
  );
};

export const BrowsePeopleList: FC<{
  items: PersonSummary[];
  pager: { firstHref?: string; nextHref?: string };
}> = ({ items, pager }) => {
  const { t } = useLanguage();
  if (items.length === 0 && !pager.firstHref) {
    return (
      <Box role="status" sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" component="h2">
          {t.browse.noPeople}
        </Typography>
        <Typography color="text.secondary">{t.browse.tryClearing}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" role="status" aria-live="polite">
        {fill(t.search.showingResults, { count: String(items.length) })}
      </Typography>
      <Box sx={grid}>
        {items.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </Box>
      <Pager firstHref={pager.firstHref} nextHref={pager.nextHref} />
    </Box>
  );
};
