import { describe, expect, it } from "vitest";
import { parseListParams } from "./listParams";

const parse = (qs: string) => parseListParams(new URLSearchParams(qs));

describe("parseListParams", () => {
  it("accepts nothing, a limit, and a cursor", () => {
    expect(parse("")).toEqual({});
    expect(parse("limit=15&cursor=abc")).toEqual({ limit: 15, cursor: "abc" });
    expect(parse("limit=50")).toEqual({ limit: 50 });
  });

  it.each(["limit=0", "limit=51", "limit=-1", "limit=1e2", "limit=abc", "limit=", "cursor="])(
    "refuses %s before the API sees it",
    (qs) => {
      expect(parse(qs)).toBeNull();
    },
  );

  it("refuses a cursor over the API's 600 characters", () => {
    expect(parse(`cursor=${"x".repeat(601)}`)).toBeNull();
    expect(parse(`cursor=${"x".repeat(600)}`)).not.toBeNull();
  });
});
