"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import ProjectsList from "@/components/projects/ProjectsList";
import ProjectsListToolbar from "@/components/projects/ProjectsListToolbar";
import { FlashToast } from "@/components/shared/FlashToast";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { ProjectSummary } from "@/lib/api/types";
import { loadMoreProjectsAction } from "@/lib/projects/actions";

/** What the URL holds: the server read these and fetched the first page for them. */
export interface ProjectsQuery {
  q?: string;
  category?: string;
  sort?: string;
}

export interface ProjectsContentProps {
  items: ProjectSummary[];
  nextCursor: string | null;
  query: ProjectsQuery;
}

const SEARCH_DEBOUNCE_MS = 300;

function href(query: ProjectsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/projects?${qs}` : "/projects";
}

export default function ProjectsContent({ items, nextCursor, query }: ProjectsContentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [search, setSearch] = useState(query.q ?? "");
  const [, startTransition] = useTransition();

  const go = useCallback(
    (next: ProjectsQuery) => startTransition(() => router.replace(href(next))),
    [router],
  );

  // The search box types freely; the URL (and so the server) follows 300 ms after the last key.
  useEffect(() => {
    if (search.trim() === (query.q ?? "")) return;
    const timer = setTimeout(
      () => go({ ...query, q: search.trim() || undefined }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search, query, go]);

  const filtered = Boolean(query.q || query.category);
  // A new page of results (other filters, or the same list after a change) starts the feed afresh.
  const feedKey = `${JSON.stringify(query)}|${items.map((p) => p.id).join(",")}`;

  return (
    <PageContainer>
      <FlashToast />
      <PageHeader
        title={t.common.projects}
        subtitle={t.projects.subtitle}
        action={
          <Button component={Link} href="/projects/new" variant="contained" startIcon={<AddIcon />}>
            {t.common.addNewProject}
          </Button>
        }
      />
      <ProjectsListToolbar
        search={search}
        onSearchChange={setSearch}
        category={query.category ?? ""}
        onCategoryChange={(category) => go({ ...query, category: category || undefined })}
        sort={query.sort ?? "newest"}
        onSortChange={(sort) => go({ ...query, sort })}
      />
      <ProjectsFeed
        key={feedKey}
        initialItems={items}
        initialCursor={nextCursor}
        query={query}
        filtered={filtered}
        onClearFilters={() => {
          setSearch("");
          go({ sort: query.sort });
        }}
      />
    </PageContainer>
  );
}

function ProjectsFeed({
  initialItems,
  initialCursor,
  query,
  filtered,
  onClearFilters,
}: {
  initialItems: ProjectSummary[];
  initialCursor: string | null;
  query: ProjectsQuery;
  filtered: boolean;
  onClearFilters: () => void;
}) {
  const { t } = useLanguage();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const result = await loadMoreProjectsAction({ ...query, cursor });
      if (result.ok) {
        setItems((prev) => [...prev, ...result.items]);
        setCursor(result.nextCursor);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProjectsList
        projects={items}
        searchQuery={query.q}
        filtered={filtered}
        onClearFilters={onClearFilters}
      />
      {failed && (
        <Alert severity="error" role="alert">
          {t.projects.loadMoreFailed}
        </Alert>
      )}
      {cursor && (
        <Box sx={{ textAlign: "center" }}>
          <Button variant="outlined" onClick={loadMore} disabled={loading}>
            {t.projects.loadMore}
          </Button>
        </Box>
      )}
    </>
  );
}
