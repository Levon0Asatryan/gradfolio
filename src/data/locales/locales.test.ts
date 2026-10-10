import { describe, expect, it } from "vitest";
import { ACTIVITY_PARAMS } from "@/lib/dashboard/activityKeys";
import { am } from "./am";
import { en } from "./en";
import { ru } from "./ru";

// The Dictionary type already proves every key exists in every language. These
// check what it cannot: the string values themselves.

type Entry = [key: string, value: string];

const entries = (node: object, prefix = ""): Entry[] =>
  Object.entries(node).flatMap(([k, v]): Entry[] =>
    typeof v === "string" ? [[prefix + k, v]] : entries(v as object, `${prefix}${k}.`),
  );

const placeholders = (s: string): string[] =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? "").sort();

// English's plural suffix ("result{s}"). Other languages pluralize differently
// and may drop it; every other placeholder carries data and must survive.
const OPTIONAL = new Set(["s"]);

const english = new Map(entries(en));

describe.each([
  ["en", en],
  ["ru", ru],
  ["am", am],
])("%s dictionary", (_lang, dictionary) => {
  it("has no empty strings", () => {
    const empty = entries(dictionary)
      .filter(([, v]) => v.trim() === "")
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it("uses only the placeholders English defines, and drops none that carry data", () => {
    const wrong = entries(dictionary).flatMap(([key, value]) => {
      const expected = placeholders(english.get(key) ?? "");
      const actual = placeholders(value);
      const invented = actual.filter((p) => !expected.includes(p));
      const dropped = expected.filter((p) => !OPTIONAL.has(p) && !actual.includes(p));
      return invented.length || dropped.length ? [`${key}: ${value}`] : [];
    });
    expect(wrong).toEqual([]);
  });
});

describe("activity feed keys", () => {
  // The API writes exactly these keys (its ACTIVITY_REGISTRY). Each has a string in every
  // language that fills exactly the placeholders the API sends for it: a missing key would show
  // the neutral line, a wrong placeholder would print a hole.
  it.each(Object.entries(ACTIVITY_PARAMS))(
    "%s exists in en, ru and am with its placeholders",
    (key, params) => {
      for (const [name, dictionary] of [
        ["en", en],
        ["ru", ru],
        ["am", am],
      ] as const) {
        const template = (dictionary.dashboard.activity as Record<string, string>)[key];
        expect(template, `${name}.${key}`).toBeDefined();
        expect(placeholders(template ?? ""), `${name}.${key}`).toEqual([...params].sort());
      }
    },
  );

  it("has no string for a key the API does not write", () => {
    expect(Object.keys(en.dashboard.activity).sort()).toEqual(Object.keys(ACTIVITY_PARAMS).sort());
  });
});
