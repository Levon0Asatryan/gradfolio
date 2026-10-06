import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { PhoneNavigation } from "./PhoneNavigation";

const PATH = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => PATH.current }));

const show = (user: { name: string } | null) =>
  render(
    <ThemeWrapper initialMode="light">
      <LanguageProvider>
        <PhoneNavigation user={user} />
      </LanguageProvider>
    </ThemeWrapper>,
  );

describe("PhoneNavigation", () => {
  it("shows the four main places with labels, and More", () => {
    show({ name: "Ani" });
    const bar = screen.getByRole("navigation", { name: "Main menu" });
    for (const name of ["Dashboard", "My profile", "Projects", "Explore"]) {
      expect(within(bar).getByRole("link", { name })).toBeInTheDocument();
    }
    expect(within(bar).getByRole("button", { name: "More" })).toBeInTheDocument();
    expect(within(bar).queryByRole("link", { name: "Account" })).toBeNull();
  });

  it("More opens a sheet with the rest and a working logout", () => {
    show({ name: "Ani" });
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const sheet = screen.getByRole("dialog", { name: "More" });
    expect(within(sheet).getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(within(sheet).getByRole("link", { name: "Integrations" })).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Log out" })).toHaveAttribute(
      "href",
      "/auth/logout",
    );
  });

  it("offers sign in under More to a visitor, and no logout", () => {
    show(null);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const sheet = screen.getByRole("dialog", { name: "More" });
    expect(within(sheet).getByRole("link", { name: "Auth0 Login" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
    expect(within(sheet).queryByRole("link", { name: "Log out" })).toBeNull();
  });
});
