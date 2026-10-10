import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { renderInApp } from "@/testing/render";
import { dashboard } from "@/testing/fixtures";
import ActivityFeed from "./ActivityFeed";
import DashboardStats from "./DashboardStats";
import RecentProjects from "./RecentProjects";

const actions = vi.hoisted(() => ({ more: vi.fn() }));
vi.mock("@/lib/dashboard/actions", () => ({ loadMoreActivitiesAction: actions.more }));

beforeEach(() => vi.resetAllMocks());

const PROJECT = "5c1d9a3e-aaaa-4bbb-8ccc-ddddeeeeffff";
const entry = (over: Record<string, unknown> = {}) => ({
  id: "a1",
  type: "project" as const,
  translationKey: "projectCreated",
  translationParams: { projectId: PROJECT, projectName: "EcoRoute" },
  timestamp: "2026-10-09T12:00:00.000Z",
  ...over,
});

describe("DashboardStats", () => {
  it("shows the API's counts and no GitHub tile while the API has no stars", () => {
    renderInApp(<DashboardStats stats={dashboard().stats} />);
    const list = screen.getByRole("list", { name: "Overview" });
    expect(within(list).getByText("Projects").previousSibling).toHaveTextContent("4");
    expect(within(list).getByText("Published").previousSibling).toHaveTextContent("2");
    expect(within(list).queryByText("GitHub stars")).toBeNull();
    expect(screen.queryByText(/Connections|LinkedIn/)).toBeNull();
  });

  it("shows GitHub stars when the API has a number, including 0", () => {
    const stats = { ...dashboard().stats, githubStars: 0 };
    renderInApp(<DashboardStats stats={stats} />);
    expect(screen.getByText("GitHub stars").previousSibling).toHaveTextContent("0");
  });

  it("a failed read is an error line, never zeros", () => {
    renderInApp(<DashboardStats stats={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load your numbers.");
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("RecentProjects", () => {
  it("links each project, and marks a draft, a private one and a team project", () => {
    const base = dashboard().recentProjects[0]!;
    renderInApp(
      <RecentProjects
        items={[
          { ...base, id: "d1", title: "Draft one", isDraft: true, isPublic: false },
          { ...base, id: "p1", title: "Private one", isPublic: false },
          { ...base, id: "m1", title: "Team one", role: "member" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /Draft one/ })).toHaveAttribute("href", "/projects/d1");
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByText("Team member")).toBeInTheDocument();
  });

  it("no projects is an invitation; a failed read is an error, not that invitation", () => {
    const { unmount } = renderInApp(<RecentProjects items={[]} />);
    expect(screen.getByText("No projects yet. Start with your first one.")).toBeInTheDocument();
    unmount();
    renderInApp(<RecentProjects items={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load your recent projects.");
    expect(screen.queryByText(/No projects yet/)).toBeNull();
  });
});

describe("ActivityFeed", () => {
  it("renders each entry from its key and params, in the reader's language", () => {
    renderInApp(
      <ActivityFeed
        items={[
          entry(),
          entry({
            id: "a2",
            translationKey: "teamMemberJoined",
            translationParams: { projectId: PROJECT, projectName: "EcoRoute", memberName: "Ben" },
          }),
        ]}
      />,
      "ru",
    );
    expect(screen.getByText("Вы создали «EcoRoute»")).toBeInTheDocument();
    expect(screen.getByText("Ben присоединился к «EcoRoute»")).toBeInTheDocument();
  });

  it("an unknown key is a neutral line, never the raw key", () => {
    renderInApp(
      <ActivityFeed items={[entry({ translationKey: "somethingNew", translationParams: null })]} />,
    );
    expect(screen.getByText("Something happened in your account")).toBeInTheDocument();
    expect(screen.queryByText("somethingNew")).toBeNull();
  });

  it.each(["constructor", "toString", "__proto__"])(
    "the key %s (an object's own property name) is unknown, not a crash",
    (key) => {
      renderInApp(<ActivityFeed items={[entry({ translationKey: key })]} />);
      expect(screen.getByText("Something happened in your account")).toBeInTheDocument();
    },
  );

  it("links to the project only for a real id, and never for a deleted project", () => {
    renderInApp(
      <ActivityFeed
        items={[
          entry({ id: "ok" }),
          entry({
            id: "bad",
            translationParams: { projectId: "javascript:alert(1)", projectName: "Bad" },
          }),
          entry({
            id: "gone",
            translationKey: "projectDeleted",
            translationParams: { projectId: PROJECT, projectName: "Old" },
          }),
        ]}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", `/projects/${PROJECT}`);
  });

  it("a name that looks like a replacement pattern is printed as typed", () => {
    renderInApp(
      <ActivityFeed
        items={[entry({ translationParams: { projectId: PROJECT, projectName: "$& $1" } })]}
      />,
    );
    expect(screen.getByText('You created "$& $1"')).toBeInTheDocument();
  });

  it("a failed feed is an error, not 'no recent activity'", () => {
    renderInApp(<ActivityFeed items={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load more activity.");
    expect(screen.queryByText("No recent activity")).toBeNull();
  });

  it("Show more replaces the newest few by the newest page, then follows the cursor", async () => {
    const few = Array.from({ length: 5 }, (_, i) => entry({ id: `f${i}` }));
    actions.more
      .mockResolvedValueOnce({
        ok: true,
        items: [...few, entry({ id: "n5" })],
        nextCursor: "c1",
      })
      .mockResolvedValueOnce({
        ok: true,
        items: [entry({ id: "n6" }), entry({ id: "n5" })],
        nextCursor: null,
      });
    renderInApp(<ActivityFeed items={few} />);
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(6));
    expect(actions.more).toHaveBeenNthCalledWith(1, {});
    await waitFor(() => expect(screen.getByRole("button", { name: "Show more" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(7)); // n5 not repeated
    expect(actions.more).toHaveBeenNthCalledWith(2, { cursor: "c1" });
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  });

  it("offers no Show more when fewer than the page are all there is", () => {
    renderInApp(<ActivityFeed items={[entry()]} />);
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  });

  it("a failed Show more says so and keeps the list", async () => {
    const few = Array.from({ length: 5 }, (_, i) => entry({ id: `f${i}` }));
    actions.more.mockResolvedValue({ ok: false, code: "RATE_LIMITED" });
    renderInApp(<ActivityFeed items={few} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Show more" })));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t load more activity.");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("a refresh that brings the same entries (a server action refreshes the route) keeps the paged list", async () => {
    const few = Array.from({ length: 5 }, (_, i) => entry({ id: `f${i}` }));
    actions.more.mockResolvedValue({
      ok: true,
      items: [...few, entry({ id: "n5" })],
      nextCursor: null,
    });
    const view = renderInApp(<ActivityFeed items={few} />);
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(6));
    // The same five, as a new array: what the refresh after the action hands down.
    view.rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider>
          <ActivityFeed items={[...few]} />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    // Different entries do start over.
    view.rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider>
          <ActivityFeed items={[entry({ id: "brand-new" })]} />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
