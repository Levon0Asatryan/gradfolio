import { describe, expect, it } from "vitest";
import type { LinkedinPreview } from "@/lib/api/types";
import { buildConfirm, canSelect, defaultSelection, rowErrors, rowsFromPreview } from "./model";

const preview: LinkedinPreview = {
  experience: [
    {
      status: "new",
      fields: {
        title: "Placeholder Engineer",
        organization: "Example Co",
        start: "2020-01",
        end: null,
        summary: "",
        achievements: [],
        skills: ["Faking"],
      },
      problems: [],
    },
    {
      status: "duplicate",
      fields: { title: "Old", organization: "Example Co", start: "2019-01", summary: "" },
      problems: [],
    },
  ],
  education: [
    {
      status: "invalid",
      fields: { institution: "Placeholder Institute", degree: "BSc", startYear: 2015 },
      problems: [{ field: "field", code: "REQUIRED" }],
    },
  ],
  certifications: [],
  skills: [
    { name: "Faking", status: "new" },
    { name: "Mocking", status: "duplicate" },
  ],
  skippedColumns: [],
  missingFiles: [],
  skippedFileCount: 0,
  extensions: {},
};

describe("review model", () => {
  const model = rowsFromPreview(preview);

  it("turns a preview into text rows with stable ids", () => {
    expect(model.entries.map((r) => r.id)).toEqual(["experience-0", "experience-1", "education-0"]);
    expect(model.entries[0]?.values.end).toBe("");
    expect(model.entries[0]?.values.skills).toBe("Faking");
  });

  it("ticks only new rows that can be saved", () => {
    expect([...defaultSelection(model)].sort()).toEqual(["experience-0", "skills-0"]);
  });

  it("never lets a duplicate be ticked, and a broken row only once fixed", () => {
    const [, dupe, broken] = model.entries;
    expect(canSelect(dupe!)).toBe(false);
    expect(canSelect(model.skills[1]!)).toBe(false);
    expect(rowErrors(broken!)).toMatchObject({ field: "required" });
    expect(canSelect(broken!)).toBe(false);
    const fixed = { ...broken!, values: { ...broken!.values, field: "Faking" } };
    expect(canSelect(fixed)).toBe(true);
  });

  it("builds the body from the ticked rows only", () => {
    const body = buildConfirm(model, new Set(["experience-0", "skills-0"]));
    expect(body?.experience).toHaveLength(1);
    expect(body?.skills).toEqual(["Faking"]);
    expect(body?.education).toEqual([]);
  });

  it("leaves a ticked duplicate or broken row out, even if the set holds it", () => {
    expect(buildConfirm(model, new Set(["experience-1", "education-0", "skills-1"]))).toBeNull();
  });

  it("returns null for no selection", () => {
    expect(buildConfirm(model, new Set())).toBeNull();
  });
});
