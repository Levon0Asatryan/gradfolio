// @vitest-environment node
import { isValidElement } from "react";
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

const { default: EditPage, generateMetadata } = await import("./page");
const { ApiError } = await import("@/lib/api/client");
const page = () => EditPage({ params: Promise.resolve({ id: "p1" }) });

beforeEach(() => vi.resetAllMocks());

describe("/projects/[id]/edit", () => {
  it("renders the form with the stored values for the owner", async () => {
    api.getProject.mockResolvedValue(projectDetail({ id: "p1", title: "EcoRoute", isOwner: true }));
    const el = await page();
    expect(isValidElement(el) && el.props).toMatchObject({
      mode: "edit",
      projectId: "p1",
      initial: { title: "EcoRoute" },
    });
  });

  it("titles the tab with the project's name for its owner only", async () => {
    api.getProject.mockResolvedValue(projectDetail({ title: "EcoRoute", isOwner: true }));
    expect((await generateMetadata({ params: Promise.resolve({ id: "p1" }) })).title).toBe(
      "Edit project: EcoRoute",
    );
    api.getProject.mockResolvedValue(projectDetail({ title: "Secret", isOwner: false }));
    expect((await generateMetadata({ params: Promise.resolve({ id: "p2" }) })).title).toBe(
      "Edit project",
    );
    api.getProject.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    expect((await generateMetadata({ params: Promise.resolve({ id: "p3" }) })).title).toBe(
      "Edit project",
    );
  });

  it("answers not-found when the API says 404 (unknown, or someone else's private project)", async () => {
    api.getProject.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    await expect(page()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("answers not-found for a public project the caller does not own", async () => {
    api.getProject.mockResolvedValue(projectDetail({ isOwner: false }));
    await expect(page()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows another API failure as an error, not as not-found", async () => {
    api.getProject.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    const el = await page();
    expect(isValidElement(el) && el.props).toMatchObject({
      what: "project",
      code: "API_UNREACHABLE",
      returnTo: "/projects/p1/edit",
    });
  });
});
