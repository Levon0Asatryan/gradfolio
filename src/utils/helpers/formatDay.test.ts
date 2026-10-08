import { describe, expect, it, vi } from "vitest";
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
  // vitest runs with TZ=UTC, so output alone cannot show a lost `timeZone`: check the option itself.
  it.each([
    ["formatDay", (l: "en") => formatDay("2025-12-06T00:00:00Z", l)],
    ["formatMonth", (l: "en") => formatMonth("2025-12-06T00:00:00Z", l)],
  ])("%s formats in UTC, whatever the machine's zone", (_name, run) => {
    const seen: (string | undefined)[] = [];
    const Real = Intl.DateTimeFormat;
    const spy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (
      locale?: string | string[],
      options?: Intl.DateTimeFormatOptions,
    ) {
      seen.push(options?.timeZone);
      return new Real(locale, options);
    } as never);
    run("en");
    spy.mockRestore();
    expect(seen).toEqual(["UTC"]);
  });
});
