import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { DarkModeContext } from "@/components/theme/ThemeWrapper";
import SettingsPage from "./SettingsPage";

const toggleMode = vi.fn();

const show = (mode: "light" | "dark" = "light") =>
  render(
    <DarkModeContext.Provider value={{ mode, toggleMode }}>
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    </DarkModeContext.Provider>,
  );

beforeEach(() => {
  toggleMode.mockClear();
  localStorage.clear();
  document.cookie = "language=; max-age=0; path=/";
});
afterEach(() => vi.unstubAllGlobals());

describe("SettingsPage", () => {
  it("changes only email language and clears an earlier load error after a successful save", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ preferredLanguage: "ru", teamInvitesEnabled: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    render(
      <LanguageProvider>
        <SettingsPage
          initialEmailPreferences={{ preferredLanguage: "en", teamInvitesEnabled: true }}
          emailError
        />
      </LanguageProvider>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Email language" }));
    fireEvent.click(screen.getByRole("option", { name: "Русский" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(JSON.parse(fetcher.mock.calls[0]![1].body)).toEqual({ preferredLanguage: "ru" });
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  });
  it("still switches UI language when the email API is unavailable", () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetcher);
    render(
      <LanguageProvider>
        <SettingsPage
          initialEmailPreferences={{ preferredLanguage: "en", teamInvitesEnabled: true }}
        />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Հայերեն" }));
    expect(screen.getByRole("button", { name: "Հայերեն" })).toHaveAttribute("aria-pressed", "true");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps the previous email preference and shows a failed save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    render(
      <DarkModeContext.Provider value={{ mode: "light", toggleMode }}>
        <LanguageProvider>
          <SettingsPage
            initialEmailPreferences={{ preferredLanguage: "en", teamInvitesEnabled: true }}
          />
        </LanguageProvider>
      </DarkModeContext.Provider>,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Email me about team invitations" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("switch", { name: "Email me about team invitations" })).toBeChecked();
  });
  it("switches signed-in UI language without changing email preferences", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ preferredLanguage: "ru", teamInvitesEnabled: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    render(
      <DarkModeContext.Provider value={{ mode: "light", toggleMode }}>
        <LanguageProvider>
          <SettingsPage
            initialEmailPreferences={{ preferredLanguage: "en", teamInvitesEnabled: true }}
          />
        </LanguageProvider>
      </DarkModeContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Русский" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "Настройки" })).toBeInTheDocument(),
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("shows language and theme as two cards under one heading", () => {
    show();
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Theme" })).toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it("names each language in its own language and marks the current one", () => {
    show();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Русский" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Հայերեն" })).toHaveAttribute("lang", "hy");
  });

  it("switches language", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Русский" }));
    expect(screen.getByRole("heading", { level: 1, name: "Настройки" })).toBeInTheDocument();
  });

  it("toggles the theme only when the other mode is picked", () => {
    show("light");
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(toggleMode).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(toggleMode).toHaveBeenCalledTimes(1);
  });
});
