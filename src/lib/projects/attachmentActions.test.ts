// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  addAttachment: vi.fn(),
  updateAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  reorderAttachments: vi.fn(),
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
  return { ApiError, ...api };
});

const {
  addAttachmentAction,
  updateAttachmentAction,
  deleteAttachmentAction,
  reorderAttachmentsAction,
} = await import("./attachmentActions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

const body = { type: "link", url: "https://x.test/a", title: "Docs" };

describe("addAttachmentAction", () => {
  it("sends the checked body for the path's project", async () => {
    api.addAttachment.mockResolvedValue({ id: "a1" });
    expect(await addAttachmentAction("p1", body)).toEqual({ ok: true, value: { id: "a1" } });
    expect(api.addAttachment).toHaveBeenCalledWith("p1", {
      type: "link",
      url: "https://x.test/a",
      title: "Docs",
    });
  });

  it("refuses an http URL and a smuggled field without calling the API", async () => {
    expect((await addAttachmentAction("p1", { ...body, url: "http://x.test" })).ok).toBe(false);
    expect((await addAttachmentAction("p1", { ...body, userId: "z" })).ok).toBe(false);
    expect(await addAttachmentAction(5, body)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.addAttachment).not.toHaveBeenCalled();
  });

  it.each(["LIMIT_REACHED", "INVALID_FILE", "FILE_IN_USE", "NOT_FOUND"])(
    "returns %s",
    async (code) => {
      api.addAttachment.mockRejectedValue(new ApiError(400, code, "x"));
      expect(await addAttachmentAction("p1", body)).toMatchObject({ ok: false, code });
    },
  );

  it("does not swallow an unexpected error", async () => {
    api.addAttachment.mockRejectedValue(new Error("boom"));
    await expect(addAttachmentAction("p1", body)).rejects.toThrow("boom");
  });
});

describe("updateAttachmentAction", () => {
  it("sends url and title only; the type is the server's", async () => {
    api.updateAttachment.mockResolvedValue({ id: "a1" });
    await updateAttachmentAction("p1", "a1", { ...body, type: "pdf" });
    expect(api.updateAttachment).toHaveBeenCalledWith("p1", "a1", {
      url: "https://x.test/a",
      title: "Docs",
    });
  });

  it("refuses non-string ids", async () => {
    expect(await updateAttachmentAction("p1", {}, body)).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
    });
  });
});

describe("deleteAttachmentAction", () => {
  it("deletes by path ids only, and passes a 404 through", async () => {
    api.deleteAttachment.mockResolvedValue(undefined);
    expect(await deleteAttachmentAction("p1", "a1")).toEqual({ ok: true, value: true });
    api.deleteAttachment.mockRejectedValue(new ApiError(404, "NOT_FOUND", "no"));
    expect(await deleteAttachmentAction("p1", "a2")).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
    });
    expect(await deleteAttachmentAction(1, "a1")).toEqual({ ok: false, code: "VALIDATION_FAILED" });
  });
});

describe("reorderAttachmentsAction", () => {
  it("sends the ids as given and returns the new order", async () => {
    api.reorderAttachments.mockResolvedValue([{ id: "b" }, { id: "a" }]);
    expect(await reorderAttachmentsAction("p1", ["b", "a"])).toEqual({
      ok: true,
      value: [{ id: "b" }, { id: "a" }],
    });
    expect(api.reorderAttachments).toHaveBeenCalledWith("p1", ["b", "a"]);
  });

  it.each([["a"], [["a", 2]], [["a", "a"]], [Array.from({ length: 1001 }, (_, i) => `i${i}`)]])(
    "refuses a bad id list %j without calling the API",
    async (ids) => {
      expect(await reorderAttachmentsAction("p1", ids)).toEqual({
        ok: false,
        code: "VALIDATION_FAILED",
      });
      expect(api.reorderAttachments).not.toHaveBeenCalled();
    },
  );

  it("returns ORDER_STALE", async () => {
    api.reorderAttachments.mockRejectedValue(new ApiError(409, "ORDER_STALE", "x"));
    expect(await reorderAttachmentsAction("p1", ["a"])).toMatchObject({
      ok: false,
      code: "ORDER_STALE",
    });
  });
});
