import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import type { MyTeams } from "@/lib/api/types";
import { TeamsView, type TeamsViewProps } from "./TeamsView";

const nav = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/teams",
  useSearchParams: () => new URLSearchParams(),
}));
const team = vi.hoisted(() => ({
  remove: vi.fn(),
  leave: vi.fn(),
  invite: vi.fn(),
  external: vi.fn(),
}));
vi.mock("@/lib/team/actions", () => ({
  removeMemberAction: team.remove,
  leaveAction: team.leave,
  inviteAction: team.invite,
  addExternalAction: team.external,
}));
const notif = vi.hoisted(() => ({ respond: vi.fn() }));
vi.mock("@/lib/notifications/actions", () => ({ respondToInviteAction: notif.respond }));

const P1 = "0b6f2c1e-1111-4222-8333-444455556601";
const P2 = "0b6f2c1e-1111-4222-8333-444455556602";
const M = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: "Ani",
  role: null,
  status: "accepted" as const,
  userId: "u-ani",
  avatarUrl: null,
  createdAt: "2026-10-09T12:00:00.000Z",
  ...over,
});
const none = { items: [], nextCursor: null };
const teams = (over: Partial<MyTeams> = {}): MyTeams => ({
  owned: none,
  member: none,
  incoming: none,
  outgoing: none,
  ...over,
});
const show = (t: MyTeams, over: Partial<TeamsViewProps> = {}) =>
  renderInApp(<TeamsView teams={t} viewerUserId={null} more={{}} firstHref={null} {...over} />);

beforeEach(() => {
  vi.resetAllMocks();
  notif.respond.mockResolvedValue({ ok: true });
  team.remove.mockResolvedValue({ ok: true });
  team.leave.mockResolvedValue({ ok: true });
});

