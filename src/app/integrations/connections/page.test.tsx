import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ConnectionsContent", () => ({ ConnectionsContent: () => null }));
const jar = vi.hoisted(() => ({ language: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "language" && jar.language ? { value: jar.language } : undefined,
  }),
}));

const { generateMetadata } = await import("./page");

beforeEach(() => (jar.language = undefined));

describe("/integrations/connections tab title", () => {
  it.each([
    [undefined, "Integrations Setup"],
    ["en", "Integrations Setup"],
    ["ru", "Настройка интеграций"],
    ["am", "Ինտեգրացիաների կարգավորում"],
  ])("language cookie %s gives %s", async (language, title) => {
    jar.language = language;
    expect(await generateMetadata()).toEqual({ title });
  });
});
