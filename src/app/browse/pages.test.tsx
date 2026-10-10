// @vitest-environment node
import { type ReactElement, type ReactNode, isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  browseProjects: vi.fn(),
  browsePeople: vi.fn(),
  getUserFacets: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  }
  return { ApiError, ...api };
});
vi.mock("@/lib/requestDictionary", async () => {
  const { en } = await import("@/data/locales/en");
  return { requestDictionary: async () => en };
});
vi.mock("@/components/browse/BrowseLists", () => ({
  BrowseProjectsList: () => null,
  BrowsePeopleList: () => null,
}));
vi.mock("@/components/browse/ProjectFilters", () => ({ ProjectFilters: () => null }));
vi.mock("@/components/browse/PeopleFilters", () => ({ PeopleFilters: () => null }));
vi.mock("@/components/search/SearchError", () => ({ SearchError: () => null }));

const projectsPage = await import("./projects/page");
const peoplePage = await import("./people/page");
const { ApiError } = await import("@/lib/api/client");
const { BrowseProjectsList, BrowsePeopleList } = await import("@/components/browse/BrowseLists");
const { SearchError } = await import("@/components/search/SearchError");

function find(node: ReactNode, type: unknown): ReactElement | undefined {
  if (!isValidElement(node)) return undefined;
  if (node.type === type) return node;
  const children = (node.props as { children?: ReactNode }).children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = find(child, type);
    if (found) return found;
  }
  return undefined;
}
const props = (el: ReactElement | undefined) => (el?.props ?? {}) as Record<string, any>;
const sp = (params: Record<string, string>) => ({ searchParams: Promise.resolve(params) });
const EMPTY = { items: [], nextCursor: null };

beforeEach(() => {
  vi.resetAllMocks();
  api.getUserFacets.mockResolvedValue({ schools: [], majors: [], years: [] });
});

describe("/browse/projects", () => {
  it("asks the API only for checked filters, with the page size", async () => {
    api.browseProjects.mockResolvedValue({ items: [], nextCursor: "n1" });
    const el = await projectsPage.default(sp({ category: "course", sort: "bad", x: "1" }));
    expect(api.browseProjects).toHaveBeenCalledWith({ category: "course", limit: 12 });
    expect(props(find(el, BrowseProjectsList)).pager).toEqual({
      firstHref: undefined,
      nextHref: "/browse/projects?category=course&cursor=n1",
    });
  });

  it("Next page keeps the filters and First page drops the cursor", async () => {
    api.browseProjects.mockResolvedValue({ items: [], nextCursor: "n2" });
    const el = await projectsPage.default(sp({ status: "completed", cursor: "c1" }));
    expect(props(find(el, BrowseProjectsList)).pager).toEqual({
      firstHref: "/browse/projects?status=completed",
      nextHref: "/browse/projects?status=completed&cursor=n2",
    });
  });

  it("an API failure is an error element, never an empty gallery", async () => {
    api.browseProjects.mockRejectedValue(new ApiError(503, "DATABASE_UNAVAILABLE", "down"));
    const el = await projectsPage.default(sp({}));
    expect(props(find(el, SearchError)).code).toBe("DATABASE_UNAVAILABLE");
    expect(find(el, BrowseProjectsList)).toBeUndefined();
  });

  it("metadata: the first page and a category are indexable; cursor, sort and errors are not", async () => {
    api.browseProjects.mockResolvedValue(EMPTY);
    const meta = (p: Record<string, string>) => projectsPage.generateMetadata(sp(p));
    expect((await meta({})).robots).toEqual({ index: true, follow: true });
    const cat = await meta({ category: "course" });
    expect(cat.robots).toEqual({ index: true, follow: true });
    expect(cat.alternates?.canonical).toBe("/browse/projects?category=course");
    const paged = await meta({ category: "course", cursor: "c" });
    expect(paged.robots).toEqual({ index: false, follow: true });
    expect(paged.alternates?.canonical).toBe("/browse/projects?category=course");
    expect((await meta({ sort: "updated" })).robots).toEqual({ index: false, follow: true });
    api.browseProjects.mockRejectedValue(new ApiError(503, "DATABASE_UNAVAILABLE", "down"));
    expect((await meta({ category: "other" })).robots).toEqual({ index: false, follow: true });
  });
});

describe("/browse/people", () => {
  it("asks for checked filters and a year only inside 1950-2100", async () => {
    api.browsePeople.mockResolvedValue(EMPTY);
    await peoplePage.default(sp({ school: "NPUA", gradYear: "1800", major: "  CS " }));
    expect(api.browsePeople).toHaveBeenCalledWith({ school: "NPUA", major: "CS", limit: 12 });
  });

  it("still lists people when the facets fail, and says the filters are incomplete", async () => {
    api.browsePeople.mockResolvedValue({ items: [], nextCursor: null });
    api.getUserFacets.mockRejectedValue(new ApiError(503, "DATABASE_UNAVAILABLE", "down"));
    const el = await peoplePage.default(sp({}));
    expect(find(el, BrowsePeopleList)).toBeDefined();
  });

  it("an API failure is an error element", async () => {
    api.browsePeople.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "slow"));
    const el = await peoplePage.default(sp({}));
    expect(props(find(el, SearchError)).code).toBe("RATE_LIMITED");
  });

  it("metadata: only the unfiltered first page is indexed", async () => {
    api.browsePeople.mockResolvedValue(EMPTY);
    const meta = (p: Record<string, string>) => peoplePage.generateMetadata(sp(p));
    expect((await meta({})).robots).toEqual({ index: true, follow: true });
    expect((await meta({ school: "NPUA" })).robots).toEqual({ index: false, follow: true });
    expect((await meta({ cursor: "c" })).alternates?.canonical).toBe("/browse/people");
  });
});
