import { describe, expect, it } from "vitest";
import { parseOverrides } from "./suggestionOverrides";

describe("parseOverrides", () => {
  it("takes an education entry and an experience entry, trimmed", () => {
    expect(parseOverrides({ degree: " BSc ", field: "CS", startYear: 2022 })).toEqual({
      degree: "BSc",
      field: "CS",
      startYear: 2022,
    });
    expect(parseOverrides({ title: "Intern", start: "2025-06" })).toEqual({
      title: "Intern",
      start: "2025-06",
    });
  });
  it.each([
    ["empty", {}],
    ["null", null],
    ["an array", []],
    ["a blank text", { degree: "  ", field: "CS", startYear: 2022 }],
    ["a year out of range", { degree: "BSc", field: "CS", startYear: 1800 }],
    ["a fractional year", { degree: "BSc", field: "CS", startYear: 2022.5 }],
    ["a year as text", { degree: "BSc", field: "CS", startYear: "2022" }],
    ["a bad month", { title: "x", start: "2025-13" }],
    ["a key we do not take", { title: "x", start: "2025-06", userId: "1" }],
  ])("refuses %s", (_n, input) => {
    expect(parseOverrides(input)).toBeNull();
  });
});
