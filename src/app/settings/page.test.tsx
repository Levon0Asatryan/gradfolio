import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { redirect } from "next/navigation";
const sdk = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth0", () => ({ auth0: sdk }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => ({
  getEmailPreferences: vi.fn(),
  ApiError: class ApiError extends Error {},
}));
const { default: Page } = await import("./page");
afterEach(() => vi.restoreAllMocks());
describe("public settings page", () => {
  it("preserves Next routing interrupts instead of treating them as email failures", async () => {
    sdk.getSession.mockImplementation(() => redirect("/sign-in"));
    await expect(Page()).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });
  });
  it("keeps language and theme available when the optional session check fails", async () => {
    localStorage.clear();
    document.cookie = "language=; max-age=0; path=/";
    sdk.getSession.mockRejectedValue(new Error("session unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ThemeWrapper>
        <LanguageProvider>{await Page()}</LanguageProvider>
      </ThemeWrapper>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Email settings could not be loaded");
  });
});
