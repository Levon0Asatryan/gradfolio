// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ list: vi.fn(), imp: vi.fn(), sync: vi.fn(), preview: vi.fn() }));
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
    listGithubRepos: api.list,
    importGithubRepos: api.imp,
    previewGithubImport: api.preview,
    syncGithubProject: api.sync,
  };
});

const {
  listGithubReposAction,
  importGithubReposAction,
  previewGithubImportAction,
  syncProjectAction,
} = await import("./importActions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("listGithubReposAction", () => {
  it("forwards a trimmed search and a cursor, nothing else", async () => {
    api.list.mockResolvedValue({ items: [], nextCursor: null, rateLimit: {} });
    await listGithubReposAction({ q: "  iot  ", cursor: "c2", userId: "x" });
    expect(api.list).toHaveBeenCalledWith({ cursor: "c2", q: "iot" });
  });
  it("refuses a malformed argument before any API call", async () => {
    for (const bad of [
      null,
      "x",
      { cursor: 5 },
      { cursor: "x".repeat(21) },
      { q: 7 },
      { q: "x".repeat(401) },
    ]) {
      expect(await listGithubReposAction(bad)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    }
    expect(api.list).not.toHaveBeenCalled();
  });
  it("passes the code and Retry-After of a rate limit", async () => {
    api.list.mockRejectedValue(new ApiError(429, "GITHUB_RATE_LIMITED", "x", undefined, 60));
    expect(await listGithubReposAction({})).toEqual({
      ok: false,
      code: "GITHUB_RATE_LIMITED",
      retryAfter: 60,
    });
  });
});

describe("importGithubReposAction", () => {
  it("imports the ids, with only the overrides it was given", async () => {
    api.imp.mockResolvedValue({ results: [], rateLimit: {} });
    await importGithubReposAction({
      repoIds: [1, 2],
      overrides: { "2": { title: " My title ", technologies: [" Go ", "Rust"] } },
    });
    expect(api.imp).toHaveBeenCalledWith([1, 2], {
      "2": { title: "My title", technologies: ["Go", "Rust"] },
    });
  });

  it("an untouched import sends no overrides at all", async () => {
    api.imp.mockResolvedValue({ results: [], rateLimit: {} });
    await importGithubReposAction({ repoIds: [5], overrides: {} });
    expect(api.imp).toHaveBeenCalledWith([5], {});
  });

  it.each([
    ["no ids", { repoIds: [] }],
    ["more than ten", { repoIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }],
    ["a duplicate id", { repoIds: [1, 1] }],
    ["a non-integer id", { repoIds: [1.5] }],
    ["a zero id", { repoIds: [0] }],
    ["a string id", { repoIds: ["1"] }],
    [
      "an edit for a repository not in the import",
      { repoIds: [1], overrides: { "2": { title: "x" } } },
    ],
    ["an unknown override key", { repoIds: [1], overrides: { "1": { isPublic: false } } }],
    ["an empty title", { repoIds: [1], overrides: { "1": { title: "  " } } }],
    ["a 501-character title", { repoIds: [1], overrides: { "1": { title: "x".repeat(501) } } }],
    [
      "a repoUrl (not editable)",
      { repoIds: [1], overrides: { "1": { repoUrl: "https://x.example" } } },
    ],
    [
      "31 technologies",
      { repoIds: [1], overrides: { "1": { technologies: Array(31).fill("a") } } },
    ],
    ["overrides that are not an object", { repoIds: [1], overrides: [] }],
  ])("refuses %s before any API call", async (_n, input) => {
    expect(await importGithubReposAction(input)).toEqual({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.imp).not.toHaveBeenCalled();
  });

  it("returns the API's refusal as its code", async () => {
    api.imp.mockRejectedValue(new ApiError(409, "GITHUB_NOT_CONNECTED", "x"));
    expect(await importGithubReposAction({ repoIds: [1] })).toEqual({
      ok: false,
      code: "GITHUB_NOT_CONNECTED",
    });
  });
});

describe("previewGithubImportAction", () => {
  it("asks the API for the drafts of valid ids and saves nothing", async () => {
    api.preview.mockResolvedValue({ results: [], rateLimit: {} });
    await previewGithubImportAction({ repoIds: [1, 2] });
    expect(api.preview).toHaveBeenCalledWith([1, 2]);
    expect(api.imp).not.toHaveBeenCalled();
  });
  it("refuses bad ids before any API call", async () => {
    for (const bad of [null, {}, { repoIds: [] }, { repoIds: [1, 1] }, { repoIds: ["1"] }]) {
      expect(await previewGithubImportAction(bad)).toEqual({
        ok: false,
        code: "VALIDATION_FAILED",
      });
    }
    expect(api.preview).not.toHaveBeenCalled();
  });
});

describe("syncProjectAction", () => {
  it("passes the project id and dryRun only", async () => {
    api.sync.mockResolvedValue({ dryRun: true, fields: [], systemUpdated: [] });
    await syncProjectAction({ projectId: "0b6f2c1e-1111-4222-8333-444455556666", dryRun: true });
    expect(api.sync).toHaveBeenCalledWith("0b6f2c1e-1111-4222-8333-444455556666", true);
  });
  it("refuses a missing flag", async () => {
    expect(await syncProjectAction({ projectId: "x" })).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
    });
  });
});
