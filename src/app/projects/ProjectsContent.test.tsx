import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { projectSummary } from "@/testing/fixtures";
import ProjectsContent from "./ProjectsContent";

const nav = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, refresh: nav.refresh }),
  usePathname: () => "/projects",
  useSearchParams: () => new URLSearchParams(),
}));
const more = vi.hoisted(() => ({ action: vi.fn(), setDraft: vi.fn() }));
vi.mock("@/lib/projects/actions", () => ({
  loadMoreProjectsAction: more.action,
  setDraftStateAction: more.setDraft,
}));

const cards = () => screen.queryAllByRole("article");
const two = [
  projectSummary({ id: "a", title: "Alpha" }),
  projectSummary({ id: "b", title: "Beta", category: "research" }),
];

beforeEach(() => {
  nav.replace.mockReset();
  more.action.mockReset();
  more.setDraft.mockReset();
  nav.refresh.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("/projects", () => {
  it("shows the API's projects with a header and one primary action", () => {
    renderInApp(<ProjectsContent items={two} nextCursor={null} query={{}} />);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
    expect(screen.getByRole("link", { name: "New Project" })).toHaveAttribute(
      "href",
      "/projects/new",
    );
    expect(cards()).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("puts a category in the URL, and marks the chip the URL holds as pressed", () => {
    const { unmount } = renderInApp(<ProjectsContent items={two} nextCursor={null} query={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Research" }));
    expect(nav.replace).toHaveBeenCalledWith("/projects?category=research");
    unmount();
    renderInApp(
      <ProjectsContent items={[two[1]!]} nextCursor={null} query={{ category: "research" }} />,
    );
    expect(screen.getByRole("button", { name: "Research" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  });

  it("puts a search in the URL 300 ms after the last key, not on every key", () => {
    vi.useFakeTimers();
    renderInApp(<ProjectsContent items={two} nextCursor={null} query={{}} />);
    const box = screen.getByRole("textbox", { name: "Search projects…" });
    fireEvent.change(box, { target: { value: "C+" } });
    fireEvent.change(box, { target: { value: "C++ & Go" } });
    act(() => void vi.advanceTimersByTime(299));
    expect(nav.replace).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/projects?q=C%2B%2B+%26+Go");
  });

  it("says 'no match', not 'no projects yet', for an empty filtered list, and clears it", () => {
    renderInApp(<ProjectsContent items={[]} nextCursor={null} query={{ q: "zzzzqq" }} />);
    expect(screen.getByText("No projects match your search.")).toBeVisible();
    expect(screen.queryByText("No projects yet")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(nav.replace).toHaveBeenCalledWith("/projects");
  });

  it("says 'no projects yet' only for an unfiltered empty list", () => {
    renderInApp(<ProjectsContent items={[]} nextCursor={null} query={{}} />);
    expect(screen.getByText("No projects yet")).toBeVisible();
  });

  it("loads the next page with the filters and the cursor, and appends it", async () => {
    more.action.mockResolvedValue({
      ok: true,
      items: [projectSummary({ id: "c", title: "Gamma" })],
      nextCursor: null,
    });
    renderInApp(<ProjectsContent items={two} nextCursor="cur1" query={{ category: "course" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(more.action).toHaveBeenCalledWith({ category: "course", cursor: "cur1" });
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("shows a failed 'load more' as an error and keeps what is on screen and the button", async () => {
    more.action.mockResolvedValue({ ok: false, code: "API_UNREACHABLE" });
    renderInApp(<ProjectsContent items={two} nextCursor="cur1" query={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("More projects could not be loaded");
    expect(cards()).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Load more" })).toBeEnabled();
  });

  it("labels the page in Russian", () => {
    renderInApp(<ProjectsContent items={two} nextCursor={null} query={{}} />, "ru");
    expect(screen.getByRole("button", { name: "Хакатон" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Проекты" })).toBeVisible();
  });
});

describe("/projects quick publish", () => {
  it("a published draft stops being a draft in the feed (the feed keeps its own list)", async () => {
    more.setDraft.mockResolvedValue({ ok: true, isDraft: false, isPublic: true });
    renderInApp(
      <ProjectsContent
        items={[
          projectSummary({ id: "a", title: "Alpha", isDraft: true, isOwner: true }),
          projectSummary({ id: "b", title: "Beta", isDraft: true, isOwner: true }),
        ]}
        nextCursor={null}
        query={{}}
      />,
    );
    expect(screen.getAllByText("Draft")).toHaveLength(2);
    // Publish the first card only.
    fireEvent.click(screen.getAllByRole("button", { name: "Publish" })[0]!);
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /Publish/ })).getByRole("button", {
        name: "Publish",
      }),
    );
    await waitFor(() => expect(screen.getAllByText("Draft")).toHaveLength(1));
    expect(more.setDraft).toHaveBeenCalledWith({ id: "a", draft: false });
    expect(nav.refresh).toHaveBeenCalled();
    // Beta is untouched. The page is aria-hidden until Alpha's dialog has finished closing.
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Publish" })).toHaveLength(1));
  });

  it("focus moves to a connected status line that announces the result, after the button is gone (Codex P2 on #121)", async () => {
    more.setDraft.mockResolvedValue({ ok: true, isDraft: false, isPublic: true });
    renderInApp(
      <ProjectsContent
        items={[projectSummary({ id: "a", title: "Alpha", isDraft: true, isOwner: true })]}
        nextCursor={null}
        query={{}}
      />,
    );
    const publish = screen.getByRole("button", { name: "Publish" });
    publish.focus();
    fireEvent.click(publish);
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /Publish/ })).getByRole("button", {
        name: "Publish",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
    // The button, its dialog and the element that had the focus are gone from the document.
    expect(publish.isConnected).toBe(false);
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Published.");
    await waitFor(() => expect(status).toHaveFocus());
    expect(status.isConnected).toBe(true);
    expect(document.body).not.toBe(document.activeElement);
  });
});
