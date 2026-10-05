import { describe, expect, expectTypeOf, it } from "vitest";
import type { paths } from "@/lib/api/schema";
import { FIELDS, parseEntry, parseIds, parseSkills, type Section } from "./sections";

type CreateBody<S extends Section> = NonNullable<
  paths[`/v1/me/${S}`]["post"]["requestBody"]
>["content"]["application/json"];
type SpecKeys<S extends Section> = (typeof FIELDS)[S][number]["key"];

describe("field specs follow the generated contract", () => {
  it("lists exactly the fields the API's create bodies have", () => {
    // Compile-time: a field added to or removed from openapi.yaml fails typecheck here.
    expectTypeOf<SpecKeys<"education">>().toEqualTypeOf<keyof CreateBody<"education">>();
    expectTypeOf<SpecKeys<"experience">>().toEqualTypeOf<keyof CreateBody<"experience">>();
    expectTypeOf<SpecKeys<"certifications">>().toEqualTypeOf<keyof CreateBody<"certifications">>();
  });
});

const EDU = { institution: "NPUA", degree: "B.Sc.", field: "Informatics", startYear: "2021" };

describe("parseEntry (create)", () => {
  it("builds the body: trimmed, numbers as numbers, blank optionals as null", () => {
    const r = parseEntry(
      "education",
      { ...EDU, institution: " NPUA ", endYear: "", description: "  ", highlights: [" GPA ", ""] },
      "create",
    );
    expect(r).toEqual({
      ok: true,
      body: {
        institution: "NPUA",
        degree: "B.Sc.",
        field: "Informatics",
        startYear: 2021,
        endYear: null,
        description: null,
        highlights: ["GPA"],
      },
    });
  });

  it.each(["institution", "degree", "field", "startYear"])(
    "never sends an education entry with %s missing or blank",
    (key) => {
      expect(parseEntry("education", { ...EDU, [key]: "  " }, "create")).toMatchObject({
        ok: false,
        errors: { [key]: "required" },
      });
      const { [key]: _omitted, ...rest } = EDU as Record<string, string>;
      void _omitted;
      expect(parseEntry("education", rest, "create")).toMatchObject({ ok: false });
    },
  );

  it.each(["abc", "1899", "2101", "20.5"])("rejects year %s", (year) => {
    expect(parseEntry("education", { ...EDU, startYear: year }, "create")).toMatchObject({
      ok: false,
      errors: { startYear: "invalid_year" },
    });
  });

  it.each(["2025-13", "2025-00", "25-01", "2025/01", "2025-1"])("rejects month %s", (m) => {
    expect(
      parseEntry("certifications", { name: "AWS", issuer: "Amazon", date: m }, "create"),
    ).toMatchObject({ ok: false, errors: { date: "invalid_month" } });
  });

  it("requires every experience field the API requires, and treats a blank end as present", () => {
    const exp = { title: "Intern", organization: "Acme", start: "2024-06", summary: "Built." };
    expect(parseEntry("experience", { ...exp, end: " " }, "create")).toMatchObject({
      ok: true,
      body: { end: null },
    });
    expect(parseEntry("experience", { ...exp, summary: "" }, "create")).toMatchObject({
      ok: false,
      errors: { summary: "required" },
    });
  });

  it("only takes http(s) credential URLs", () => {
    const cert = { name: "AWS", issuer: "Amazon", date: "2025-01" };
    expect(
      parseEntry("certifications", { ...cert, credentialUrl: "javascript:alert(1)" }, "create"),
    ).toMatchObject({ ok: false, errors: { credentialUrl: "invalid_url" } });
    expect(
      parseEntry("certifications", { ...cert, credentialUrl: "https://c.example/1" }, "create"),
    ).toMatchObject({ ok: true });
  });

  it("rejects fields the API does not take (id, sortOrder, userId)", () => {
    expect(parseEntry("education", { ...EDU, id: "x", sortOrder: 0 }, "create")).toMatchObject({
      ok: false,
      errors: { id: "invalid", sortOrder: "invalid" },
    });
  });

  it("caps list items like the API", () => {
    const many = Array.from({ length: 21 }, (_, i) => `h${i}`);
    expect(parseEntry("education", { ...EDU, highlights: many }, "create")).toMatchObject({
      ok: false,
      errors: { highlights: "invalid" },
    });
  });

  it.each([null, "x", [], 3])("rejects a body that is %j", (input) => {
    expect(parseEntry("education", input, "create")).toEqual({
      ok: false,
      errors: { _: "invalid" },
    });
  });
});

describe("parseEntry (update)", () => {
  it("accepts a subset, but not an empty body or a blanked required field", () => {
    expect(parseEntry("education", { degree: "M.Sc." }, "update")).toEqual({
      ok: true,
      body: { degree: "M.Sc." },
    });
    expect(parseEntry("education", {}, "update")).toEqual({ ok: false, errors: { _: "invalid" } });
    expect(parseEntry("education", { degree: " " }, "update")).toMatchObject({
      ok: false,
      errors: { degree: "required" },
    });
  });
});

describe("parseIds / parseSkills", () => {
  it("takes distinct non-empty ids", () => {
    expect(parseIds(["a", "b"])).toEqual(["a", "b"]);
    for (const bad of [[], ["a", "a"], ["a", ""], [1], "a", null, ["x".repeat(37)]]) {
      expect(parseIds(bad)).toBeNull();
    }
  });

  it("trims skills and drops blanks; the API normalizes the rest", () => {
    expect(parseSkills([" TS ", "", "React"])).toEqual(["TS", "React"]);
    expect(parseSkills([])).toEqual([]);
    expect(parseSkills("TS")).toBeNull();
    expect(parseSkills([1])).toBeNull();
    expect(parseSkills(Array.from({ length: 1001 }, (_, i) => `s${i}`))).toBeNull();
  });
});
