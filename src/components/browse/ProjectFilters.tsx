"use client";

import { FC } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";
import {
  BROWSE_CATEGORIES,
  BROWSE_STATUSES,
  browseHref,
  type ProjectBrowseQuery,
} from "@/lib/discovery/browse";
import { FilterLink } from "./FilterLink";

/** Category, status and sort as links: each keeps the other filters and drops the cursor. */
export const ProjectFilters: FC<{ query: ProjectBrowseQuery }> = ({ query }) => {
  const { t } = useLanguage();
  const b = t.browse;
  const to = (change: Partial<ProjectBrowseQuery>) =>
    browseHref("projects", { ...query, cursor: undefined, ...change });

  const group = (label: string, children: React.ReactNode) => (
    <Box
      role="group"
      aria-label={label}
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
    >
      <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );

  return (
    <Box component="section" aria-label={b.filters} sx={{ display: "grid", gap: 2 }}>
      {group(
        b.categoryLabel,
        <>
          <FilterLink href={to({ category: undefined })} selected={!query.category}>
            {b.all}
          </FilterLink>
          {BROWSE_CATEGORIES.map((c) => (
            <FilterLink key={c} href={to({ category: c })} selected={query.category === c}>
              {t.projects.categories[c]}
            </FilterLink>
          ))}
        </>,
      )}
      {group(
        b.statusLabel,
        <>
          <FilterLink href={to({ status: undefined })} selected={!query.status}>
            {b.all}
          </FilterLink>
          {BROWSE_STATUSES.map((s) => (
            <FilterLink key={s} href={to({ status: s })} selected={query.status === s}>
              {t.projects.status[s]}
            </FilterLink>
          ))}
        </>,
      )}
      {group(
        b.sortLabel,
        <>
          <FilterLink href={to({ sort: undefined })} selected={!query.sort}>
            {b.sortNewest}
          </FilterLink>
          <FilterLink href={to({ sort: "updated" })} selected={query.sort === "updated"}>
            {b.sortUpdated}
          </FilterLink>
        </>,
      )}
    </Box>
  );
};
