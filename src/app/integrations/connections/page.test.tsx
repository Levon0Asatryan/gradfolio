import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ConnectionsContent", () => ({ ConnectionsContent: () => null }));
vi.mock("@/lib/api/client", () => ({ ApiError: class extends Error {}, getIntegrations: vi.fn() }));
vi.mock("@/components/integrations/IntegrationsError", () => ({ IntegrationsError: () => null }));
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
    [undefined, "Set up your accounts"],
    ["en", "Set up your accounts"],
    ["ru", "Настройка аккаунтов"],
    ["am", "Հաշիվների կարգավորում"],
  ])("language cookie %s gives %s", async (language, title) => {
    jar.language = language;
    expect(await generateMetadata()).toEqual({ title });
  });
});
