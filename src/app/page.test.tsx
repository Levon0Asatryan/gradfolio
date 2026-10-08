import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/dashboard/DashboardLoader", () => ({ DashboardLoader: () => null }));
vi.mock("@/components/onboarding/OnboardingGate", () => ({ OnboardingGate: () => null }));
const jar = vi.hoisted(() => ({ language: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "language" && jar.language ? { value: jar.language } : undefined,
  }),
}));

const { generateMetadata } = await import("./page");

beforeEach(() => (jar.language = undefined));

describe("/ (dashboard) tab title", () => {
  it.each([
    [undefined, "Dashboard | Gradfolio"],
    ["en", "Dashboard | Gradfolio"],
    ["ru", "Дашборд | Gradfolio"],
    ["am", "Վահանակ | Gradfolio"],
    ["xx", "Dashboard | Gradfolio"],
  ])("language cookie %s gives %s", async (language, title) => {
    jar.language = language;
    expect(await generateMetadata()).toEqual({ title: { absolute: title } });
  });
});
