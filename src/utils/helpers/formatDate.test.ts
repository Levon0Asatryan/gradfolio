import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

// vitest.config.mts pins TZ=UTC and an en-US locale.
describe("formatDate", () => {
  it("formats the date only by default", () => {
    expect(formatDate("2026-01-15T10:05:00Z")).toBe("Jan 15, 2026");
  });

  it("appends the time when asked", () => {
    expect(formatDate("2026-01-15T10:05:00Z", { withTime: true })).toBe("Jan 15, 2026 10:05 AM");
  });

  it("formats in the local time zone, not the ISO string's", () => {
    expect(formatDate("2026-01-15T23:30:00-02:00")).toBe("Jan 16, 2026");
  });

  it("uses the given locale and zone, whatever the machine's", () => {
    expect(formatDate("2026-01-15T23:30:00-02:00", { locale: "ru-RU", timeZone: "UTC" })).toBe(
      "16 янв. 2026 г.",
    );
    expect(formatDate("2026-01-15T23:30:00Z", { locale: "en-US", timeZone: "Asia/Yerevan" })).toBe(
      "Jan 16, 2026",
    );
  });

  it.each(["", "not a date", "2026-13-45"])("returns an empty string for %j", (input) => {
    expect(formatDate(input)).toBe("");
  });
});
