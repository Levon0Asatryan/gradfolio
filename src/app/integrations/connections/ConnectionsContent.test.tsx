import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/integrations/connections",
}));
vi.mock("@/lib/integrations/importActions", () => ({
  listGithubReposAction: vi.fn(),
  importGithubReposAction: vi.fn(),
  previewGithubImportAction: vi.fn(),
}));
vi.mock("@/lib/integrations/suggestionActions", () => ({
  loadProfileSuggestionsAction: vi.fn(),
  acceptSuggestionsAction: vi.fn(),
  dismissSuggestionAction: vi.fn(),
}));
vi.mock("@/lib/integrations/actions", () => ({
  startGithubConnectAction: vi.fn(),
  disconnectGithubAction: vi.fn(),
}));

const { ConnectionsContent } = await import("./ConnectionsContent");

const integrations = {
  github: { available: true, status: "not_connected", login: null, lastSyncedAt: null },
  linkedin: { status: "not_connected", lastSyncedAt: null },
} as const;

describe("integrations setup stepper", () => {
  it("has step indicators that are named buttons, one marked current", () => {
    renderInApp(<ConnectionsContent integrations={integrations} />, "ru");
    const first = screen.getByRole("button", { name: "Шаг 1 из 2" });
    expect(first).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Шаг 2 из 2" })).not.toHaveAttribute("aria-current");
  });

  it("shows the real GitHub card first, on what the API says, not a fake import", () => {
    renderInApp(<ConnectionsContent integrations={integrations} />);
    expect(screen.getByRole("region", { name: "GitHub" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Connect" })).toBeEnabled();
    expect(screen.queryByText(/imported/i)).toBeNull();
  });

  it("ends in a translated finish screen with a way to the profile", async () => {
    renderInApp(<ConnectionsContent integrations={integrations} />, "ru");
    fireEvent.click(screen.getByRole("button", { name: "Шаг 2 из 2" }));
    fireEvent.click(await screen.findByRole("button", { name: "Завершить" }));
    expect(await screen.findByRole("heading", { name: "Настройка завершена" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Перейти в мой профиль" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });
});
