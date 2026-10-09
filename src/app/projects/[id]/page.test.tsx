// @vitest-environment node
import { isValidElement, type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectDetail } from "@/testing/fixtures";

const api = vi.hoisted(() => ({ getProject: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
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
  return { ApiError, getProject: api.getProject };
});

const { default: ProjectDetailPage, generateMetadata } = await import("./page");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

/** Every element in a tree, to find a prop without rendering. */
function find(node: unknown, pick: (el: ReactElement) => boolean): ReactElement | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = find(child, pick);
      if (hit) return hit;
    }
    return undefined;
  }
  if (!isValidElement(node)) return undefined;
  if (pick(node)) return node;
  return find((node.props as { children?: unknown }).children, pick);
}

describe("/projects/[id] (server)", () => {
  it("awaits params and reads the project by id", async () => {
    api.getProject.mockResolvedValue(projectDetail());
    const el = await ProjectDetailPage({ params: Promise.resolve({ id: "p1" }) });
    expect(api.getProject).toHaveBeenCalledWith("p1");
    expect(isValidElement(el)).toBe(true);
  });

  it("answers not-found for the API's 404 (unknown, or private to someone else)", async () => {
    api.getProject.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    await expect(ProjectDetailPage({ params: Promise.resolve({ id: "p1" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("shows any other API failure as an error, not as not-found or a blank page", async () => {
    api.getProject.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    const el = await ProjectDetailPage({ params: Promise.resolve({ id: "p1" }) });
    expect(isValidElement(el) && el.props).toMatchObject({
      what: "project",
      code: "API_UNREACHABLE",
      returnTo: "/projects/p1",
    });
  });

  it("passes the API's category and summary through; falls back to the generated summary", async () => {
    api.getProject.mockResolvedValue(
      projectDetail({ summary: null, aiSummary: "Generated.", category: "research" }),
    );
    const el = await ProjectDetailPage({ params: Promise.resolve({ id: "p1" }) });
    const header = find(el, (e) => typeof e.type !== "string" && "summary" in (e.props as object));
    expect(header?.props).toMatchObject({ summary: "Generated.", category: "research" });
  });

  it("marks a private or draft project for its owner only", async () => {
    api.getProject.mockResolvedValue(projectDetail({ isOwner: true, isPublic: false }));
    const owner = await ProjectDetailPage({ params: Promise.resolve({ id: "p1" }) });
    expect(find(owner, (e) => "isDraft" in (e.props as object))).toBeDefined();
    api.getProject.mockResolvedValue(projectDetail({ isOwner: false, isPublic: false }));
    const other = await ProjectDetailPage({ params: Promise.resolve({ id: "p2" }) });
    expect(find(other, (e) => "isDraft" in (e.props as object))).toBeUndefined();
  });

  it("titles the tab with the project name, once per request, and survives a failed load", async () => {
    api.getProject.mockResolvedValue(projectDetail({ title: "EcoRoute" }));
    const meta = await generateMetadata({ params: Promise.resolve({ id: "p1" }) });
    expect(meta.title).toBe("EcoRoute – Project");
    api.getProject.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    const none = await generateMetadata({ params: Promise.resolve({ id: "p9" }) });
    expect(none.title).toBe("Project");
  });
});
