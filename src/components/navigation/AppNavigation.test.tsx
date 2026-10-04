import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { AppNavigation, type NavUser } from "./AppNavigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
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

const hrefs = () => screen.getAllByRole("link").map((a) => a.getAttribute("href"));

describe("AppNavigation (tracker 2.13)", () => {
  it("keeps the logout link named when the sidebar is collapsed (mobile)", () => {
    render(
      <ThemeWrapper initialMode="light">
        <LanguageProvider>
          <AppNavigation user={{ name: "Ani" }} collapsed />
        </LanguageProvider>
      </ThemeWrapper>,
    );
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
});
