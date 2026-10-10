import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { am } from "@/data/locales/am";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { AppNavigation, type NavUser } from "./AppNavigation";
import type { NavMode } from "./navMode";

// TypographyWithTooltip watches its own size; jsdom has no ResizeObserver.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const show = (user: NavUser | null, initialMode?: NavMode) =>
  render(
    <ThemeWrapper initialMode="light">
      <LanguageProvider>
        <AppNavigation user={user} initialMode={initialMode} />
      </LanguageProvider>
    </ThemeWrapper>,
  );

const PATH = vi.hoisted(() => ({ current: "/" }));
vi.mock("@/lib/notifications/actions", () => ({
  markNotificationReadAction: vi.fn(),
  markAllNotificationsReadAction: vi.fn(),
  respondToInviteAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => PATH.current,
  useRouter: () => ({ refresh: vi.fn() }),
}));
const current = () => screen.getByRole("link", { current: "page" });

const hrefs = () => screen.getAllByRole("link").map((a) => a.getAttribute("href"));

beforeEach(() => {
  PATH.current = "/";
});

describe("AppNavigation (tracker 2.13)", () => {
  it("is marked so the 404 page can hide it before the first paint (M4 F4)", () => {
    show(null);
    expect(document.querySelector("nav")).toHaveAttribute("data-app-nav");
  });

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
        expect.arrayContaining([
          "/",
          "/projects",
          "/teams",
          "/integrations",
          "/search",
          "/settings",
        ]),
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
      "Teams",
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

describe("sidebar toggle", () => {
  const WIDE = { value: true };
  const toggle = () => screen.getByRole("button", { name: "Sidebar" });

  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: WIDE.value,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    WIDE.value = true;
  });
  afterEach(() => {
    document.cookie = "nav=; path=/; max-age=0";
  });

  it("starts expanded from 1200px and collapsed below it when nothing is stored", () => {
    show(null);
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    cleanup();
    WIDE.value = false;
    show(null);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("a stored choice wins over the width", () => {
    WIDE.value = false;
    show(null, "full");
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("a stored rail wins on a wide screen", () => {
    show(null, "rail");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses and expands, and stores each choice in the cookie", () => {
    show(null);
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(document.cookie).toContain("nav=rail");
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(document.cookie).toContain("nav=full");
  });

  it("is a real button (keyboard-activatable) whose tooltip names the next action", async () => {
    show(null);
    expect(toggle().tagName).toBe("BUTTON");
    fireEvent.mouseOver(toggle());
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Collapse sidebar");
    fireEvent.click(toggle());
    fireEvent.mouseOver(toggle());
    expect(
      await screen.findByText("Expand sidebar", {
        selector: '[role="tooltip"] *, [role="tooltip"]',
      }),
    ).toBeInTheDocument();
  });

  it("keeps every link and the logout reachable in both modes", () => {
    for (const mode of ["full", "rail"] as const) {
      const { unmount } = show({ name: "Ani" }, mode);
      expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Log out" })).toBeInTheDocument();
      unmount();
    }
  });

  it("renders the long Armenian labels in the collapsed rail", () => {
    // jsdom has no layout (and ignores the media-query widths), so it cannot measure whether
    // the text clips; that was checked in a browser (#55) and the width is RAIL_WIDTH. This pins
    // what jsdom can see: the rail is collapsed and the Armenian labels are the ones rendered.
    render(
      <ThemeWrapper initialMode="light">
        <LanguageProvider initialLanguage="am">
          <AppNavigation user={{ name: "Ani" }} initialMode="rail" />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(screen.getByRole("link", { name: am.common.integrations })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: am.common.settings })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: am.common.sidebar })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("AppNavigation: notifications", () => {
  it("has the bell above the user card for a signed-in user, in both modes", () => {
    for (const mode of ["full", "rail"] as const) {
      const view = show({ name: "Ani" }, mode);
      const bell = screen.getByTestId("bell-button");
      expect(bell).toHaveAttribute("aria-haspopup", "dialog");
      expect(bell.compareDocumentPosition(screen.getByTestId("nav-user"))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      view.unmount();
    }
  });

  it("has no bell for a visitor", () => {
    show(null);
    expect(screen.queryByTestId("bell-button")).toBeNull();
  });
});
