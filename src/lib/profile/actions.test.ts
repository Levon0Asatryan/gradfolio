// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const api = vi.hoisted(() => ({
  updateMyProfile: vi.fn(),
  completeOnboarding: vi.fn(),
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
  reorderEntries: vi.fn(),
  replaceSkills: vi.fn(),
}));
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

const {
  updateProfileAction,
  completeOnboardingAction,
  saveEntryAction,
  deleteEntryAction,
  reorderEntriesAction,
  replaceSkillsAction,
} = await import("./actions");
const { ApiError } = await import("@/lib/api/client");

beforeEach(() => vi.resetAllMocks());

describe("updateProfileAction", () => {
  it("forwards the checked patch to the API", async () => {
    api.updateMyProfile.mockResolvedValue({});
    await expect(updateProfileAction({ name: " Ani ", isPublic: false })).resolves.toEqual({
      ok: true,
    });
    expect(api.updateMyProfile).toHaveBeenCalledWith({ name: "Ani", isPublic: false });
  });

  it("never calls the API with input that fails the check", async () => {
    const result = await updateProfileAction({ name: "Ani", verified: true });
    expect(result).toMatchObject({ ok: false, code: "VALIDATION_FAILED" });
    expect(api.updateMyProfile).not.toHaveBeenCalled();
  });

  it("drops nothing silently: the fields are named", async () => {
    await expect(updateProfileAction({ avatarUrl: "javascript:x" })).resolves.toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      fields: { avatarUrl: "invalid_url" },
    });
  });

  it.each(["UNAUTHENTICATED", "VALIDATION_FAILED", "DATABASE_UNAVAILABLE"])(
    "returns the API's %s as a result",
    async (code) => {
      api.updateMyProfile.mockRejectedValue(new ApiError(400, code, "x"));
      await expect(updateProfileAction({ name: "Ani" })).resolves.toEqual({ ok: false, code });
    },
  );

  it("does not swallow a bug", async () => {
    api.updateMyProfile.mockRejectedValue(new TypeError("boom"));
    await expect(updateProfileAction({ name: "Ani" })).rejects.toThrow("boom");
  });
});

describe("completeOnboardingAction", () => {
  it("completes onboarding", async () => {
    api.completeOnboarding.mockResolvedValue({ onboarded: true });
    await expect(completeOnboardingAction()).resolves.toEqual({ ok: true });
  });

  it("reports a failure instead of pretending it worked", async () => {
    api.completeOnboarding.mockRejectedValue(new ApiError(503, "API_UNREACHABLE", "x"));
    await expect(completeOnboardingAction()).resolves.toEqual({
      ok: false,
      code: "API_UNREACHABLE",
    });
  });
});

const EDU = { institution: "NPUA", degree: "B.Sc.", field: "Informatics", startYear: "2021" };
const ID = "0b6f2c1e-1111-4222-8333-444455556666";

describe("saveEntryAction", () => {
  it("creates with the checked body when id is null", async () => {
    api.createEntry.mockResolvedValue({});
    await expect(saveEntryAction("education", null, EDU)).resolves.toEqual({ ok: true });
    expect(api.createEntry).toHaveBeenCalledWith(
      "education",
      expect.objectContaining({ startYear: 2021 }),
    );
    expect(api.updateEntry).not.toHaveBeenCalled();
  });

  it("updates when an id is given", async () => {
    api.updateEntry.mockResolvedValue({});
    await saveEntryAction("education", ID, { degree: "M.Sc." });
    expect(api.updateEntry).toHaveBeenCalledWith("education", ID, { degree: "M.Sc." });
  });

  it("never POSTs a half-filled entry", async () => {
    const result = await saveEntryAction("education", null, { ...EDU, degree: "" });
    expect(result).toMatchObject({
      ok: false,
      code: "VALIDATION_FAILED",
      fields: { degree: "required" },
    });
    expect(api.createEntry).not.toHaveBeenCalled();
  });

  it.each([["users"], [undefined], ["../x"]])("refuses the section %j", async (section) => {
    await expect(saveEntryAction(section, null, EDU)).resolves.toMatchObject({ ok: false });
    expect(api.createEntry).not.toHaveBeenCalled();
  });

  it.each(["LIMIT_REACHED", "NOT_FOUND", "VALIDATION_FAILED"])(
    "returns the API's %s",
    async (code) => {
      api.createEntry.mockRejectedValue(new ApiError(409, code, "x"));
      await expect(saveEntryAction("education", null, EDU)).resolves.toEqual({ ok: false, code });
    },
  );
});

describe("deleteEntryAction / reorderEntriesAction / replaceSkillsAction", () => {
  it("deletes one entry of a known section", async () => {
    api.deleteEntry.mockResolvedValue(undefined);
    await expect(deleteEntryAction("experience", ID)).resolves.toEqual({ ok: true });
    expect(api.deleteEntry).toHaveBeenCalledWith("experience", ID);
    await expect(deleteEntryAction("nope", ID)).resolves.toMatchObject({ ok: false });
    await expect(deleteEntryAction("experience", 5)).resolves.toMatchObject({ ok: false });
  });

  it("reorders with the whole id list, and passes ORDER_STALE through", async () => {
    api.reorderEntries.mockResolvedValue([]);
    await reorderEntriesAction("certifications", ["a", "b"]);
    expect(api.reorderEntries).toHaveBeenCalledWith("certifications", ["a", "b"]);
    api.reorderEntries.mockRejectedValue(new ApiError(409, "ORDER_STALE", "x"));
    await expect(reorderEntriesAction("certifications", ["a"])).resolves.toEqual({
      ok: false,
      code: "ORDER_STALE",
    });
    api.reorderEntries.mockClear();
    await expect(reorderEntriesAction("certifications", ["a", "a"])).resolves.toMatchObject({
      ok: false,
    });
    expect(api.reorderEntries).not.toHaveBeenCalled();
  });

  it("replaces the skills, trimmed", async () => {
    api.replaceSkills.mockResolvedValue({ skills: [] });
    await replaceSkillsAction([" TS ", ""]);
    expect(api.replaceSkills).toHaveBeenCalledWith(["TS"]);
    await expect(replaceSkillsAction("TS")).resolves.toMatchObject({ ok: false });
  });
});
