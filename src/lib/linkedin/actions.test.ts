// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ upload: vi.fn(), preview: vi.fn(), confirm: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
      readonly details?: unknown,
      readonly retryAfter?: number,
    ) {
      super(message);
    }
  }
  return {
    ApiError,
    createLinkedinUpload: api.upload,
    previewLinkedinImport: api.preview,
    confirmLinkedinImport: api.confirm,
  };
});

const { startLinkedinUploadAction, previewLinkedinAction, confirmLinkedinAction } =
  await import("./actions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

const ticket = {
  uploadId: "6f1f0c1e-0d4f-4c53-9f0a-0c9a3b1d2e3f",
  uploadUrl: "https://storage.googleapis.com/bucket/key?sig=x",
  method: "PUT",
  headers: { "content-type": "application/zip" },
  expiresAt: "2026-01-01T00:00:00Z",
};

describe("startLinkedinUploadAction", () => {
  it("forwards only the size and returns the signed URL and the headers", async () => {
    api.upload.mockResolvedValue(ticket);
    const result = await startLinkedinUploadAction({ size: 1234, userId: "x" });
    expect(api.upload).toHaveBeenCalledWith(1234);
    expect(result).toEqual({
      ok: true,
      uploadId: ticket.uploadId,
      uploadUrl: ticket.uploadUrl,
      headers: ticket.headers,
    });
  });
  it("refuses a bad size before any API call", async () => {
    for (const bad of [
      null,
      {},
      { size: "5" },
      { size: 0 },
      { size: 1.5 },
      { size: 100_000_001 },
    ]) {
      expect(await startLinkedinUploadAction(bad)).toEqual({
        ok: false,
        code: "VALIDATION_FAILED",
      });
    }
    expect(api.upload).not.toHaveBeenCalled();
  });
  it("refuses a URL that is not Google Cloud Storage over https", async () => {
    for (const uploadUrl of [
      "http://storage.googleapis.com/b/k",
      "https://evil.example/b/k",
      "https://storage.googleapis.com.evil.example/b/k",
    ]) {
      api.upload.mockResolvedValue({ ...ticket, uploadUrl });
      expect(await startLinkedinUploadAction({ size: 5 })).toEqual({
        ok: false,
        code: "UPLOAD_URL_REJECTED",
      });
    }
  });
  it("passes the API's code and Retry-After through", async () => {
    api.upload.mockRejectedValue(new ApiError(429, "RATE_LIMITED", "slow", undefined, 30));
    expect(await startLinkedinUploadAction({ size: 5 })).toEqual({
      ok: false,
      code: "RATE_LIMITED",
      retryAfter: 30,
    });
  });
});

describe("previewLinkedinAction", () => {
  it("takes only a UUID", async () => {
    expect(await previewLinkedinAction({ uploadId: "../x" })).toMatchObject({ ok: false });
    expect(await previewLinkedinAction(null)).toMatchObject({ ok: false });
    expect(api.preview).not.toHaveBeenCalled();
    api.preview.mockResolvedValue({ skills: [] });
    expect(await previewLinkedinAction({ uploadId: ticket.uploadId })).toEqual({
      ok: true,
      preview: { skills: [] },
    });
  });
  it("passes an import error code through", async () => {
    api.preview.mockRejectedValue(new ApiError(422, "IMPORT_NOT_ZIP", "no"));
    expect(await previewLinkedinAction({ uploadId: ticket.uploadId })).toEqual({
      ok: false,
      code: "IMPORT_NOT_ZIP",
    });
  });
});

const entry = { title: "T", organization: "O", start: "2020-01", end: null, summary: "" };
const body = (over: Record<string, unknown> = {}) => ({
  experience: [],
  education: [],
  certifications: [],
  skills: [],
  ...over,
});

describe("confirmLinkedinAction", () => {
  it("refuses an empty selection without calling the API", async () => {
    expect(await confirmLinkedinAction(body())).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.confirm).not.toHaveBeenCalled();
  });
  it("sends valid entries and skills", async () => {
    api.confirm.mockResolvedValue({ added: {}, skipped: {} });
    const result = await confirmLinkedinAction(body({ experience: [entry], skills: ["A"] }));
    expect(result.ok).toBe(true);
    expect(api.confirm).toHaveBeenCalledTimes(1);
    expect(api.confirm.mock.calls[0]?.[0]).toMatchObject({ skills: ["A"] });
  });
  it("refuses a half-filled entry, an unknown field and a missing section", async () => {
    const bad = [
      body({ experience: [{ ...entry, title: "" }] }),
      body({ experience: [{ ...entry, extra: 1 }] }),
      { experience: [entry] },
      body({ education: [{ institution: "I", degree: "D", startYear: 2000 }] }),
      body({ skills: "A" }),
    ];
    for (const input of bad) {
      expect(await confirmLinkedinAction(input)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    }
    expect(api.confirm).not.toHaveBeenCalled();
  });
  it("refuses more entries than the API takes", async () => {
    expect(
      await confirmLinkedinAction(body({ experience: Array.from({ length: 501 }, () => entry) })),
    ).toMatchObject({ ok: false });
  });
  it("passes LIMIT_REACHED through", async () => {
    api.confirm.mockRejectedValue(new ApiError(409, "LIMIT_REACHED", "full"));
    expect(await confirmLinkedinAction(body({ skills: ["A"] }))).toEqual({
      ok: false,
      code: "LIMIT_REACHED",
    });
  });
});
