import type { Metadata } from "next";
import { cache } from "react";
import { BrowsePeopleList } from "@/components/browse/BrowseLists";
import { PeopleFilters } from "@/components/browse/PeopleFilters";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchError } from "@/components/search/SearchError";
import { ApiError, browsePeople, getUserFacets } from "@/lib/api/client";
import type { PersonPage, UserFacets } from "@/lib/api/types";
import {
  BROWSE_PAGE_SIZE,
  browseHref,
  parsePeopleBrowse,
  type PeopleBrowseQuery,
} from "@/lib/discovery/browse";
import { pageOpenGraph } from "@/lib/discovery/seo";
import { requestDictionary } from "@/lib/requestDictionary";
import { Alert } from "@mui/material";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type Loaded = { page: PersonPage } | { code: string };

const load = cache(async (key: string): Promise<Loaded> => {
  const query = JSON.parse(key) as PeopleBrowseQuery;
  try {
    return { page: await browsePeople({ ...query, limit: BROWSE_PAGE_SIZE }) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { code: error.code };
  }
});

const loadFacets = cache(async (): Promise<UserFacets | null> => {
  try {
    return await getUserFacets();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return null;
  }
});

/** Only the unfiltered first page is indexed: a filter or a cursor is a combination, not a page. */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parsePeopleBrowse(await searchParams);
  const t = await requestDictionary();
  const loaded = await load(JSON.stringify(query));
  const indexable = Object.keys(query).length === 0 && "page" in loaded;
  return {
    title: t.browse.peopleTitle,
    description: t.browse.peopleSubtitle,
    alternates: { canonical: "/browse/people" },
    openGraph: pageOpenGraph({
      title: t.browse.peopleTitle,
      description: t.browse.peopleSubtitle,
      url: "/browse/people",
    }),
    robots: { index: indexable, follow: true },
  };
}

/** The public directory (6.9): public profiles, newest first, filtered by what exists. */
export default async function BrowsePeoplePage({ searchParams }: PageProps) {
  const query = parsePeopleBrowse(await searchParams);
  const t = await requestDictionary();
  const [loaded, facets] = await Promise.all([load(JSON.stringify(query)), loadFacets()]);

  return (
    <PageContainer>
      <PageHeader title={t.browse.peopleTitle} subtitle={t.browse.peopleSubtitle} />
      <PeopleFilters facets={facets} query={query} />
      {!facets && <Alert severity="warning">{t.browse.sectionError}</Alert>}
      {"code" in loaded ? (
        <SearchError code={loaded.code} />
      ) : (
        <BrowsePeopleList
          items={loaded.page.items}
          pager={{
            firstHref: query.cursor
              ? browseHref("people", { ...query, cursor: undefined })
              : undefined,
            nextHref: loaded.page.nextCursor
              ? browseHref("people", { ...query, cursor: loaded.page.nextCursor })
              : undefined,
          }}
        />
      )}
    </PageContainer>
  );
}
