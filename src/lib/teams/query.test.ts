import { describe, expect, it } from "vitest";
import { parseTeamsQuery, teamsHref, toApiQuery, TEAMS_PAGE_SIZE } from "./query";

describe("parseTeamsQuery", () => {
  it("reads the cursor of one list and ignores anything else", () => {
    expect(parseTeamsQuery({ memberCursor: ["b", "c"], q: "x", userId: "u" })).toEqual({
      member: "b",
    });
  });

  it("keeps only one cursor from a hand-edited URL: the API restarts the other lists", () => {
    expect(parseTeamsQuery({ outgoingCursor: "o", ownedCursor: "a" })).toEqual({ owned: "a" });
  });

  it("drops an empty or over-long cursor instead of sending the API a 400", () => {
    expect(parseTeamsQuery({ ownedCursor: "", incomingCursor: "x".repeat(601) })).toEqual({});
    expect(parseTeamsQuery({ incomingCursor: "x".repeat(600) })).toEqual({
      incoming: "x".repeat(600),
    });
  });
});

describe("toApiQuery and teamsHref", () => {
  it("sends the page size and only the cursors that are set", () => {
    expect(toApiQuery({ outgoing: "o" })).toEqual({
      limit: TEAMS_PAGE_SIZE,
      ownedCursor: undefined,
      memberCursor: undefined,
      incomingCursor: undefined,
      outgoingCursor: "o",
    });
  });

  it("builds a link for one list; the others restart from their first page", () => {
    expect(teamsHref({})).toBe("/teams");
    expect(teamsHref({ owned: "a b", member: null })).toBe("/teams?ownedCursor=a+b");
  });
});
