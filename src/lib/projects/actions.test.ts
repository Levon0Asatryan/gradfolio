// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listMyProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  addAttachment: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
      readonly details?: unknown,
    ) {
      super(message);
    }
  }
  return {
    ApiError,
    listMyProjects: api.listMyProjects,
    createProject: api.createProject,
    updateProject: api.updateProject,
    deleteProject: api.deleteProject,
    addAttachment: api.addAttachment,
  };
});

const { loadMoreProjectsAction, createProjectAction, updateProjectAction, deleteProjectAction } =
  await import("./actions");
const { EMPTY_PROJECT, fieldsFromDetails } = await import("./form");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("loadMoreProjectsAction", () => {
  it("forwards only checked filters and the cursor, with a page size", async () => {
    api.listMyProjects.mockResolvedValue({ items: [{ id: "a" }], nextCursor: "n2" });
    const result = await loadMoreProjectsAction({
      cursor: "n1",
      category: "course",
      userId: "someone-else",
      sort: "bogus",
      state: "draft",
    });
    expect(result).toEqual({ ok: true, items: [{ id: "a" }], nextCursor: "n2" });
    expect(api.listMyProjects).toHaveBeenCalledWith({
      cursor: "n1",
      category: "course",
      limit: 12,
    });
  });

  it("refuses a call without a cursor, and a non-object, without calling the API", async () => {
    expect(await loadMoreProjectsAction({})).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(await loadMoreProjectsAction("x")).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.listMyProjects).not.toHaveBeenCalled();
  });

  it("returns the API's failure code", async () => {
    api.listMyProjects.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "down"));
    expect(await loadMoreProjectsAction({ cursor: "n1" })).toEqual({
      ok: false,
      code: "API_UNREACHABLE",
    });
  });

  it("does not swallow an unexpected error", async () => {
    api.listMyProjects.mockRejectedValue(new Error("boom"));
    await expect(loadMoreProjectsAction({ cursor: "n1" })).rejects.toThrow("boom");
  });
});

const form = { ...EMPTY_PROJECT, title: "EcoRoute" };

describe("createProjectAction", () => {
  it("sends the checked body and returns the new id; no user id anywhere", async () => {
    api.createProject.mockResolvedValue({ id: "p1" });
    expect(await createProjectAction(form)).toEqual({ ok: true, id: "p1" });
    const body = api.createProject.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body.title).toBe("EcoRoute");
    expect(Object.keys(body)).not.toContain("userId");
  });

  it("refuses a bad form without calling the API, with the fields", async () => {
    const result = await createProjectAction({ ...form, title: "" });
    expect(result).toEqual({ ok: false, code: "VALIDATION_FAILED", fields: { title: "required" } });
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it("refuses a smuggled owner field", async () => {
    const result = await createProjectAction({ ...form, userId: "someone-else" });
    expect(result.ok).toBe(false);
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it("maps the API's refusal to form fields", async () => {
    api.createProject.mockRejectedValue(
      new ApiError(400, "VALIDATION_FAILED", "bad", [
        { path: "metadata.endDate", message: "must not be before startDate" },
        { path: "links.2.url", message: "bad" },
        { path: "technologies.1", message: "bad" },
      ]),
    );
    expect(await createProjectAction(form)).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      fields: { endDate: "invalid", "links.2": "invalid", technologies: "invalid" },
    });
  });

  it.each(["LIMIT_REACHED", "API_UNREACHABLE", "UNAUTHENTICATED"])("returns %s", async (code) => {
    api.createProject.mockRejectedValue(new ApiError(409, code, "x"));
    expect(await createProjectAction(form)).toMatchObject({ ok: false, code });
  });

  it("does not swallow an unexpected error", async () => {
    api.createProject.mockRejectedValue(new Error("boom"));
    await expect(createProjectAction(form)).rejects.toThrow("boom");
  });
});

describe("updateProjectAction", () => {
  it("sends only the path id and the checked body", async () => {
    api.updateProject.mockResolvedValue({ id: "p1" });
    expect(await updateProjectAction("p1", form)).toEqual({ ok: true, id: "p1" });
    expect(api.updateProject).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ title: "EcoRoute" }),
    );
  });

  it("passes the API's 404 for someone else's project through", async () => {
    api.updateProject.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    expect(await updateProjectAction("p1", form)).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });

  it("refuses a non-string id and a bad form", async () => {
    expect(await updateProjectAction({ x: 1 }, form)).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
    });
    expect((await updateProjectAction("p1", { ...form, title: "" })).ok).toBe(false);
    expect(api.updateProject).not.toHaveBeenCalled();
  });
});

describe("deleteProjectAction", () => {
  it("deletes by path id only", async () => {
    api.deleteProject.mockResolvedValue(undefined);
    expect(await deleteProjectAction("p1")).toEqual({ ok: true });
    expect(api.deleteProject).toHaveBeenCalledWith("p1");
  });

  it("returns the API's 404 for someone else's project, and refuses a non-string", async () => {
    api.deleteProject.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    expect(await deleteProjectAction("p1")).toEqual({ ok: false, code: "NOT_FOUND" });
    expect(await deleteProjectAction(7)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
  });
});

describe("fieldsFromDetails", () => {
  it("ignores details it cannot read", () => {
    expect(fieldsFromDetails(undefined)).toBeUndefined();
    expect(fieldsFromDetails([{ path: "" }, null, { path: 3 }])).toBeUndefined();
  });
});

describe("createProjectAction with attachments", () => {
  const link = { type: "link", url: "https://x.test/a", title: "Docs" };

  it("creates the project, then each attachment in order", async () => {
    api.createProject.mockResolvedValue({ id: "p1" });
    api.addAttachment.mockResolvedValue({ id: "a" });
    const result = await createProjectAction(form, [link, { ...link, title: "Two" }]);
    expect(result).toEqual({ ok: true, id: "p1" });
    expect(api.addAttachment.mock.calls.map((c) => (c[1] as { title: string }).title)).toEqual([
      "Docs",
      "Two",
    ]);
    expect(api.addAttachment.mock.calls[0]?.[0]).toBe("p1");
  });

  it("keeps the project when an attachment fails, and returns that attachment's values", async () => {
    api.createProject.mockResolvedValue({ id: "p1" });
    api.addAttachment
      .mockRejectedValueOnce(new ApiError(400, "INVALID_FILE", "no"))
      .mockResolvedValueOnce({ id: "b" });
    const result = await createProjectAction(form, [link, { ...link, title: "Two" }]);
    expect(result).toEqual({
      ok: true,
      id: "p1",
      failedAttachments: [
        { type: "link", url: "https://x.test/a", title: "Docs", code: "INVALID_FILE" },
      ],
    });
    expect(api.addAttachment).toHaveBeenCalledTimes(2);
  });

  it("creates nothing when an attachment is malformed", async () => {
    const result = await createProjectAction(form, [link, { type: "link", url: "http://x.test" }]);
    expect(result).toMatchObject({
      ok: false,
      code: "VALIDATION_FAILED",
      fields: { "attachments.1": "invalid" },
    });
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it("refuses a non-list", async () => {
    expect(await createProjectAction(form, "x")).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it("does not add attachments when the project itself is refused", async () => {
    api.createProject.mockRejectedValue(new ApiError(409, "LIMIT_REACHED", "x"));
    expect(await createProjectAction(form, [link])).toMatchObject({
      ok: false,
      code: "LIMIT_REACHED",
    });
    expect(api.addAttachment).not.toHaveBeenCalled();
  });
});
