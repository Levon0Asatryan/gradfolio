"use client";

import { FC } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { DiscoveryProject, PersonSummary } from "@/lib/api/types";
import PersonCard from "./PersonCard";
import ProjectResultCard from "./ProjectResultCard";
import { Pager } from "./Pager";
import { ResultGroup } from "./ResultGroup";

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

export interface ResultsViewProps {
  /** The text to highlight; empty for a tag page. */
  query: string;
  people?: { items: PersonSummary[]; seeAllHref?: string };
  projects?: { items: DiscoveryProject[]; seeAllHref?: string };
  /** Overrides for a tag page ("Projects tagged X"). */
  headings?: { people?: string; projects?: string };
  /** One list, paged: where "First page" and "Next page" lead, and the way back to the groups. */
  pager?: { firstHref?: string; nextHref?: string };
  backHref?: string;
  /** Shown instead of the groups when both are empty. */
  emptyTitle?: string;
}

/**
 * Results: People and Projects groups, or one full list with a pager. A group with nothing
 * says so; both empty is a "nothing found" screen with a hint, never a blank page. The count
 * is announced politely so a screen-reader user hears that the results changed.
 */
export const ResultsView: FC<ResultsViewProps> = ({
  query,
  people,
  projects,
  headings,
  pager,
  backHref,
  emptyTitle,
}) => {
  const { t } = useLanguage();
  const s = t.search;
  const total = (people?.items.length ?? 0) + (projects?.items.length ?? 0);
  const highlight = query || undefined;

  if (total === 0 && !pager?.firstHref) {
    return (
      <Box role="status" sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" component="h2">
          {emptyTitle ?? fill(s.noResults, { query })}
        </Typography>
        <Typography color="text.secondary">{s.tryAdjusting}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Typography variant="subtitle2" color="text.secondary" role="status" aria-live="polite">
        {fill(s.showingResults, { count: String(total) })}
      </Typography>
      {backHref && (
        <Box>
          <Button component={Link} href={backHref} variant="text" sx={{ minHeight: 44 }}>
            {s.backToResults}
          </Button>
        </Box>
      )}
      {people && (
        <ResultGroup
          heading={headings?.people ?? s.people}
          empty={s.noPeople}
          isEmpty={people.items.length === 0}
          seeAllHref={people.seeAllHref}
          seeAllLabel={s.seeAllPeople}
        >
          {people.items.map((p) => (
            <PersonCard key={p.id} person={p} highlightQuery={highlight} />
          ))}
        </ResultGroup>
      )}
      {projects && (
        <ResultGroup
          heading={headings?.projects ?? s.projects}
          empty={s.noProjects}
          isEmpty={projects.items.length === 0}
          seeAllHref={projects.seeAllHref}
          seeAllLabel={s.seeAllProjects}
        >
          {projects.items.map((p) => (
            <ProjectResultCard key={p.id} project={p} highlightQuery={highlight} />
          ))}
        </ResultGroup>
      )}
      {pager && <Pager firstHref={pager.firstHref} nextHref={pager.nextHref} />}
    </Box>
  );
};
