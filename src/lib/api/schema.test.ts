// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import openapiTS, { astToString } from "openapi-typescript";
import { describe, expect, it } from "vitest";

const dir = __dirname;
const read = (name: string) => readFileSync(join(dir, name), "utf8");

describe("generated API types (Q5)", () => {
  it("schema.d.ts is what openapi-typescript makes of openapi.yaml", async () => {
    const ast = await openapiTS(new URL(`file://${join(dir, "openapi.yaml")}`));
    const header = read("schema.d.ts").split("\n").slice(0, 5).join("\n");
    // `npm run api:types` is the only writer; a hand edit or a stale file fails here.
    expect(read("schema.d.ts")).toBe(`${header}\n${astToString(ast)}`);
  });

  it("openapi.source names the gradfolio-api commit the contract was taken from", () => {
    expect(read("openapi.source").trim()).toMatch(/^[0-9a-f]{40}$/);
  });
});
