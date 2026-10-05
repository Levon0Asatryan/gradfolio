import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { DeleteAccount } from "./DeleteAccount";

const action = vi.hoisted(() => ({ deleteAccountAction: vi.fn() }));
vi.mock("@/lib/profile/actions", () => action);

const assign = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, "location", { value: { assign }, configurable: true });
});

const open = () => {
  render(
    <LanguageProvider>
      <DeleteAccount />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
  return within(screen.getByRole("dialog"));
};

describe("DeleteAccount", () => {
  it("cannot delete until the user ticks the confirmation", () => {
    const dialog = open();
    const confirm = dialog.getByRole("button", { name: "Delete account" });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(action.deleteAccountAction).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole("checkbox"));
    expect(confirm).toBeEnabled();
  });

  it("signs out right after the API deleted the account", async () => {
    action.deleteAccountAction.mockResolvedValue({ ok: true });
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox"));
    fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/auth/logout"));
  });

  it("stays, says so and does not sign out when the delete fails", async () => {
    action.deleteAccountAction.mockResolvedValue({ ok: false, code: "DATABASE_UNAVAILABLE" });
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox"));
    fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not delete your account");
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("cancel deletes nothing", () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    expect(action.deleteAccountAction).not.toHaveBeenCalled();
  });
});
