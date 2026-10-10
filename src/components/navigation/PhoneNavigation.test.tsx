import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { PhoneNavigation } from "./PhoneNavigation";

const PATH = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => PATH.current,
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/notifications/actions", () => ({
  markNotificationReadAction: vi.fn(),
  markAllNotificationsReadAction: vi.fn(),
  respondToInviteAction: vi.fn(),
}));

const show = (user: { name: string } | null) =>
  render(
    <ThemeWrapper initialMode="light">
      <LanguageProvider>
        <PhoneNavigation user={user} />
      </LanguageProvider>
    </ThemeWrapper>,
  );

describe("PhoneNavigation", () => {
  it("is marked so the 404 page can hide it before the first paint (M4 F4)", () => {
    show(null);
    expect(screen.getByRole("navigation", { name: "Main menu" })).toHaveAttribute("data-app-nav");
  });

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
    expect(within(sheet).getByRole("link", { name: "Teams" })).toHaveAttribute("href", "/teams");
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

describe("PhoneNavigation: notifications", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            String(url).endsWith("/unread-count") ? { count: 2 } : { items: [], nextCursor: null },
          ),
        ),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  const showWithBell = (user: { name: string } | null) =>
    render(
      <ThemeWrapper initialMode="light">
        <LanguageProvider>
          <NotificationsProvider pollMs={0}>
            <PhoneNavigation user={user} />
          </NotificationsProvider>
        </LanguageProvider>
      </ThemeWrapper>,
    );

  it("puts the bell first under More, and a dot on More while something is unread", async () => {
    showWithBell({ name: "Ani" });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /More, Notifications, unread: 2/ }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId("more-dot")).not.toHaveClass("MuiBadge-invisible");
    fireEvent.click(screen.getByRole("button", { name: /^More/ }));
    const sheet = screen.getByRole("dialog", { name: "More" });
    const rows = within(sheet).getAllByRole("button");
    expect(rows[0]).toHaveAccessibleName("Notifications, unread: 2");
  });

  it("opens the notifications sheet from that row and closes More", async () => {
    showWithBell({ name: "Ani" });
    fireEvent.click(screen.getByRole("button", { name: /^More/ }));
    fireEvent.click(screen.getByTestId("bell-button-phone"));
    expect(await screen.findByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "More" })).toBeNull());
  });

  it("shows no bell and makes no request for a visitor", () => {
    showWithBell(null);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.queryByTestId("bell-button-phone")).toBeNull();
    expect(screen.getByTestId("more-dot")).toHaveClass("MuiBadge-invisible");
  });
});