describe("empty states", () => {
  it("says what is missing and what to do next, in every section", () => {
    show(teams());
    expect(screen.getByRole("heading", { level: 1, name: "Teams" })).toBeVisible();
    expect(screen.getByText("No invitations are waiting for you.")).toBeVisible();
    expect(screen.getByText("You have no unanswered invitations.")).toBeVisible();
    expect(screen.getByText("None of your projects has a team yet.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Go to my projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByText("You haven’t joined anyone’s project yet.")).toBeVisible();
  });
});

describe("incoming invitations", () => {
  const incoming = {
    items: [
      {
        id: "m1",
        project: { id: P1, title: "Smart Campus" },
        role: "Designer",
        invitedAt: "2026-10-09T12:00:00.000Z",
        invitedBy: { id: "u-owner", name: "Owen" },
      },
    ],
    nextCursor: null,
  };

  it("names the project, links the inviter only when the API gave an account, and never links the project", () => {
    show(teams({ incoming }));
    const row = screen.getByText("Smart Campus").closest("li")!;
    expect(within(row).getByRole("link", { name: "Owen" })).toHaveAttribute(
      "href",
      "/profile/u-owner",
    );
    expect(within(row).getByText(/as Designer/)).toBeVisible();
    expect(within(row).queryByRole("link", { name: "Smart Campus" })).toBeNull();
  });

  it("accepts for that project, says so, and refreshes the lists", async () => {
    show(teams({ incoming }));
    fireEvent.click(screen.getByRole("button", { name: "Accept the invitation to Smart Campus" }));
    await waitFor(() => expect(notif.respond).toHaveBeenCalledWith(P1, "accept"));
    expect(await screen.findByText("You joined Smart Campus")).toBeVisible();
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("declines, and a double click is one request", async () => {
    let finish: (v: unknown) => void = () => {};
    notif.respond.mockReturnValue(new Promise((r) => (finish = r)));
    show(teams({ incoming }));
    const decline = screen.getByRole("button", { name: "Decline the invitation to Smart Campus" });
    fireEvent.click(decline);
    fireEvent.click(decline);
    await waitFor(() => expect(decline).toBeDisabled());
    finish({ ok: true });
    expect(await screen.findByText("You declined the invitation to Smart Campus")).toBeVisible();
    expect(notif.respond).toHaveBeenCalledTimes(1);
  });

  it("an invitation that was withdrawn says so and refreshes", async () => {
    notif.respond.mockResolvedValue({ ok: false, code: "NOT_FOUND" });
    show(teams({ incoming }));
    fireEvent.click(screen.getByRole("button", { name: /^Accept the invitation/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no longer available");
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("any other failure keeps the buttons and shows the reason", async () => {
    notif.respond.mockResolvedValue({ ok: false, code: "RATE_LIMITED" });
    show(teams({ incoming }));
    fireEvent.click(screen.getByRole("button", { name: /^Accept the invitation/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
    expect(screen.getByRole("button", { name: /^Accept the invitation/ })).toBeEnabled();
  });
});

describe("outgoing invitations", () => {
  const outgoing = {
    items: [
      {
        id: "0b6f2c1e-1111-4222-8333-4444555566b1",
        project: { id: P1, title: "Smart Campus" },
        invitee: { id: "u-ben", name: "Ben", avatarUrl: null },
        role: null,
        invitedAt: "2026-10-09T12:00:00.000Z",
      },
    ],
    nextCursor: null,
  };

  it("prints the date in the app language (fixed locale, UTC), so server and browser agree", () => {
    renderInApp(
      <TeamsView teams={teams({ outgoing })} viewerUserId={null} more={{}} firstHref={null} />,
      "ru",
    );
    expect(screen.getByText(/9 окт\. 2026 г\./)).toBeVisible();
  });

  it("cancels only after a confirmation that names the invitee, and calls the remove action", async () => {
    show(teams({ outgoing }));
    expect(screen.getByRole("link", { name: "Smart Campus" })).toHaveAttribute(
      "href",
      `/projects/${P1}`,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel the invitation to Ben" }));
    const dialog = await screen.findByRole("dialog", { name: "Cancel the invitation to Ben?" });
    expect(team.remove).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel invitation" }));
    await waitFor(() =>
      expect(team.remove).toHaveBeenCalledWith(P1, "0b6f2c1e-1111-4222-8333-4444555566b1"),
    );
    expect(await screen.findByText("Invitation cancelled")).toBeVisible();
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("keeps the confirmation open with the reason when the API refuses", async () => {
    team.remove.mockResolvedValue({ ok: false, code: "RATE_LIMITED" });
    show(teams({ outgoing }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel the invitation to Ben" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel invitation" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Too many requests");
  });
});

describe("teams of my projects and projects I'm on", () => {
  it("reuses the project page's team section for an owned project: add, remove and the pending chip", () => {
    show(
      teams({
        owned: {
          items: [
            {
              id: P1,
              title: "Smart Campus",
              isPublic: true,
              isDraft: false,
              members: [
                M("0b6f2c1e-1111-4222-8333-4444555566c1"),
                M("0b6f2c1e-1111-4222-8333-4444555566c2", {
                  name: "Ben",
                  status: "pending",
                  userId: "u-ben",
                }),
              ],
            },
          ],
          nextCursor: null,
        },
      }),
    );
    const panel = screen.getByRole("region", { name: "Smart Campus" });
    expect(within(panel).getByRole("button", { name: "Add teammate" })).toBeVisible();
    expect(within(panel).getByRole("button", { name: "Remove Ani" })).toBeVisible();
    expect(within(panel).getByText("Pending")).toBeVisible();
    expect(within(panel).getByRole("link", { name: "Open project" })).toHaveAttribute(
      "href",
      `/projects/${P1}`,
    );
  });

  it("shows a joined project with its owner and my role, offers Leave on my row only, and returns to /teams", async () => {
    show(
      teams({
        member: {
          items: [
            {
              id: P2,
              title: "Sign Language Dataset",
              isPublic: true,
              role: "QA",
              joinedAt: "2026-10-09T12:00:00.000Z",
              owner: { id: "u-owner", name: "Owen", avatarUrl: null },
              team: [
                M("m-me", { name: "Me", userId: "u-me" }),
                M("m-other", { name: "Other", userId: "u-other" }),
              ],
            },
          ],
          nextCursor: null,
        },
      }),
      { viewerUserId: "u-me" },
    );
    const panel = screen.getByRole("region", { name: "Sign Language Dataset" });
    expect(within(panel).getByText(/Owner: Owen/)).toBeVisible();
    expect(within(panel).getByText(/Your role: QA/)).toBeVisible();
    expect(within(panel).queryByRole("button", { name: "Add teammate" })).toBeNull();
    expect(within(panel).getAllByRole("button", { name: "Leave project" })).toHaveLength(1);
    fireEvent.click(within(panel).getByRole("button", { name: "Leave project" }));
    const dialog = await screen.findByRole("dialog", { name: "Leave Sign Language Dataset?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Leave" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/teams?flash=left"));
    expect(team.leave).toHaveBeenCalledWith(P2);
  });
});

describe("paging", () => {
  it("offers 'Show more' for a list with a next page, and a way back to the first page", () => {
    show(teams(), {
      more: { owned: "/teams?ownedCursor=o2", outgoing: "/teams?outgoingCursor=x" },
      firstHref: "/teams",
    });
    expect(
      screen.getAllByRole("link", { name: "Show more" }).map((a) => a.getAttribute("href")),
    ).toEqual(["/teams?outgoingCursor=x", "/teams?ownedCursor=o2"]);
    expect(screen.getByRole("link", { name: "Back to the first page" })).toHaveAttribute(
      "href",
      "/teams",
    );
  });

  it("shows nothing extra on a single page", () => {
    show(teams());
    expect(screen.queryByRole("link", { name: "Show more" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Back to the first page" })).toBeNull();
  });
});

describe("languages", () => {
  it("renders in Russian and Armenian", () => {
    const ru = renderInApp(
      <TeamsView teams={teams()} viewerUserId={null} more={{}} firstHref={null} />,
      "ru",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Команды" })).toBeVisible();
    ru.unmount();
    renderInApp(<TeamsView teams={teams()} viewerUserId={null} more={{}} firstHref={null} />, "am");
    expect(screen.getByRole("heading", { level: 1, name: "Թիմեր" })).toBeVisible();
  });
});
