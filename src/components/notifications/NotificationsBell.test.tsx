import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import type { Language } from "@/data/locales/types";
import type { Notification } from "@/lib/api/types";
import { notification } from "./fixtures";
import { NotificationsPopoverButton, NotificationsSheet } from "./NotificationsBell";
import { NotificationsProvider } from "./NotificationsProvider";

const PATH = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => PATH.current,
  useRouter: () => ({ refresh: vi.fn() }),
}));
const actions = vi.hoisted(() => ({ one: vi.fn(), all: vi.fn(), respond: vi.fn() }));
vi.mock("@/lib/notifications/actions", () => ({
  markNotificationReadAction: actions.one,
  markAllNotificationsReadAction: actions.all,
  respondToInviteAction: actions.respond,
}));

const res = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

const ID = (n: number) => `0b6f2c1e-1111-4222-8333-44445555660${n}`;
let unread = 2;
let page: { items: Notification[]; nextCursor: string | null } | { code: string; status: number };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  PATH.current = "/";
  unread = 2;
  page = { items: [], nextCursor: null };
  fetchMock = vi.fn((url: string) => {
    if (String(url).endsWith("/unread-count")) return res(200, { count: unread });
    if ("status" in page) return res(page.status, { code: page.code });
    return res(200, page);
  });
  vi.stubGlobal("fetch", fetchMock);
  actions.one.mockResolvedValue({ ok: true });
  actions.all.mockResolvedValue({ ok: true });
  actions.respond.mockResolvedValue({ ok: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

const button = { sx: { display: "flex" } } as const;
const show = (ui = <NotificationsPopoverButton {...button} />, language: Language = "en") =>
  render(
    <ThemeWrapper initialMode="light">
      <LanguageProvider initialLanguage={language}>
        <NotificationsProvider pollMs={0}>{ui}</NotificationsProvider>
      </LanguageProvider>
    </ThemeWrapper>,
  );

const bell = () => screen.getByTestId("bell-button");
const open = async () => {
  fireEvent.click(bell());
  return screen.findByRole("dialog", { name: /notifications/i });
};

describe("the bell button", () => {
  it("names the unread count, in the reader's language", async () => {
    show(undefined, "ru");
    await waitFor(() =>
      expect(bell()).toHaveAttribute("aria-label", "Уведомления, непрочитанных: 2"),
    );
  });

  it("is plain 'Notifications' with nothing unread, and caps the count at 99+", async () => {
    unread = 0;
    const view = show();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => {});
    expect(bell()).toHaveAttribute("aria-label", "Notifications");
    view.unmount();
    unread = 250;
    show();
    await waitFor(() => expect(bell()).toHaveAttribute("aria-label", "Notifications, unread: 99+"));
  });

  it("has no count while the first read has not (or did not) come back", async () => {
    fetchMock.mockImplementation(() => res(503, { code: "API_UNREACHABLE" }));
    show();
    await act(async () => {});
    expect(bell()).toHaveAttribute("aria-label", "Notifications");
  });
});

describe("the panel", () => {
  it("opens as a labelled dialog with focus inside it, and Escape returns focus to the bell", async () => {
    page = { items: [notification({ id: ID(1) })], nextCursor: null };
    show();
    const dialog = await open();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(within(dialog).getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(bell()).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(bell()).toHaveFocus());
  });

  it("lists rows with their sentence, marks one read from the link and from the button", async () => {
    page = {
      items: [
        notification({ id: ID(1) }),
        notification({ id: ID(2), read: true, type: "team_left" }),
      ],
      nextCursor: null,
    };
    show();
    const dialog = await open();
    const link = await within(dialog).findByRole("link", { name: /Ani joined Smart Campus/ });
    expect(link).toHaveAttribute("href", "/projects/0b6f2c1e-1111-4222-8333-444455556688");
    expect(within(dialog).getAllByRole("button", { name: /^Mark as read:/ })).toHaveLength(1);
    fireEvent.click(within(dialog).getByRole("button", { name: /^Mark as read:/ }));
    await waitFor(() => expect(actions.one).toHaveBeenCalledWith(ID(1)));
    await waitFor(() =>
      expect(within(dialog).queryByRole("button", { name: /^Mark as read:/ })).toBeNull(),
    );
  });

  it("following a link marks the row read and closes the panel", async () => {
    page = { items: [notification({ id: ID(1) })], nextCursor: null };
    show();
    const dialog = await open();
    fireEvent.click(await within(dialog).findByRole("link", { name: /Ani joined/ }));
    expect(actions.one).toHaveBeenCalledWith(ID(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes when the route changes (the back button, a link elsewhere)", async () => {
    page = { items: [notification({ id: ID(1) })], nextCursor: null };
    const view = show();
    await open();
    PATH.current = "/projects";
    view.rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider initialLanguage="en">
          <NotificationsProvider pollMs={0}>
            <NotificationsPopoverButton {...button} />
          </NotificationsProvider>
        </LanguageProvider>
      </ThemeWrapper>,
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("does not turn an unsafe link into an anchor", async () => {
    page = {
      items: [
        notification({ id: ID(1), link: "//evil.example/x" }),
        notification({ id: ID(2), link: "javascript:alert(1)" }),
        notification({ id: ID(3), link: null }),
      ],
      nextCursor: null,
    };
    show();
    const dialog = await open();
    await within(dialog).findAllByText(/Ani joined Smart Campus/);
    expect(within(dialog).queryAllByRole("link")).toHaveLength(0);
  });

  it("shows a pending invite with Accept and Decline, and a gone one with neither", async () => {
    page = {
      items: [
        notification({ id: ID(1), type: "team_invite", link: null, invite: { status: "pending" } }),
        notification({ id: ID(2), type: "team_invite", link: null, invite: { status: "gone" } }),
      ],
      nextCursor: null,
    };
    show();
    const dialog = await open();
    expect(await within(dialog).findByText("Waiting for your answer")).toBeInTheDocument();
    expect(within(dialog).getByText("This invitation is no longer available")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: /^Accept the invitation/ })).toHaveLength(
      1,
    );
    expect(within(dialog).getAllByRole("button", { name: /^Decline the invitation/ })).toHaveLength(
      1,
    );
  });
});

describe("answering an invitation", () => {
  const PROJECT = "0b6f2c1e-1111-4222-8333-444455556688";
  const invite = () =>
    notification({ id: ID(1), type: "team_invite", link: null, invite: { status: "pending" } });

  const openWithInvite = async () => {
    page = { items: [invite()], nextCursor: null };
    show();
    const dialog = await open();
    await within(dialog).findByText("Waiting for your answer");
    return dialog;
  };

  it("accepting calls the action for that project, shows the outcome and lowers the badge", async () => {
    const dialog = await openWithInvite();
    await waitFor(() => expect(bell()).toHaveAttribute("aria-label", "Notifications, unread: 2"));
    fireEvent.click(within(dialog).getByRole("button", { name: /^Accept the invitation/ }));
    await waitFor(() => expect(actions.respond).toHaveBeenCalledWith(PROJECT, "accept"));
    expect(await within(dialog).findByText("You joined this project")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^Accept the invitation/ })).toBeNull();
    expect(bell()).toHaveAttribute("aria-label", "Notifications, unread: 1");
  });

  it("a second pending row for the same project is answered with the first, not left with buttons", async () => {
    // An invite sent again leaves two rows for one invitation (M5 follow-up).
    const second = { ...invite(), id: ID(2) };
    page = { items: [invite(), second], nextCursor: null };
    unread = 2;
    show();
    const dialog = await open();
    await waitFor(() =>
      expect(
        within(dialog).getAllByRole("button", { name: /^Accept the invitation/ }),
      ).toHaveLength(2),
    );
    fireEvent.click(within(dialog).getAllByRole("button", { name: /^Accept the invitation/ })[0]!);
    await waitFor(() =>
      expect(within(dialog).getAllByText("You joined this project")).toHaveLength(2),
    );
    expect(within(dialog).queryByRole("button", { name: /^Accept the invitation/ })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: /^Decline the invitation/ })).toBeNull();
    expect(actions.respond).toHaveBeenCalledTimes(1);
    expect(bell()).toHaveAttribute("aria-label", "Notifications");
  });

  it("declining shows the outcome", async () => {
    const dialog = await openWithInvite();
    fireEvent.click(within(dialog).getByRole("button", { name: /^Decline the invitation/ }));
    await waitFor(() => expect(actions.respond).toHaveBeenCalledWith(PROJECT, "reject"));
    expect(await within(dialog).findByText("You declined this invitation")).toBeInTheDocument();
  });

  it("a double click is one request, and both buttons are disabled while it runs", async () => {
    const dialog = await openWithInvite();
    let finish: (v: unknown) => void = () => {};
    actions.respond.mockReturnValue(new Promise((r) => (finish = r)));
    const accept = within(dialog).getByRole("button", { name: /^Accept the invitation/ });
    fireEvent.click(accept);
    fireEvent.click(accept);
    await waitFor(() => expect(accept).toBeDisabled());
    expect(within(dialog).getByRole("button", { name: /^Decline the invitation/ })).toBeDisabled();
    await act(async () => finish({ ok: true }));
    expect(actions.respond).toHaveBeenCalledTimes(1);
  });

  it("an invitation that is gone (404) says so", async () => {
    const dialog = await openWithInvite();
    actions.respond.mockResolvedValue({ ok: false, code: "NOT_FOUND" });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Accept the invitation/ }));
    expect(
      await within(dialog).findByText("This invitation is no longer available"),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^Accept the invitation/ })).toBeNull();
  });

  it("an invitation answered elsewhere (409) reloads the list to show the real state", async () => {
    const dialog = await openWithInvite();
    actions.respond.mockResolvedValue({ ok: false, code: "INVITE_NOT_PENDING" });
    page = {
      items: [{ ...invite(), invite: { status: "accepted" }, read: true }],
      nextCursor: null,
    };
    fireEvent.click(within(dialog).getByRole("button", { name: /^Accept the invitation/ }));
    expect(await within(dialog).findByText("You joined this project")).toBeInTheDocument();
  });

  it("any other failure keeps the buttons and says so on the row", async () => {
    const dialog = await openWithInvite();
    actions.respond.mockResolvedValue({ ok: false, code: "RATE_LIMITED" });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Accept the invitation/ }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Couldn’t save that");
    expect(within(dialog).getByRole("button", { name: /^Accept the invitation/ })).toBeEnabled();
  });
});

