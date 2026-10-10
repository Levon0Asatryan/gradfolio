import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResultsView } from "@/components/search/ResultsView";
import { SearchError } from "@/components/search/SearchError";
import { ApiError, getTag, listTagPeople, listTagProjects } from "@/lib/api/client";
import {
  SEARCH_PAGE_SIZE,
  parseSearchQuery,
  tagHref,
  tagNameFromDecoded,
  tagNameFromPageParam,
} from "@/lib/discovery/query";
import type { DiscoveryProjectPage, PersonPage } from "@/lib/api/types";
import { pageOpenGraph } from "@/lib/discovery/seo";
import { requestDictionary } from "@/lib/requestDictionary";

export const dynamic = "force-dynamic";

/** The grouped view shows this many of each; "See all" leads to the paged list. */
const GROUP_SIZE = 6;

interface PageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** One API call per request, shared by the metadata and the page. */
const loadTag = cache(async (name: string) => {
  try {
    return { tag: await getTag(name) };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { error };
  }
});

type Loaded =
  | { kind: "groups"; projects: DiscoveryProjectPage; people: PersonPage }
  | { kind: "people"; page: PersonPage }
  | { kind: "projects"; page: DiscoveryProjectPage }
  | { kind: "error"; code: string };

/**
 * The lists under a tag, shared (per request) by the metadata and the page, so the metadata
 * knows whether the page it describes actually has its content. Arguments are primitives:
 * React's cache keys on them.
 */
const loadLists = cache(async (name: string, type: string, cursor: string): Promise<Loaded> => {
  try {
    const paging = { limit: SEARCH_PAGE_SIZE, cursor: cursor || undefined };
    if (type === "people") return { kind: "people", page: await listTagPeople(name, paging) };
    if (type === "projects") return { kind: "projects", page: await listTagProjects(name, paging) };
    const [projects, people] = await Promise.all([
      listTagProjects(name, { limit: GROUP_SIZE }),
      listTagPeople(name, { limit: GROUP_SIZE }),
    ]);
    return { kind: "groups", projects, people };
  } catch (caught) {
    if (!(caught instanceof ApiError)) throw caught;
    return { kind: "error", code: caught.code };
  }
});

/**
 * A tag with no public item is the API's 404 and a real 404 here (no soft-404 page to
 * index). The canonical URL is the tag's own spelling, never a cursor or a list type; a
 * paged list is `noindex`.
 */
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  // Already decoded by Next: never decode the metadata's params again.
  const name = tagNameFromDecoded((await params).name);
  const t = await requestDictionary();
  if (!name) return { title: t.search.title, robots: { index: false } };
  const { tag } = await loadTag(name);
  const query = parseSearchQuery(await searchParams);
  // Indexable only when the page really has its content: a tag whose lists failed to load
  // is an error page and must not be indexed as an empty tag.
  const loaded = tag ? await loadLists(tag.name, query.type ?? "", query.cursor ?? "") : null;
  const canonicalName = tag?.name ?? name;
  const title = fill(t.tags.title, { tag: canonicalName });
  const description = tag
    ? fill(t.tags.summary, { projects: String(tag.projectCount), people: String(tag.peopleCount) })
    : t.search.subtitle;
  return {
    title,
    description,
    alternates: { canonical: tagHref(canonicalName) },
    openGraph: pageOpenGraph({ title, description, url: tagHref(canonicalName) }),
    robots:
      query.type || !tag || loaded?.kind === "error"
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  // The page's `params` are still encoded (see tagNameFromPageParam).
  const name = tagNameFromPageParam((await params).name);
  if (!name) notFound();
  const { tag, error } = await loadTag(name);
  if (error) {
    if (error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer>
        <SearchError code={error.code} />
      </PageContainer>
    );
  }
  if (!tag) notFound();

  const t = await requestDictionary();
  const query = parseSearchQuery(await searchParams);
  const base = tagHref(tag.name);
  const typeHref = (type: "people" | "projects", cursor?: string) =>
    `${base}?type=${type}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
  const headings = {
    projects: fill(t.tags.projectsTagged, { tag: tag.name }),
    people: fill(t.tags.peopleWith, { tag: tag.name }),
  };

  const loaded = await loadLists(tag.name, query.type ?? "", query.cursor ?? "");
  const pagerFor = (type: "people" | "projects", nextCursor: string | null) => ({
    firstHref: query.cursor ? typeHref(type) : undefined,
    nextHref: nextCursor ? typeHref(type, nextCursor) : undefined,
  });

  let body;
  switch (loaded.kind) {
    case "error":
      body = <SearchError code={loaded.code} />;
      break;
    case "people":
      body = (
        <ResultsView
          query=""
          people={{ items: loaded.page.items }}
          headings={headings}
          backHref={base}
          pager={pagerFor("people", loaded.page.nextCursor)}
        />
      );
      break;
    case "projects":
      body = (
        <ResultsView
          query=""
          projects={{ items: loaded.page.items }}
          headings={headings}
          backHref={base}
          pager={pagerFor("projects", loaded.page.nextCursor)}
        />
      );
      break;
    case "groups":
      body = (
        <ResultsView
          query=""
          headings={headings}
          projects={{
            items: loaded.projects.items,
            seeAllHref: loaded.projects.nextCursor ? typeHref("projects") : undefined,
          }}
          people={{
            items: loaded.people.items,
            seeAllHref: loaded.people.nextCursor ? typeHref("people") : undefined,
          }}
        />
      );
      break;
  }

  return (
    <PageContainer>
      <PageHeader
        title={fill(t.tags.title, { tag: tag.name })}
        subtitle={fill(t.tags.summary, {
          projects: String(tag.projectCount),
          people: String(tag.peopleCount),
        })}
      />
      {body}
    </PageContainer>
  );
}
