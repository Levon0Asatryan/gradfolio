import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { DeleteAccount } from "./DeleteAccount";

const doFetch = vi.fn();
const replace = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", doFetch);
  Object.defineProperty(window, "location", { value: { replace }, configurable: true });
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
    expect(doFetch).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole("checkbox"));
    expect(confirm).toBeEnabled();
  });

  it("signs out right after the API deleted the account", async () => {
    doFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox"));
    fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/logout"));
    const [url, init] = doFetch.mock.calls[0]!;
    expect([url, init.method]).toEqual(["/api/account", "DELETE"]);
  });

  it("stays, says so and does not sign out when the delete fails", async () => {
    doFetch.mockResolvedValue(
      new Response(JSON.stringify({ code: "DATABASE_UNAVAILABLE" }), { status: 503 }),
    );
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox"));
    fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not delete your account");
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("says the account was not deleted when GitHub did not confirm", async () => {
    doFetch.mockResolvedValue(
      new Response(JSON.stringify({ code: "GITHUB_REVOKE_FAILED" }), { status: 502 }),
    );
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox"));
    fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "GitHub did not confirm that access was removed, so your account was not deleted",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("a network failure is a failure, not a sign-out", async () => {
    doFetch.mockRejectedValue(new TypeError("failed"));
    const dialog = open();
    fireEvent.click(dialog.getByRole("checkbox"));
    fireEvent.click(dialog.getByRole("button", { name: "Delete account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not delete your account");
    expect(replace).not.toHaveBeenCalled();
  });

  it("cancel deletes nothing", () => {
    const dialog = open();
    fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    expect(doFetch).not.toHaveBeenCalled();
  });
});
