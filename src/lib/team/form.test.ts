import { describe, expect, it } from "vitest";
import { parseExternal, parseLookupQuery, parseRole } from "./form";

describe("parseRole", () => {
  it("turns a blank into no role, never an empty string", () => {
    expect(parseRole("")).toEqual({ role: null });
    expect(parseRole("   ")).toEqual({ role: null });
    expect(parseRole(undefined)).toEqual({ role: null });
    expect(parseRole("  Designer ")).toEqual({ role: "Designer" });
  });

  it("counts characters like the API's VARCHAR(255), not UTF-16 units", () => {
    expect(parseRole("x".repeat(255))).toEqual({ role: "x".repeat(255) });
    expect(parseRole("x".repeat(256))).toEqual({ error: "tooLong" });
    expect(parseRole("😀".repeat(255))).toEqual({ role: "😀".repeat(255) });
  });
});

describe("parseExternal", () => {
  it("needs a name, trims, and checks the role", () => {
    expect(parseExternal(" Ani ", "")).toEqual({ name: "Ani", role: null });
    expect(parseExternal("", "x")).toEqual({ field: "name", error: "required" });
    expect(parseExternal(7, "x")).toEqual({ field: "name", error: "required" });
    expect(parseExternal("n".repeat(256), "")).toEqual({ field: "name", error: "tooLong" });
    expect(parseExternal("Ani", "r".repeat(256))).toEqual({ field: "role", error: "tooLong" });
  });
});

describe("parseLookupQuery", () => {
  it("accepts 3 to 50 characters after trimming, like the API", () => {
    expect(parseLookupQuery(" Ani ")).toBe("Ani");
    expect(parseLookupQuery("An")).toBeNull();
    expect(parseLookupQuery("  An  ")).toBeNull();
    expect(parseLookupQuery(null)).toBeNull();
    expect(parseLookupQuery("a".repeat(51))).toBeNull();
    expect(parseLookupQuery("a".repeat(50))).not.toBeNull();
    expect(parseLookupQuery("Ани")).toBe("Ани");
  });
});
