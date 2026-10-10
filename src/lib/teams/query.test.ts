import { describe, expect, it } from "vitest";
import { parseTeamsQuery, teamsHref, toApiQuery, TEAMS_PAGE_SIZE } from "./query";

describe("parseTeamsQuery", () => {
  it("reads one cursor per list and ignores anything else", () => {
    expect(
      parseTeamsQuery({ ownedCursor: "a", memberCursor: ["b", "c"], q: "x", userId: "u" }),
    ).toEqual({ owned: "a", member: "b" });
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

  it("builds a link that keeps the other lists where they are", () => {
    expect(teamsHref({})).toBe("/teams");
    expect(teamsHref({ owned: "a b", member: null, incoming: "i" })).toBe(
      "/teams?ownedCursor=a+b&incomingCursor=i",
    );
  });
});
