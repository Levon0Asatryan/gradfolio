import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResultsView } from "@/components/search/ResultsView";
import { SearchBox } from "@/components/search/SearchBox";
import { SearchError } from "@/components/search/SearchError";
import { ApiError, searchAll, searchPeople, searchProjects } from "@/lib/api/client";
import { SEARCH_PAGE_SIZE, parseSearchQuery, searchHref } from "@/lib/discovery/query";
import { pageOpenGraph } from "@/lib/discovery/seo";
import { requestDictionary } from "@/lib/requestDictionary";
import type { DiscoveryProjectPage, PersonPage, SearchResults } from "@/lib/api/types";
import { LandingHint } from "@/components/search/LandingHint";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Titles are in the request's language. The page with no query is the landing and is
 * indexable; a page with a query (or a cursor) is a result list: `noindex`, and its canonical
 * is the clean `/search`, so crawlers never index a query space.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseSearchQuery(await searchParams);
  const t = await requestDictionary();
  const description = t.search.subtitle;
  return {
    title: query.q ? `${query.q} | ${t.search.title}` : t.search.title,
    description,
    alternates: { canonical: "/search" },
    openGraph: pageOpenGraph({ title: t.search.title, description, url: "/search" }),
    robots: query.q ? { index: false, follow: true } : { index: true, follow: true },
  };
}

/**
 * Global search (6.8): public content only, called from the server with no identity (Q3,
 * Q11). The query lives in the URL, so a search can be shared. An API failure is an error
 * panel, never "nothing found".
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const query = parseSearchQuery(await searchParams);
  const t = await requestDictionary();

  type Loaded =
    | { kind: "landing" }
    | { kind: "grouped"; results: SearchResults }
    | { kind: "people"; page: PersonPage }
    | { kind: "projects"; page: DiscoveryProjectPage }
    | { kind: "error"; code: string };

  const load = async (): Promise<Loaded> => {
    if (!query.q) return { kind: "landing" };
    try {
      const paging = { limit: SEARCH_PAGE_SIZE, cursor: query.cursor };
      if (query.type === "people")
        return { kind: "people", page: await searchPeople(query.q, paging) };
      if (query.type === "projects") {
        return { kind: "projects", page: await searchProjects(query.q, paging) };
      }
      return { kind: "grouped", results: await searchAll(query.q) };
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      return { kind: "error", code: error.code };
    }
  };
  const loaded = await load();
  const q = query.q;
  const pagerFor = (type: "people" | "projects", nextCursor: string | null) => ({
    firstHref: query.cursor ? searchHref({ q, type }) : undefined,
    nextHref: nextCursor ? searchHref({ q, type, cursor: nextCursor }) : undefined,
  });

  let body;
  switch (loaded.kind) {
    case "landing":
      body = <LandingHint />;
      break;
    case "error":
      body = <SearchError code={loaded.code} />;
      break;
    case "people":
      body = (
        <ResultsView
          query={q}
          people={{ items: loaded.page.items }}
          backHref={searchHref({ q })}
          pager={pagerFor("people", loaded.page.nextCursor)}
        />
      );
      break;
    case "projects":
      body = (
        <ResultsView
          query={q}
          projects={{ items: loaded.page.items }}
          backHref={searchHref({ q })}
          pager={pagerFor("projects", loaded.page.nextCursor)}
        />
      );
      break;
    case "grouped":
      body = (
        <ResultsView
          query={q}
          people={{
            items: loaded.results.people.items,
            seeAllHref: loaded.results.people.hasMore
              ? searchHref({ q, type: "people" })
              : undefined,
          }}
          projects={{
            items: loaded.results.projects.items,
            seeAllHref: loaded.results.projects.hasMore
              ? searchHref({ q, type: "projects" })
              : undefined,
          }}
        />
      );
      break;
  }

  return (
    <PageContainer>
      <PageHeader title={t.search.title} subtitle={t.search.subtitle} />
      <SearchBox initialQuery={query.q} />
      {body}
    </PageContainer>
  );
}
