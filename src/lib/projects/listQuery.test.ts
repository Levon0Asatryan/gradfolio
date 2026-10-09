import { describe, expect, it } from "vitest";
import { MAX_QUERY_LENGTH, parseListQuery } from "./listQuery";

describe("parseListQuery", () => {
  it("keeps the values the API accepts", () => {
    expect(
      parseListQuery({ q: " go ", category: "course", sort: "name_asc", cursor: "abc" }),
    ).toEqual({
      q: "go",
      category: "course",
      sort: "name_asc",
      cursor: "abc",
    });
  });

  it("drops what the API would answer 400 to, instead of forwarding it", () => {
    expect(
      parseListQuery({ sort: "price", category: "games", limit: "9999", state: "x", q: "  " }),
    ).toEqual({});
  });

  it("takes the first of a repeated key and ignores non-strings", () => {
    expect(parseListQuery({ category: ["course", "other"], q: { a: 1 }, sort: 7 })).toEqual({
      category: "course",
    });
  });

  it("caps the search text and refuses an oversized cursor", () => {
    expect(parseListQuery({ q: "x".repeat(500) }).q).toHaveLength(MAX_QUERY_LENGTH);
    expect(parseListQuery({ cursor: "c".repeat(601) })).toEqual({});
  });
});
