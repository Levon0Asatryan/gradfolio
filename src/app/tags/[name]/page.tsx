import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResultsView } from "@/components/search/ResultsView";
import { SearchError } from "@/components/search/SearchError";
import { ApiError, getTag, listTagPeople, listTagProjects } from "@/lib/api/client";
import { SEARCH_PAGE_SIZE, cleanTagName, parseSearchQuery, tagHref } from "@/lib/discovery/query";
import type { DiscoveryProjectPage, PersonPage } from "@/lib/api/types";
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

/**
 * A tag with no public item is the API's 404 and a real 404 here (no soft-404 page to
 * index). The canonical URL is the tag's own spelling, never a cursor or a list type; a
 * paged list is `noindex`.
 */
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const name = cleanTagName((await params).name);
  const t = await requestDictionary();
  if (!name) return { title: t.search.title, robots: { index: false } };
  const { tag } = await loadTag(name);
  const query = parseSearchQuery(await searchParams);
  const canonicalName = tag?.name ?? name;
  const title = fill(t.tags.title, { tag: canonicalName });
  const description = tag
    ? fill(t.tags.summary, { projects: String(tag.projectCount), people: String(tag.peopleCount) })
    : t.search.subtitle;
  return {
    title,
    description,
    alternates: { canonical: tagHref(canonicalName) },
    openGraph: { title, description, url: tagHref(canonicalName), type: "website" },
    robots: query.type || !tag ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const name = cleanTagName((await params).name);
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

  type Loaded =
    | { kind: "groups"; projects: DiscoveryProjectPage; people: PersonPage }
    | { kind: "people"; page: PersonPage }
    | { kind: "projects"; page: DiscoveryProjectPage }
    | { kind: "error"; code: string };

  const load = async (): Promise<Loaded> => {
    try {
      const paging = { limit: SEARCH_PAGE_SIZE, cursor: query.cursor };
      if (query.type === "people") {
        return { kind: "people", page: await listTagPeople(tag.name, paging) };
      }
      if (query.type === "projects") {
        return { kind: "projects", page: await listTagProjects(tag.name, paging) };
      }
      const [projects, people] = await Promise.all([
        listTagProjects(tag.name, { limit: GROUP_SIZE }),
        listTagPeople(tag.name, { limit: GROUP_SIZE }),
      ]);
      return { kind: "groups", projects, people };
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      return { kind: "error", code: caught.code };
    }
  };
  const loaded = await load();
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
