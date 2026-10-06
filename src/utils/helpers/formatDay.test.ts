import { describe, expect, it } from "vitest";
import { formatDay } from "./formatDay";

describe("formatDay", () => {
  it("prints the same day in the UI language, whatever the machine's time zone", () => {
    // 23:30 UTC on Dec 6 is already Dec 7 in Yerevan (UTC+4): the UTC day wins.
    expect(formatDay("2025-12-06T23:30:00.000Z", "en")).toBe("Dec 6, 2025");
    expect(formatDay("2025-12-06T23:30:00.000Z", "ru")).toMatch(/6.*дек.*2025/);
    expect(formatDay("2025-12-06T23:30:00.000Z", "am")).toMatch(/6/);
  });

  it("returns an empty string for a date it cannot read", () => {
    expect(formatDay("not a date", "en")).toBe("");
  });
});
