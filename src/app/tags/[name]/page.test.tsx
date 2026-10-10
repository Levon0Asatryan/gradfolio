// @vitest-environment node
import { type ReactElement, type ReactNode, isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getTag: vi.fn(),
  listTagProjects: vi.fn(),
  listTagPeople: vi.fn(),
}));
const nav = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: nav.notFound }));
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
vi.mock("@/components/search/SearchError", () => ({ SearchError: () => null }));

const { default: TagPage, generateMetadata } = await import("./page");
const { ApiError } = await import("@/lib/api/client");
const { ResultsView } = await import("@/components/search/ResultsView");
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
const run = (name: string, search: Record<string, string> = {}) =>
  TagPage({ params: Promise.resolve({ name }), searchParams: Promise.resolve(search) });

const TAG = { name: "C#", projectCount: 4, peopleCount: 2 };

beforeEach(() => vi.resetAllMocks());

describe("/tags/[name] (server)", () => {
  it("asks the API for the decoded name and links See all only where there is more", async () => {
    api.getTag.mockResolvedValue(TAG);
    api.listTagProjects.mockResolvedValue({ items: [], nextCursor: "n" });
    api.listTagPeople.mockResolvedValue({ items: [], nextCursor: null });
    nav.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    const el = await run("C%23");
    expect(api.getTag).toHaveBeenCalledWith("C#");
    const view = props(find(el, ResultsView));
    expect(view.projects.seeAllHref).toBe("/tags/C%23?type=projects");
    expect(view.people.seeAllHref).toBeUndefined();
  });

  it("an unknown tag is a real 404", async () => {
    api.getTag.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    await expect(run("nothing")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("a name over 255 characters is a 404 without a call", async () => {
    await expect(run("x".repeat(256))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(api.getTag).not.toHaveBeenCalled();
  });

  it("an API failure other than 404 is an error element", async () => {
    api.getTag.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    const el = await run("ml");
    expect(props(find(el, SearchError)).code).toBe("API_UNREACHABLE");
  });

  it("a paged list carries the cursor and keeps the type in Next page", async () => {
    api.getTag.mockResolvedValue({ ...TAG, name: "ML" });
    api.listTagPeople.mockResolvedValue({ items: [], nextCursor: "n2" });
    const el = await run("ml", { type: "people", cursor: "c1" });
    expect(api.listTagPeople).toHaveBeenCalledWith("ML", { limit: 12, cursor: "c1" });
    expect(props(find(el, ResultsView)).pager.nextHref).toBe("/tags/ML?type=people&cursor=n2");
  });
});

describe("/tags/[name] metadata (SEO)", () => {
  const meta = (name: string, search: Record<string, string> = {}) =>
    generateMetadata({ params: Promise.resolve({ name }), searchParams: Promise.resolve(search) });

  it("is indexable with the API's spelling as the canonical URL", async () => {
    api.getTag.mockResolvedValue({ ...TAG, name: "ML" });
    const m = await meta("ml");
    expect(m.alternates?.canonical).toBe("/tags/ML");
    expect(m.robots).toEqual({ index: true, follow: true });
  });

  it("a paged list is noindex", async () => {
    api.getTag.mockResolvedValue(TAG);
    const m = await meta("C%23", { type: "projects", cursor: "c" });
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it("an unknown tag is noindex", async () => {
    api.getTag.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    const m = await meta("nothing");
    expect(m.robots).toEqual({ index: false, follow: true });
  });
});
