import type { Metadata } from "next";
import { cache } from "react";
import { BrowseProjectsList } from "@/components/browse/BrowseLists";
import { ProjectFilters } from "@/components/browse/ProjectFilters";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchError } from "@/components/search/SearchError";
import { ApiError, browseProjects } from "@/lib/api/client";
import type { DiscoveryProjectPage } from "@/lib/api/types";
import {
  BROWSE_PAGE_SIZE,
  browseHref,
  parseProjectBrowse,
  type ProjectBrowseQuery,
} from "@/lib/discovery/browse";
import { pageOpenGraph } from "@/lib/discovery/seo";
import { requestDictionary } from "@/lib/requestDictionary";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type Loaded = { page: DiscoveryProjectPage } | { code: string };

/** One call per request, shared by the metadata and the page (the key is the query's JSON). */
const load = cache(async (key: string): Promise<Loaded> => {
  const query = JSON.parse(key) as ProjectBrowseQuery;
  try {
    return { page: await browseProjects({ ...query, limit: BROWSE_PAGE_SIZE }) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { code: error.code };
  }
});

/**
 * The first page of the default order, and a category or status filter, are indexable at
 * their own URL; a cursor page, another sort and an error page are not, and a cursor page
 * names the first page as its canonical.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseProjectBrowse(await searchParams);
  const t = await requestDictionary();
  const loaded = await load(JSON.stringify(query));
  const canonical = browseHref("projects", { ...query, cursor: undefined });
  const indexable = !query.cursor && !query.sort && "page" in loaded;
  return {
    title: t.browse.projectsTitle,
    description: t.browse.projectsSubtitle,
    alternates: { canonical },
    openGraph: pageOpenGraph({
      title: t.browse.projectsTitle,
      description: t.browse.projectsSubtitle,
      url: canonical,
    }),
    robots: { index: indexable, follow: true },
  };
}

/** The public gallery (6.9): published projects of public profiles, filters in the URL. */
export default async function BrowseProjectsPage({ searchParams }: PageProps) {
  const query = parseProjectBrowse(await searchParams);
  const t = await requestDictionary();
  const loaded = await load(JSON.stringify(query));

  return (
    <PageContainer>
      <PageHeader title={t.browse.projectsTitle} subtitle={t.browse.projectsSubtitle} />
      <ProjectFilters query={query} />
      {"code" in loaded ? (
        <SearchError code={loaded.code} />
      ) : (
        <BrowseProjectsList
          items={loaded.page.items}
          pager={{
            firstHref: query.cursor
              ? browseHref("projects", { ...query, cursor: undefined })
              : undefined,
            nextHref: loaded.page.nextCursor
              ? browseHref("projects", { ...query, cursor: loaded.page.nextCursor })
              : undefined,
          }}
        />
      )}
    </PageContainer>
  );
}
