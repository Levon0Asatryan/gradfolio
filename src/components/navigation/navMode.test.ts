import { afterEach, describe, expect, it } from "vitest";
import { parseNavMode, pickByMode, writeNavMode } from "./navMode";

afterEach(() => {
  document.cookie = "nav=; path=/; max-age=0";
});

describe("navMode", () => {
  it("reads only full and rail from the cookie", () => {
    expect(parseNavMode("full")).toBe("full");
    expect(parseNavMode("rail")).toBe("rail");
    expect(parseNavMode("wide")).toBeUndefined();
    expect(parseNavMode("")).toBeUndefined();
    expect(parseNavMode(undefined)).toBeUndefined();
  });

  it("writes the choice to the nav cookie", () => {
    writeNavMode("rail");
    expect(document.cookie).toContain("nav=rail");
    writeNavMode("full");
    expect(document.cookie).toContain("nav=full");
  });

  it("a stored choice wins at every width; no choice follows the width", () => {
    expect(pickByMode("rail", "r", "f")).toEqual({ sm: "r", lg: "r" });
    expect(pickByMode("full", "r", "f")).toEqual({ sm: "f", lg: "f" });
    expect(pickByMode(undefined, "r", "f")).toEqual({ sm: "r", lg: "f" });
  });
});
