// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ createUpload: vi.fn() }));
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
  return { ApiError, createUpload: api.createUpload };
});

const { signUploadAction } = await import("./actions");
const { ApiError } = await import("@/lib/api/client");

const TICKET = {
  uploadUrl: "https://gradfolio-files.storage.googleapis.com/u/1/a.png?X-Goog-Signature=abc",
  method: "PUT",
  headers: { "Content-Type": "image/png", "x-goog-content-length-range": "3,3" },
  fileUrl: "https://gradfolio-files.storage.googleapis.com/u/1/a.png",
  expiresAt: "2026-10-09T10:00:00Z",
};
const req = { purpose: "hero", contentType: "image/png", size: 3, projectId: "p1" };

beforeEach(() => vi.resetAllMocks());

describe("signUploadAction", () => {
  it("asks the API and hands the browser the URL, the headers and the file URL only", async () => {
    api.createUpload.mockResolvedValue(TICKET);
    const result = await signUploadAction(req);
    expect(result).toEqual({
      ok: true,
      uploadUrl: TICKET.uploadUrl,
      headers: TICKET.headers,
      fileUrl: TICKET.fileUrl,
    });
    expect(api.createUpload).toHaveBeenCalledWith({
      purpose: "hero",
      contentType: "image/png",
      size: 3,
      projectId: "p1",
    });
    expect(JSON.stringify(result)).not.toMatch(/bearer|token|authorization/i);
  });

  it("passes the ticket's headers on as they are, including ones added later", async () => {
    const headers = { ...TICKET.headers, "x-goog-if-generation-match": "0" };
    api.createUpload.mockResolvedValue({ ...TICKET, headers });
    expect(await signUploadAction(req)).toMatchObject({ ok: true, headers });
  });

  it("needs no project for an avatar, and refuses one", async () => {
    api.createUpload.mockResolvedValue(TICKET);
    expect(
      (await signUploadAction({ purpose: "avatar", contentType: "image/png", size: 3 })).ok,
    ).toBe(true);
    expect(
      (
        await signUploadAction({
          purpose: "avatar",
          contentType: "image/png",
          size: 3,
          projectId: "p1",
        })
      ).ok,
    ).toBe(false);
  });

  it.each([
    ["no project for a hero", { ...req, projectId: undefined }],
    ["an unknown purpose", { ...req, purpose: "admin" }],
    ["an SVG", { ...req, contentType: "image/svg+xml" }],
    ["a PDF as a hero", { ...req, contentType: "application/pdf" }],
    ["a size over 5 MB for an image", { ...req, size: 5 * 1024 * 1024 + 1 }],
    ["a fractional size", { ...req, size: 1.5 }],
    ["a string size", { ...req, size: "3" }],
    ["not an object", "x"],
  ])("refuses %s without calling the API", async (_n, input) => {
    expect(await signUploadAction(input)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.createUpload).not.toHaveBeenCalled();
  });

  it("allows a PDF as an attachment up to 20 MB", async () => {
    api.createUpload.mockResolvedValue(TICKET);
    const pdf = { purpose: "attachment", contentType: "application/pdf", projectId: "p1" };
    expect((await signUploadAction({ ...pdf, size: 20 * 1024 * 1024 })).ok).toBe(true);
    expect((await signUploadAction({ ...pdf, size: 20 * 1024 * 1024 + 1 })).ok).toBe(false);
  });

  it("passes STORAGE_UNAVAILABLE and LIMIT_REACHED through", async () => {
    for (const code of ["STORAGE_UNAVAILABLE", "LIMIT_REACHED", "NOT_FOUND", "RATE_LIMITED"]) {
      api.createUpload.mockRejectedValueOnce(new ApiError(503, code, "x"));
      expect(await signUploadAction(req)).toEqual({ ok: false, code });
    }
  });

  it.each([
    "http://x.storage.googleapis.com/u/1/a.png",
    "https://evil.test/u/1/a.png",
    "https://storage.googleapis.com.evil.test/a",
    "javascript:alert(1)",
    "not a url",
  ])("never gives the browser an upload URL like %s", async (uploadUrl) => {
    api.createUpload.mockResolvedValue({ ...TICKET, uploadUrl });
    expect(await signUploadAction(req)).toEqual({ ok: false, code: "UPLOAD_URL_REJECTED" });
  });

  it("refuses a ticket that is not a PUT", async () => {
    api.createUpload.mockResolvedValue({ ...TICKET, method: "POST" });
    expect(await signUploadAction(req)).toEqual({ ok: false, code: "UPLOAD_URL_REJECTED" });
  });

  it("does not swallow an unexpected error", async () => {
    api.createUpload.mockRejectedValue(new Error("boom"));
    await expect(signUploadAction(req)).rejects.toThrow("boom");
  });
});
