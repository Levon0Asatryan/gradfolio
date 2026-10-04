import { describe, expect, it } from "vitest";
import { parseHeaderPatch } from "./headerPatch";

const ok = (input: unknown) => {
  const r = parseHeaderPatch(input);
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r.errors)}`);
  return r.patch;
};
const errors = (input: unknown) => {
  const r = parseHeaderPatch(input);
  if (r.ok) throw new Error("expected errors");
  return r.errors;
};

describe("parseHeaderPatch", () => {
  it("trims, and turns a blank nullable field into null", () => {
    expect(
      ok({ name: "  Ani ", headline: " CS ", bio: "  ", location: "", contactEmail: " " }),
    ).toEqual({ name: "Ani", headline: "CS", bio: null, location: null, contactEmail: null });
  });

  it("passes only what it was given", () => {
    expect(ok({ isPublic: false })).toEqual({ isPublic: false });
  });

  it("requires a name when one is sent", () => {
    expect(errors({ name: "   " })).toEqual({ name: "required" });
  });

  it.each(["javascript:alert(1)", "data:text/html,x", "//evil.example", "ftp://x.y", "not a url"])(
    "rejects %s as an avatar or link",
    (bad) => {
      expect(errors({ avatarUrl: bad })).toEqual({ avatarUrl: "invalid_url" });
      expect(errors({ links: { website: bad } })).toEqual({ "links.website": "invalid_url" });
    },
  );

  it("accepts http(s) URLs and clears a link with null or blank", () => {
    expect(
      ok({
        avatarUrl: "https://a.example/x.png",
        links: { github: "http://g.example", twitter: null, website: "" },
      }),
    ).toEqual({
      avatarUrl: "https://a.example/x.png",
      links: { github: "http://g.example", twitter: null, website: null },
    });
  });

  it("rejects a contact email that is not an address", () => {
    expect(errors({ contactEmail: "ani" })).toEqual({ contactEmail: "invalid_email" });
    expect(ok({ contactEmail: "ani@example.com" })).toEqual({ contactEmail: "ani@example.com" });
  });

  it.each([
    ["verified", { verified: true }],
    ["email", { email: "x@y.z" }],
    ["id", { id: "x" }],
    ["unknown link", { links: { facebook: "https://f.example" } }],
  ])("rejects a field the API does not let you write: %s", (_label, input) => {
    expect(Object.keys(errors(input)).length).toBeGreaterThan(0);
  });

  it.each([null, "x", 3, [], {}])("rejects a body that is %j", (input) => {
    expect(errors(input)).toEqual({ _: "invalid" });
  });

  it("rejects wrong types", () => {
    expect(errors({ name: 1, isPublic: "yes", links: "x" })).toEqual({
      name: "invalid",
      isPublic: "invalid",
      links: "invalid",
    });
  });
});
