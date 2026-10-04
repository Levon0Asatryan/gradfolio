import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { AccountSettings } from "./AccountSettings";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const action = vi.hoisted(() => ({ updateProfileAction: vi.fn() }));
vi.mock("@/lib/profile/actions", () => action);

const show = (initial = { isPublic: true, contactEmail: null as string | null }) =>
  render(
    <LanguageProvider>
      <AccountSettings initial={initial} />
    </LanguageProvider>,
  );

beforeEach(() => vi.resetAllMocks());

describe("AccountSettings", () => {
  it("turns the profile private through the action, and shows the new state only after the API said yes", async () => {
    action.updateProfileAction.mockResolvedValue({ ok: true });
    show();
    const toggle = screen.getByRole("switch", { name: "Public profile" });
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(action.updateProfileAction).toHaveBeenCalledWith({ isPublic: false });
    expect(screen.getByText(/Only you can see your profile/)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("leaves the switch where it was when the save fails, and says so", async () => {
    action.updateProfileAction.mockResolvedValue({ ok: false, code: "DATABASE_UNAVAILABLE" });
    show();
    const toggle = screen.getByRole("switch", { name: "Public profile" });
    fireEvent.click(toggle);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
    expect(toggle).toBeChecked();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("asks an expired session to sign in again", async () => {
    action.updateProfileAction.mockResolvedValue({ ok: false, code: "UNAUTHENTICATED" });
    show();
    fireEvent.click(screen.getByRole("switch", { name: "Public profile" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("session has expired");
  });

  it("saves a contact email, and a blank one clears it", async () => {
    action.updateProfileAction.mockResolvedValue({ ok: true });
    show({ isPublic: true, contactEmail: "old@example.com" });
    const field = screen.getByLabelText("Contact email");
    expect(field).toHaveValue("old@example.com");
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    fireEvent.change(field, { target: { value: "" } });
    fireEvent.click(save);
    await waitFor(() =>
      expect(action.updateProfileAction).toHaveBeenCalledWith({ contactEmail: "" }),
    );
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });

  it("does not send an invalid contact email", async () => {
    show();
    fireEvent.change(screen.getByLabelText("Contact email"), { target: { value: "ani" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(action.updateProfileAction).not.toHaveBeenCalled();
  });
});