describe("the panel, continued", () => {
  it("says 'all caught up' when empty, and offers nothing to mark", async () => {
    unread = 0;
    show();
    const dialog = await open();
    expect(await within(dialog).findByText("You’re all caught up")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Mark all as read" })).toBeDisabled();
  });

  it("shows an error with Try again, and recovers", async () => {
    page = { status: 503, code: "API_UNREACHABLE" };
    show();
    const dialog = await open();
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Couldn’t load notifications",
    );
    page = { items: [notification({ id: ID(1) })], nextCursor: null };
    fireEvent.click(within(dialog).getByRole("button", { name: "Try again" }));
    expect(await within(dialog).findByText(/Ani joined/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("alert")).toBeNull();
  });

  it("asks to sign in again, with a plain link, when the session is gone", async () => {
    page = { status: 401, code: "UNAUTHENTICATED" };
    show();
    const dialog = await open();
    const link = await within(dialog).findByRole("link", { name: "Sign in again" });
    expect(link).toHaveAttribute("href", "/auth/login");
  });

  it("says when it is rate limited", async () => {
    page = { status: 429, code: "RATE_LIMITED" };
    show();
    const dialog = await open();
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Too many requests");
  });

  it("marks everything read and shows more rows on request", async () => {
    page = { items: [notification({ id: ID(1) })], nextCursor: "c1" };
    show();
    const dialog = await open();
    await within(dialog).findByText(/Ani joined/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark all as read" }));
    await waitFor(() => expect(actions.all).toHaveBeenCalledTimes(1));
    page = {
      items: [notification({ id: ID(2), read: true, type: "team_left" })],
      nextCursor: null,
    };
    fireEvent.click(within(dialog).getByRole("button", { name: "Load more" }));
    expect(await within(dialog).findByText(/Ani left Smart Campus/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("shows a row message when marking one read fails", async () => {
    page = { items: [notification({ id: ID(1) })], nextCursor: null };
    actions.one.mockResolvedValue({ ok: false, code: "UNKNOWN_ERROR" });
    show();
    const dialog = await open();
    await within(dialog).findByText(/Ani joined/);
    fireEvent.click(within(dialog).getByRole("button", { name: /^Mark as read:/ }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Couldn’t save that");
  });
});

describe("the phone sheet", () => {
  it("is a labelled dialog that closes with its button", async () => {
    page = { items: [notification({ id: ID(1) })], nextCursor: null };
    const onClose = vi.fn();
    show(<NotificationsSheet open onClose={onClose} />);
    const dialog = await screen.findByRole("dialog", { name: "Notifications" });
    expect(await within(dialog).findByText(/Ani joined/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
