import { describe, expect, it } from "vitest";
import { activitiesMock } from "@/data/dashboard.mock";
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
  // ActivityFeed looks these up with a cast (`as keyof …`), so the compiler
  // cannot see a key that does not exist; the feed would show the raw key.
  it.each(activitiesMock.map((a) => [a.translationKey, a.translationParams] as const))(
    "%s exists and its params fill every placeholder",
    (key, params) => {
      const template = (en.dashboard.activity as Record<string, string>)[key];
      expect(template).toBeDefined();
      expect(placeholders(template ?? "")).toEqual(Object.keys(params ?? {}).sort());
    },
  );
});
