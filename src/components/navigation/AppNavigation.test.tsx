import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { AppNavigation, type NavUser } from "./AppNavigation";

// TypographyWithTooltip watches its own size; jsdom has no ResizeObserver.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const show = (user: NavUser | null) =>
  render(
    <ThemeWrapper initialMode="light">
      <LanguageProvider>
        <AppNavigation user={user} />
      </LanguageProvider>
    </ThemeWrapper>,
  );

const PATH = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => PATH.current }));
const current = () => screen.getByRole("link", { current: "page" });

const hrefs = () => screen.getAllByRole("link").map((a) => a.getAttribute("href"));

beforeEach(() => {
  PATH.current = "/";
});

describe("AppNavigation (tracker 2.13)", () => {
  it("names the logout link", () => {
    show({ name: "Ani" });
    expect(screen.getByRole("link", { name: "Log out" })).toHaveAttribute("href", "/auth/logout");
  });

  it("does not render an avatar from a non-http(s) picture", () => {
    show({ name: "Ani", picture: "javascript:alert(1)" });
    expect(document.querySelector('img[src^="javascript:"]')).toBeNull();
  });

  it("offers login and the login-connections stepper to a visitor, and no logout", () => {
    show(null);
    expect(hrefs()).toContain("/auth/login");
    expect(hrefs()).toContain("/integrations/connections");
    expect(hrefs()).not.toContain("/auth/logout");
    expect(screen.queryByTestId("nav-user")).toBeNull();
  });

  it("shows a signed-in user their name and a logout link instead", () => {
    show({ name: "Ani Petrosyan", picture: "https://lh3.googleusercontent.com/a/ani" });
    expect(hrefs()).not.toContain("/auth/login");
    expect(hrefs()).not.toContain("/integrations/connections");
    expect(screen.getByRole("link", { name: "Log out" })).toHaveAttribute("href", "/auth/logout");
    expect(within(screen.getByTestId("nav-user")).getByText("Ani Petrosyan")).toBeInTheDocument();
  });

  it("keeps every other item for both", () => {
    for (const user of [null, { name: "Ani" }]) {
      const { unmount } = show(user);
      expect(hrefs()).toEqual(
        expect.arrayContaining(["/", "/projects", "/integrations", "/search", "/settings"]),
      );
      unmount();
    }
  });

  it("labels every item and never truncates (labels wrap)", () => {
    show({ name: "Ani" });
    for (const name of [
      "Dashboard",
      "My profile",
      "Projects",
      "Explore",
      "Integrations",
      "Account",
      "Settings",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("lights up Profile on a profile and Account on /account, never both", () => {
    PATH.current = "/profile/0b6f2c1e-1111-4222-8333-444455556666";
    const first = show({ name: "Ani" });
    expect(current()).toHaveAccessibleName("My profile");
    first.unmount();
    PATH.current = "/account";
    show({ name: "Ani" });
    expect(current()).toHaveAccessibleName("Account");
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
  });

  it("does not light up Projects for someone else's project opened from Explore", () => {
    PATH.current = "/projects/ecoroute";
    show({ name: "Ani" });
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });

  it("is the sidebar: a labelled nav landmark", () => {
    PATH.current = "/";
    show(null);
    expect(screen.getByRole("navigation", { name: "Main menu" })).toBeInTheDocument();
  });
});
