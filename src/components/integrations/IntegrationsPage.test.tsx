import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import IntegrationsPage from "./IntegrationsPage";

describe("/integrations", () => {
  it("connects through a confirmation dialog, in English", () => {
    renderInApp(<IntegrationsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Integrations" })).toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: "Connect" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Connect LinkedIn" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Connect" }));
    expect(screen.getAllByText("Connected").length).toBeGreaterThan(0);
  });

  it("asks before disconnecting, and Cancel changes nothing", async () => {
    renderInApp(<IntegrationsPage />);
    const [disconnect] = screen.getAllByRole("button", { name: "Disconnect" });
    fireEvent.click(disconnect!);
    const dialog = screen.getByRole("dialog", { name: /^Disconnect \w+\?$/ });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getAllByRole("button", { name: "Disconnect" })).toHaveLength(1);
  });

  // The dialogs used to be hardcoded English in every language.
  it("translates the dialogs", () => {
    renderInApp(<IntegrationsPage />, "ru");
    fireEvent.click(screen.getAllByRole("button", { name: "Подключить" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Подключить LinkedIn" });
    expect(within(dialog).getByRole("button", { name: "Отмена" })).toBeVisible();
    expect(within(dialog).getByText(/значок проверки/)).toBeVisible();
  });
});
