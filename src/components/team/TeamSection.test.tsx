import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import type { TeamMember } from "@/lib/api/types";
import { TeamSection, type TeamSectionProps } from "./TeamSection";

const nav = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
const actions = vi.hoisted(() => ({
  invite: vi.fn(),
  external: vi.fn(),
  remove: vi.fn(),
  leave: vi.fn(),
}));
vi.mock("@/lib/team/actions", () => ({
  inviteAction: actions.invite,
  addExternalAction: actions.external,
  removeMemberAction: actions.remove,
  leaveAction: actions.leave,
}));

const P = "0b6f2c1e-1111-4222-8333-444455556601";
const member = (over: Partial<TeamMember> = {}): TeamMember => ({
  id: "0b6f2c1e-1111-4222-8333-4444555566a1",
  name: "Ani",
  role: "Backend",
  status: "accepted",
  userId: "u-1",
  avatarUrl: null,
  createdAt: "2026-10-09T12:00:00.000Z",
  ...over,
});
const base: TeamSectionProps = {
  projectId: P,
  projectTitle: "Smart Campus",
  isOwner: false,
  isDraft: false,
  members: [],
  managed: null,
  viewerUserId: null,
};
const show = (over: Partial<TeamSectionProps> = {}) =>
  renderInApp(<TeamSection {...base} {...over} />);

beforeEach(() => {
  vi.resetAllMocks();
  actions.remove.mockResolvedValue({ ok: true });
  actions.leave.mockResolvedValue({ ok: true });
  actions.invite.mockResolvedValue({ ok: true });
});

describe("for everyone but the owner", () => {
  it("lists accepted members, links only a visible account, and has no controls at all", () => {
    show({
      members: [
        { id: "m1", name: "Ani", role: "Backend", avatarUrl: null, userId: "u-1" },
        { id: "m2", name: "Gone", role: null, avatarUrl: "http://x.test/a.png", userId: null },
      ],
    });
    expect(screen.getByRole("link", { name: "Ani" })).toHaveAttribute("href", "/profile/u-1");
    expect(screen.queryByRole("link", { name: "Gone" })).toBeNull();
    expect(document.querySelector('img[src^="http:"]')).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing without members", () => {
    const { container } = show();
    expect(container).toBeEmptyDOMElement();
  });

  it("ignores a management view it was not meant to get: no controls without isOwner", () => {
    show({ managed: [member({ status: "pending" })], members: [] });
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("Pending")).toBeNull();
  });

  it("offers Leave on the viewer's own row only, names the project, and goes to the list", async () => {
    show({
      viewerUserId: "u-1",
      members: [
        { id: "m1", name: "Ani", role: null, avatarUrl: null, userId: "u-1" },
        { id: "m2", name: "Ben", role: null, avatarUrl: null, userId: "u-2" },
      ],
    });
    expect(screen.getAllByRole("button", { name: "Leave project" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Leave project" }));
    const dialog = await screen.findByRole("dialog", { name: "Leave Smart Campus?" });
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Leave" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/projects?flash=left"));
    expect(actions.leave).toHaveBeenCalledWith(P);
  });

  it("keeps the dialog and says why when leaving fails", async () => {
    actions.leave.mockResolvedValue({ ok: false, code: "NOT_FOUND" });
    show({
      viewerUserId: "u-1",
      members: [{ id: "m1", name: "Ani", role: null, avatarUrl: null, userId: "u-1" }],
    });
    fireEvent.click(screen.getByRole("button", { name: "Leave project" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Leave" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("could not be found");
    expect(nav.push).not.toHaveBeenCalled();
  });
});

describe("for the owner", () => {
  const owner = (managed: TeamMember[], over: Partial<TeamSectionProps> = {}) =>
    show({ isOwner: true, managed, ...over });

  it("shows every status, with a chip for pending and declined only", () => {
    owner([
      member(),
      member({
        id: "0b6f2c1e-1111-4222-8333-4444555566a2",
        name: "Ben",
        status: "pending",
        userId: "u-2",
      }),
      member({
        id: "0b6f2c1e-1111-4222-8333-4444555566a3",
        name: "Cy",
        status: "rejected",
        userId: "u-3",
      }),
    ]);
    expect(screen.getByText("Pending")).toBeVisible();
    expect(screen.getByText("Declined")).toBeVisible();
    expect(screen.getByText(/Waiting for Ben to answer/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Add teammate" })).toBeVisible();
  });

  it("invites a declined person again with the same role, then refreshes and says so", async () => {
    owner([member({ status: "rejected", userId: "u-3", role: "QA" })]);
    fireEvent.click(screen.getByRole("button", { name: "Invite Ani again" }));
    await waitFor(() => expect(actions.invite).toHaveBeenCalledWith(P, "u-3", "QA"));
    expect(await screen.findByText("Invitation sent to Ani")).toBeVisible();
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("does not offer to invite again someone whose account is gone", () => {
    owner([member({ status: "rejected", userId: null })]);
    expect(screen.queryByRole("button", { name: /Invite .* again/ })).toBeNull();
  });

  it("removes an accepted member after a confirmation that names the person and the project", async () => {
    owner([member()]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Ani" }));
    const dialog = await screen.findByRole("dialog", { name: "Remove Ani from Smart Campus?" });
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
    expect(actions.remove).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(actions.remove).toHaveBeenCalledWith(P, "0b6f2c1e-1111-4222-8333-4444555566a1"),
    );
    expect(await screen.findByText("Ani removed")).toBeVisible();
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("calls a pending removal a cancelled invitation, and a name without an account just 'Remove'", async () => {
    owner([
      member({ status: "pending", userId: "u-2", name: "Ben" }),
      member({ id: "0b6f2c1e-1111-4222-8333-4444555566a9", name: "Ext", userId: null }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel the invitation to Ben" }));
    expect(
      await screen.findByRole("dialog", { name: "Cancel the invitation to Ben?" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Cancel invitation" }));
    expect(await screen.findByText("Invitation cancelled")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Remove Ext" }));
    expect(await screen.findByRole("dialog", { name: "Remove Ext?" })).toBeVisible();
  });

  it("Cancel in the confirmation removes nothing", async () => {
    owner([member()]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Ani" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(actions.remove).not.toHaveBeenCalled();
  });

  it("keeps the confirmation open with the reason when the API refuses", async () => {
    actions.remove.mockResolvedValue({ ok: false, code: "RATE_LIMITED" });
    owner([member()]);
    fireEvent.click(screen.getByRole("button", { name: "Remove Ani" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Too many requests");
    expect(nav.refresh).not.toHaveBeenCalled();
  });

  it("shows an empty-team prompt, and an error with a retry instead of an empty team", () => {
    const view = owner([]);
    expect(screen.getByText("Add the people who built this with you.")).toBeVisible();
    view.unmount();
    owner([], { managed: null, managedFailed: true });
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load the team");
    expect(screen.queryByText("Add the people who built this with you.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("speaks Russian and Armenian too", () => {
    const ru = renderInApp(
      <TeamSection {...base} isOwner managed={[member({ status: "pending" })]} />,
      "ru",
    );
    expect(screen.getByRole("button", { name: "Добавить участника" })).toBeVisible();
    expect(screen.getByText("Ожидает ответа")).toBeVisible();
    ru.unmount();
    renderInApp(<TeamSection {...base} isOwner managed={[member({ status: "pending" })]} />, "am");
    expect(screen.getByRole("button", { name: "Ավելացնել անդամ" })).toBeVisible();
  });
});
