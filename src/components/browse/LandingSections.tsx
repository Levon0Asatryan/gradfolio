"use client";

import { FC, type ReactNode } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PersonCard from "@/components/search/PersonCard";
import ProjectResultCard from "@/components/search/ProjectResultCard";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { DiscoveryProject, PersonSummary, TagCloudItem } from "@/lib/api/types";
import { TagCloud } from "./TagCloud";

/** A section's data, or the fact that it could not be loaded: a failure is shown, not hidden. */
export type Section<T> = { items: T } | { failed: true };

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
  gap: 3,
} as const;

/**
 * What `/search` shows before a query (6.8/6.9): the tag cloud, the newest projects and the
 * newest people, each with a link to its full list. Each section fails alone and says so.
 */
export const LandingSections: FC<{
  cloud: Section<TagCloudItem[]>;
  projects: Section<DiscoveryProject[]>;
  people: Section<PersonSummary[]>;
}> = ({ cloud, projects, people }) => {
  const { t } = useLanguage();
  const b = t.browse;

  const section = (heading: string, body: ReactNode, link?: { href: string; label: string }) => (
    <Box component="section" aria-label={heading} sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h5" component="h2">
          {heading}
        </Typography>
        {link && (
          <Button component={Link} href={link.href} variant="text" sx={{ minHeight: 44 }}>
            {link.label}
          </Button>
        )}
      </Box>
      {body}
    </Box>
  );

  const failed = <Alert severity="error">{b.sectionError}</Alert>;

  return (
    <Box sx={{ display: "grid", gap: 5 }}>
      <Typography color="text.secondary">{t.search.landingHint}</Typography>
      {section(b.cloudTitle, "failed" in cloud ? failed : <TagCloud items={cloud.items} />)}
      {section(
        b.newestProjects,
        "failed" in projects ? (
          failed
        ) : projects.items.length === 0 ? (
          <Typography color="text.secondary">{b.noProjects}</Typography>
        ) : (
          <Box sx={grid}>
            {projects.items.map((p) => (
              <ProjectResultCard key={p.id} project={p} />
            ))}
          </Box>
        ),
        { href: "/browse/projects", label: b.browseProjects },
      )}
      {section(
        b.newestPeople,
        "failed" in people ? (
          failed
        ) : people.items.length === 0 ? (
          <Typography color="text.secondary">{b.noPeople}</Typography>
        ) : (
          <Box sx={grid}>
            {people.items.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </Box>
        ),
        { href: "/browse/people", label: b.browsePeople },
      )}
    </Box>
  );
};
