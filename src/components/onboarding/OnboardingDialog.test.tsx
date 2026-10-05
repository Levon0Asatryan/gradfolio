import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { OnboardingDialog } from "./OnboardingDialog";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
const action = vi.hoisted(() => ({ completeOnboardingAction: vi.fn() }));
vi.mock("@/lib/profile/actions", () => action);

const show = () =>
  render(
    <LanguageProvider>
      <OnboardingDialog />
    </LanguageProvider>,
  );

beforeEach(() => vi.resetAllMocks());

describe("OnboardingDialog", () => {
  it("is a named dialog", () => {
    show();
    expect(screen.getByRole("dialog", { name: "Welcome to Gradfolio" })).toBeInTheDocument();
  });

  it.each([
    ["Skip for now", undefined],
    ["Set up my profile", "/profile"],
    ["Connect accounts", "/integrations/connections"],
  ])("%s records completion, then goes to %s", async (label, target) => {
    action.completeOnboardingAction.mockResolvedValue({ ok: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(action.completeOnboardingAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    if (target) expect(nav.push).toHaveBeenCalledWith(target);
    else expect(nav.push).not.toHaveBeenCalled();
  });

  it("Escape counts as skipping", async () => {
    action.completeOnboardingAction.mockResolvedValue({ ok: true });
    show();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(action.completeOnboardingAction).toHaveBeenCalledTimes(1));
  });

  it("stays open, says so, and does not navigate when the save fails", async () => {
    action.completeOnboardingAction.mockResolvedValue({ ok: false, code: "API_UNREACHABLE" });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save your choice");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
  });
});
