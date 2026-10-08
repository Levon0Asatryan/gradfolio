import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/dashboard/DashboardLoader", () => ({ DashboardLoader: () => null }));
vi.mock("@/components/onboarding/OnboardingGate", () => ({ OnboardingGate: () => null }));

const { metadata } = await import("./page");

describe("/ (dashboard)", () => {
  it("names the tab: the root layout's title template does not apply to its own page", () => {
    expect(metadata.title).toEqual({ absolute: "Dashboard | Gradfolio" });
  });
});
