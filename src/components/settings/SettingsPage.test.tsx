import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("SettingsPage", () => {
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
