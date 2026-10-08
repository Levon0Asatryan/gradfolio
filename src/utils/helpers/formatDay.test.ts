import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatDay, formatMonth } from "./formatDay";

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

describe("formatMonth", () => {
  it("prints the UTC month in the UI language", () => {
    expect(formatMonth("2025-12-31T23:30:00.000Z", "en")).toBe("Dec 2025");
    expect(formatMonth("2025-12-31T23:30:00.000Z", "ru")).toMatch(/дек.*2025/);
  });

  it("returns an empty string for a date it cannot read", () => {
    expect(formatMonth("nope", "en")).toBe("");
  });
});

describe("time zone", () => {
  // vitest pins TZ=UTC, which would hide a lost `timeZone: "UTC"`. Run the formatters in a
  // zone ahead of UTC and compare what a reader sees: 23:30 UTC is already the next day there.
  const original = process.env.TZ;
  beforeEach(() => {
    process.env.TZ = "Asia/Yerevan";
  });
  afterEach(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  it("the test's zone really is ahead of UTC", () => {
    expect(new Date("2025-12-06T23:30:00Z").getDate()).toBe(7);
  });

  it("formatDay prints the UTC day", () => {
    expect(formatDay("2025-12-06T23:30:00Z", "en")).toBe("Dec 6, 2025");
  });

  it("formatMonth prints the UTC month", () => {
    expect(formatMonth("2025-12-31T23:30:00Z", "en")).toBe("Dec 2025");
  });
});
