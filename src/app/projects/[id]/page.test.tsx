// @vitest-environment node
import { isValidElement, type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectDetail } from "@/testing/fixtures";

const api = vi.hoisted(() => ({
  getProject: vi.fn(),
  getMe: vi.fn(),
  listProjectTeam: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock("@/lib/auth0", () => ({ auth0: { getSession: api.getSession } }));
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
  return {
    ApiError,
    getProject: api.getProject,
    getMe: api.getMe,
    listProjectTeam: api.listProjectTeam,
  };
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

  it("gives the owner an Edit bar, and nobody else", async () => {
    api.getProject.mockResolvedValue(projectDetail({ isOwner: true, isPublic: false }));
    const owner = await ProjectDetailPage({ params: Promise.resolve({ id: "p1" }) });
    const bar = find(
      owner,
      (e) => "projectId" in (e.props as object) && "isPublic" in (e.props as object),
    );
    expect(bar?.props).toMatchObject({ isPublic: false, isDraft: false });
    api.getProject.mockResolvedValue(projectDetail({ isOwner: false, isPublic: true }));
    const other = await ProjectDetailPage({ params: Promise.resolve({ id: "p2" }) });
    expect(
      find(other, (e) => "projectId" in (e.props as object) && "isPublic" in (e.props as object)),
    ).toBeUndefined();
  });

  describe("the team", () => {
    const team = (el: unknown) =>
      find(el, (e) => "managedFailed" in (e.props as object))?.props as Record<string, unknown>;
    const load = (id = "p1") => ProjectDetailPage({ params: Promise.resolve({ id }) });

    it("gives the owner the team with every status, from its own call", async () => {
      api.getProject.mockResolvedValue(projectDetail({ isOwner: true }));
      api.listProjectTeam.mockResolvedValue([{ id: "m1", status: "pending" }]);
      api.getSession.mockResolvedValue({ user: {} });
      api.getMe.mockResolvedValue({ id: "u-owner" });
      const props = team(await load());
      expect(api.listProjectTeam).toHaveBeenCalledWith("p1");
      expect(props).toMatchObject({
        isOwner: true,
        managed: [{ id: "m1", status: "pending" }],
        managedFailed: false,
        viewerUserId: null,
      });
      expect(api.getMe).not.toHaveBeenCalled();
    });

    it("reports a failed team read instead of showing an empty team", async () => {
      api.getProject.mockResolvedValue(projectDetail({ isOwner: true }));
      api.listProjectTeam.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
      expect(team(await load())).toMatchObject({ managed: null, managedFailed: true });
    });

    it("never asks for the management view of a project that is not the viewer's", async () => {
      api.getProject.mockResolvedValue(projectDetail({ isOwner: false }));
      api.getSession.mockResolvedValue(null);
      const props = team(await load());
      expect(api.listProjectTeam).not.toHaveBeenCalled();
      expect(api.getMe).not.toHaveBeenCalled(); // a visitor costs no extra call
      expect(props).toMatchObject({ isOwner: false, managed: null, viewerUserId: null });
    });

    it("knows a signed-in teammate by their account, and offers no Leave if that cannot be read", async () => {
      api.getProject.mockResolvedValue(projectDetail({ isOwner: false }));
      api.getSession.mockResolvedValue({ user: {} });
      api.getMe.mockResolvedValue({ id: "u-7" });
      expect(team(await load())).toMatchObject({ viewerUserId: "u-7" });
      api.getMe.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
      expect(team(await load("p2"))).toMatchObject({ viewerUserId: null });
    });
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
