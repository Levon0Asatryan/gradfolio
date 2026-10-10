import { describe, expect, it } from "vitest";
import { browseHref, parsePeopleBrowse, parseProjectBrowse } from "./browse";

describe("parseProjectBrowse", () => {
  it("keeps only the values the API accepts", () => {
    expect(
      parseProjectBrowse({ category: "research", status: "ongoing", sort: "updated", evil: "x" }),
    ).toEqual({ category: "research", status: "ongoing", sort: "updated" });
    expect(parseProjectBrowse({ category: "nope", status: "x", sort: "name_asc" })).toEqual({});
  });

  it("treats the default sort as no sort, so the URL stays clean", () => {
    expect(parseProjectBrowse({ sort: "newest" })).toEqual({});
  });

  it("takes the first of a repeated key and a cursor only up to the API's length", () => {
    expect(parseProjectBrowse({ category: ["course", "other"] }).category).toBe("course");
    expect(parseProjectBrowse({ cursor: "a".repeat(601) }).cursor).toBeUndefined();
    expect(parseProjectBrowse({ cursor: "abc" }).cursor).toBe("abc");
  });
});

describe("parsePeopleBrowse", () => {
  it("cleans text filters and checks the year", () => {
    expect(
      parsePeopleBrowse({ school: "  NPUA  ", major: "Informatics", gradYear: "2026" }),
    ).toEqual({
      school: "NPUA",
      major: "Informatics",
      gradYear: 2026,
    });
  });

  it("drops a year outside 1950-2100, a non-number and an over-long school", () => {
    expect(parsePeopleBrowse({ gradYear: "1800" }).gradYear).toBeUndefined();
    expect(parsePeopleBrowse({ gradYear: "20x6" }).gradYear).toBeUndefined();
    expect(parsePeopleBrowse({ gradYear: "2026.5" }).gradYear).toBeUndefined();
    expect(parsePeopleBrowse({ school: "x".repeat(201) }).school).toBeUndefined();
  });
});

describe("browseHref", () => {
  it("leaves out what is unset and the page size, and encodes the rest", () => {
    expect(browseHref("projects", {})).toBe("/browse/projects");
    expect(browseHref("projects", { category: "course", cursor: undefined, limit: 12 })).toBe(
      "/browse/projects?category=course",
    );
    expect(browseHref("people", { school: "A&B School", gradYear: 2026 })).toBe(
      "/browse/people?school=A%26B+School&gradYear=2026",
    );
  });
});
