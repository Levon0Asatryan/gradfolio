// @vitest-environment node
import { type ReactElement, type ReactNode, isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  searchAll: vi.fn(),
  searchPeople: vi.fn(),
  searchProjects: vi.fn(),
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
vi.mock("@/components/search/ResultsView", () => ({ ResultsView: () => null }));
vi.mock("@/components/search/SearchBox", () => ({ SearchBox: () => null }));
vi.mock("@/components/search/SearchError", () => ({ SearchError: () => null }));
vi.mock("@/components/search/LandingHint", () => ({ LandingHint: () => null }));

const { default: SearchPage, generateMetadata } = await import("./page");
const { ApiError } = await import("@/lib/api/client");
const { ResultsView } = await import("@/components/search/ResultsView");
const { SearchError } = await import("@/components/search/SearchError");
const { LandingHint } = await import("@/components/search/LandingHint");

/** The first element of a component type anywhere in the tree. */
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
const page = (params: Record<string, string | string[]>) =>
  SearchPage({ searchParams: Promise.resolve(params) });

beforeEach(() => vi.resetAllMocks());

describe("/search (server)", () => {
  it("with no query is the landing and calls nothing", async () => {
    const el = await page({});
    expect(find(el, LandingHint)).toBeDefined();
    expect(api.searchAll).not.toHaveBeenCalled();
  });

  it("asks the API for the checked, cleaned query and links See all only when there is more", async () => {
    api.searchAll.mockResolvedValue({
      query: "c#",
      people: { items: [{ id: "p" }], hasMore: true },
      projects: { items: [], hasMore: false },
    });
    const el = await page({ q: "  C#   go ", evil: "1" });
    expect(api.searchAll).toHaveBeenCalledWith("C# go");
    const view = props(find(el, ResultsView));
    expect(view.people.seeAllHref).toBe("/search?q=C%23+go&type=people");
    expect(view.projects.seeAllHref).toBeUndefined();
  });

  it("a full list is paged with the cursor, and Next page keeps the query and the type", async () => {
    api.searchPeople.mockResolvedValue({ items: [], nextCursor: "next-1" });
    const el = await page({ q: "ml", type: "people", cursor: "cur-0" });
    expect(api.searchPeople).toHaveBeenCalledWith("ml", { limit: 12, cursor: "cur-0" });
    const view = props(find(el, ResultsView));
    expect(view.pager).toEqual({
      firstHref: "/search?q=ml&type=people",
      nextHref: "/search?q=ml&type=people&cursor=next-1",
    });
  });

  it("drops a cursor that does not come with a list type", async () => {
    api.searchAll.mockResolvedValue({
      query: "ml",
      people: { items: [], hasMore: false },
      projects: { items: [], hasMore: false },
    });
    await page({ q: "ml", cursor: "x" });
    expect(api.searchAll).toHaveBeenCalledWith("ml");
  });

  it("an API failure is an error element, never an empty result", async () => {
    api.searchAll.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "slow down"));
    const el = await page({ q: "ml" });
    expect(props(find(el, SearchError)).code).toBe("RATE_LIMITED");
    expect(find(el, ResultsView)).toBeUndefined();
  });

  it("does not hide an unexpected error", async () => {
    api.searchAll.mockRejectedValue(new Error("boom"));
    await expect(page({ q: "ml" })).rejects.toThrow("boom");
  });
});

describe("/search metadata (SEO)", () => {
  const meta = (params: Record<string, string>) =>
    generateMetadata({ searchParams: Promise.resolve(params) });

  it("the landing is indexable and canonical to itself", async () => {
    const m = await meta({});
    expect(m.robots).toEqual({ index: true, follow: true });
    expect(m.alternates?.canonical).toBe("/search");
    // A page's openGraph replaces the layout's, so the share image must be named again.
    expect(m.openGraph).toMatchObject({ images: [{ url: "/opengraph-image.png" }] });
  });

  it("a result page is noindex and canonical to the clean /search", async () => {
    const cases: Array<Record<string, string>> = [
      { q: "ml" },
      { q: "ml", type: "people", cursor: "c" },
    ];
    for (const params of cases) {
      const m = await meta(params);
      expect(m.robots).toEqual({ index: false, follow: true });
      expect(m.alternates?.canonical).toBe("/search");
    }
  });
});
