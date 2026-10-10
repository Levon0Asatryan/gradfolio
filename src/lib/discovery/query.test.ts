import { describe, expect, it } from "vitest";
import {
  MAX_CURSOR_LENGTH,
  MAX_QUERY_LENGTH,
  MAX_QUERY_TOKENS,
  MAX_TOKEN_LENGTH,
  cleanQuery,
  tagNameFromDecoded,
  tagNameFromPageParam,
  normalizeText,
  parseSearchQuery,
  searchHref,
  tagHref,
} from "./query";

describe("cleanQuery", () => {
  it("trims, collapses whitespace and keeps the case", () => {
    expect(cleanQuery("  Machine   Learning \n")).toBe("Machine Learning");
  });

  it("removes control and zero-width characters", () => {
    expect(cleanQuery("io​t\u0000")).toBe("io t");
    expect(cleanQuery("‮evil")).toBe("evil");
  });

  it("keeps C#, C++, .NET and Armenian text whole", () => {
    expect(cleanQuery("C#")).toBe("C#");
    expect(cleanQuery("c++ .NET")).toBe("c++ .NET");
    expect(cleanQuery("Արմեն")).toBe("Արմեն");
  });

  it("keeps the first words and cuts the length, so a pasted paragraph still searches", () => {
    const words = Array.from({ length: 12 }, (_, i) => `w${i}`).join(" ");
    expect(cleanQuery(words).split(" ")).toHaveLength(MAX_QUERY_TOKENS);
    expect(Array.from(cleanQuery("x".repeat(500)))).toHaveLength(MAX_TOKEN_LENGTH);
    const long = Array.from({ length: 6 }, () => "y".repeat(40)).join(" ");
    expect(Array.from(cleanQuery(long)).length).toBeLessThanOrEqual(MAX_QUERY_LENGTH);
  });

  it("is empty for nothing", () => {
    expect(cleanQuery(undefined)).toBe("");
    expect(cleanQuery("   ")).toBe("");
  });
});

describe("parseSearchQuery", () => {
  it("takes the first of a repeated key and ignores unknown keys", () => {
    expect(parseSearchQuery({ q: ["ml", "ai"], evil: "1" })).toEqual({ q: "ml" });
  });

  it("accepts only the two list types", () => {
    expect(parseSearchQuery({ q: "ml", type: "people" }).type).toBe("people");
    expect(parseSearchQuery({ q: "ml", type: "users; drop" }).type).toBeUndefined();
  });

  it("keeps a cursor only with a list type, and only up to the API's length", () => {
    expect(parseSearchQuery({ q: "ml", cursor: "abc" }).cursor).toBeUndefined();
    expect(parseSearchQuery({ q: "ml", type: "people", cursor: "abc" }).cursor).toBe("abc");
    const tooLong = "a".repeat(MAX_CURSOR_LENGTH + 1);
    expect(parseSearchQuery({ q: "ml", type: "people", cursor: tooLong }).cursor).toBeUndefined();
    expect(parseSearchQuery({ q: "ml", type: "people", cursor: ["x"] as unknown }).cursor).toBe(
      "x",
    );
    expect(
      parseSearchQuery({ q: "ml", type: "people", cursor: 5 as unknown }).cursor,
    ).toBeUndefined();
  });
});

describe("tag names", () => {
  it("round trips through the route segment the page receives (still encoded)", () => {
    for (const name of ["C#", "C++", ".NET", "CI/CD", "Արմեն", "100%", "C%23", "a&b=c"]) {
      expect(tagNameFromPageParam(tagHref(name).slice("/tags/".length))).toBe(name);
    }
  });

  it("does not decode the metadata's params a second time", () => {
    // `/tags/C%2523` is the tag named "C%23"; the metadata receives exactly that.
    expect(tagNameFromDecoded("C%23")).toBe("C%23");
    expect(tagNameFromPageParam("C%2523")).toBe("C%23");
    expect(tagNameFromPageParam("C%2523")).toBe(tagNameFromDecoded("C%23"));
  });

  it("encodes characters that would change the route", () => {
    expect(tagHref("CI/CD")).toBe("/tags/CI%2FCD");
    expect(tagHref("C#")).toBe("/tags/C%23");
    expect(tagHref("../x")).toBe("/tags/..%2Fx");
    expect(tagHref("C%23")).toBe("/tags/C%2523");
  });

  it("refuses an empty name and one over 255 characters", () => {
    expect(tagNameFromPageParam("   ")).toBeNull();
    expect(tagNameFromPageParam("x".repeat(256))).toBeNull();
    expect(tagNameFromPageParam("x".repeat(255))).toBe("x".repeat(255));
  });

  it("does not throw on a stray percent sign", () => {
    expect(tagNameFromPageParam("100%")).toBe("100%");
  });
});

describe("searchHref", () => {
  it("leaves out what is empty and encodes the rest", () => {
    expect(searchHref({ q: "" })).toBe("/search");
    expect(searchHref({ q: "c# & go" })).toBe("/search?q=c%23+%26+go");
    expect(searchHref({ q: "ml", type: "people", cursor: "a/b" })).toBe(
      "/search?q=ml&type=people&cursor=a%2Fb",
    );
  });
});

describe("normalizeText", () => {
  it("folds compatibility forms (NFKC)", () => {
    expect(normalizeText("ＡＩ")).toBe("AI");
  });
});
