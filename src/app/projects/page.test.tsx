// @vitest-environment node
import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ listMyProjects: vi.fn() }));
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
  return { ApiError, listMyProjects: api.listMyProjects };
});
vi.mock("./ProjectsContent", () => ({ default: () => null }));
vi.mock("@/components/projects/ProjectsError", () => ({ ProjectsError: () => null }));

const { default: ProjectsPage } = await import("./page");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("/projects (server)", () => {
  it("awaits searchParams and asks the API only for checked filters", async () => {
    api.listMyProjects.mockResolvedValue({ items: [], nextCursor: null });
    const el = await ProjectsPage({
      searchParams: Promise.resolve({ q: "go", category: "nope", sort: "name_asc", limit: "9999" }),
    });
    expect(api.listMyProjects).toHaveBeenCalledWith({ q: "go", sort: "name_asc", limit: 12 });
    expect(isValidElement(el) && el.props).toMatchObject({
      items: [],
      nextCursor: null,
      query: { q: "go", sort: "name_asc" },
    });
  });

  it("shows an API failure as an error element, never as an empty list", async () => {
    api.listMyProjects.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    const el = await ProjectsPage({ searchParams: Promise.resolve({}) });
    expect(isValidElement(el) && el.props).toMatchObject({
      code: "API_UNREACHABLE",
      returnTo: "/projects",
    });
    expect(isValidElement(el) && el.props).not.toHaveProperty("items");
  });

  it("does not hide an unexpected error", async () => {
    api.listMyProjects.mockRejectedValue(new Error("boom"));
    await expect(ProjectsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("boom");
  });
});
