import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

const mocks = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/integrations/importActions", () => ({
  listGithubReposAction: mocks.list,
  importGithubReposAction: mocks.save,
}));

const { GithubImportModal } = await import("./GithubImportModal");

const repo = (id: number, over: Record<string, unknown> = {}) => ({
  repoId: id,
  fullName: `ani-p/repo-${id}`,
  description: `Repo ${id} description`,
  language: "Go",
  stars: id,
  forks: 0,
  fork: false,
  archived: false,
  pushedAt: null,
  imported: false,
  projectId: null,
  ...over,
});
const page = (items: unknown[], nextCursor: string | null = null) => ({
  ok: true,
  page: { items, nextCursor, rateLimit: { remaining: 4000, resetsAt: null } },
});

const open = (language: "en" | "ru" | "am" = "en", onClose = vi.fn()) => {
  renderInApp(<GithubImportModal open onClose={onClose} />, language);
  return onClose;
};

beforeEach(() => vi.resetAllMocks());

describe("pick", () => {
  it("lists repositories, all unselected, with name, description, language and stars", async () => {
    mocks.list.mockResolvedValue(page([repo(1), repo(2)]));
    open();
    const first = await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    expect(first).not.toBeChecked();
    expect(screen.getByText("Repo 1 description")).toBeVisible();
    expect(screen.getAllByText("Go").length).toBeGreaterThan(0);
    expect(screen.getByText("Stars: 1")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("an imported repository says so and cannot be selected", async () => {
    mocks.list.mockResolvedValue(
      page([repo(1, { imported: true, projectId: "0b6f2c1e-1111-4222-8333-444455556666" })]),
    );
    open();
    const box = await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    expect(box).toBeDisabled();
    expect(screen.getByText(/Imported/)).toBeVisible();
  });

  it("caps the selection at ten and says why", async () => {
    mocks.list.mockResolvedValue(page(Array.from({ length: 12 }, (_, i) => repo(i + 1))));
    open();
    for (let i = 1; i <= 10; i += 1) {
      fireEvent.click(await screen.findByRole("checkbox", { name: `ani-p/repo-${i}` }));
    }
    expect(screen.getByRole("checkbox", { name: "ani-p/repo-11" })).toBeDisabled();
    expect(screen.getByText(/up to 10 at a time/)).toBeVisible();
  });

  it("empty is its own state, and a failed load is an error with Retry, never 'empty'", async () => {
    mocks.list.mockResolvedValueOnce(page([]));
    open();
    expect(await screen.findByText("No public repositories")).toBeVisible();
  });

  it("a failed load shows the error and Retry, not 'No public repositories'", async () => {
    mocks.list.mockResolvedValueOnce({ ok: false, code: "GITHUB_UNAVAILABLE" });
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent("GitHub is not responding");
    expect(screen.queryByText("No public repositories")).toBeNull();
    mocks.list.mockResolvedValueOnce(page([repo(1)]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("checkbox", { name: "ani-p/repo-1" })).toBeInTheDocument();
  });

  it("not connected points to Integrations", async () => {
    mocks.list.mockResolvedValue({ ok: false, code: "GITHUB_NOT_CONNECTED" });
    open();
    expect(await screen.findByRole("link", { name: "Open Integrations" })).toHaveAttribute(
      "href",
      "/integrations",
    );
  });

  it("shows when the GitHub limit resets once it is nearly used", async () => {
    mocks.list.mockResolvedValue({
      ok: true,
      page: {
        items: [repo(1)],
        nextCursor: null,
        rateLimit: { remaining: 3, resetsAt: "2026-10-16T10:30:00Z" },
      },
    });
    open();
    expect(await screen.findByText(/GitHub allows 3 more requests until/)).toBeVisible();
  });

  it("searches after a pause, and the newest answer wins", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    mocks.list.mockResolvedValue(page([repo(2)]));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "repo-2" } });
    await waitFor(() =>
      expect(mocks.list).toHaveBeenLastCalledWith({ q: "repo-2", cursor: undefined }),
    );
    expect(await screen.findByRole("checkbox", { name: "ani-p/repo-2" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "ani-p/repo-1" })).toBeNull();
  });

  it("a slow older answer never replaces a newer one", async () => {
    mocks.list.mockResolvedValueOnce(page([repo(1)]));
    open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    let late!: (v: unknown) => void;
    mocks.list.mockReturnValueOnce(new Promise((resolve) => (late = resolve)));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "old" } });
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    mocks.list.mockResolvedValueOnce(page([repo(3)]));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "new" } });
    expect(await screen.findByRole("checkbox", { name: "ani-p/repo-3" })).toBeInTheDocument();
    await act(async () => late(page([repo(2)])));
    expect(screen.queryByRole("checkbox", { name: "ani-p/repo-2" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "ani-p/repo-3" })).toBeInTheDocument();
  });

  it("loads more with the cursor and keeps the earlier ones", async () => {
    mocks.list.mockResolvedValueOnce(page([repo(1)], "c2"));
    open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    mocks.list.mockResolvedValueOnce(page([repo(2)]));
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("checkbox", { name: "ani-p/repo-2" })).toBeInTheDocument();
    expect(mocks.list).toHaveBeenLastCalledWith({ q: undefined, cursor: "c2" });
    expect(screen.getByRole("checkbox", { name: "ani-p/repo-1" })).toBeInTheDocument();
  });

  it("Not now closes and imports nothing; Escape closes too", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    const onClose = open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("is translated", async () => {
    mocks.list.mockResolvedValue(page([]));
    open("ru");
    expect(await screen.findByText("Нет публичных репозиториев")).toBeVisible();
    expect(screen.getByRole("button", { name: "Не сейчас" })).toBeVisible();
  });
});

describe("review and save", () => {
  const toReview = async () => {
    mocks.list.mockResolvedValue(page([repo(1), repo(2)]));
    open();
    fireEvent.click(await screen.findByRole("checkbox", { name: "ani-p/repo-1" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "ani-p/repo-2" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "Review before saving" });
  };

  it("shows an editable draft per selected repository and lets one be removed", async () => {
    await toReview();
    expect(screen.getByDisplayValue("repo-1")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Do not import repo-2" }));
    expect(screen.queryByDisplayValue("repo-2")).toBeNull();
    expect(screen.getByRole("button", { name: "Save as drafts" })).toBeEnabled();
  });

  it("saves in one request with only the edited fields, then says drafts were created", async () => {
    await toReview();
    fireEvent.change(screen.getByDisplayValue("repo-1"), { target: { value: "My thesis" } });
    mocks.save.mockResolvedValue({
      ok: true,
      response: {
        results: [
          { repoId: 1, outcome: "created", reason: null, projectId: "p1", notes: [] },
          { repoId: 2, outcome: "skipped", reason: "not_owner", projectId: null, notes: [] },
        ],
        rateLimit: { remaining: 1, resetsAt: null },
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save as drafts" }));
    expect(await screen.findByText("Projects created as drafts: 1")).toBeVisible();
    expect(screen.getByText("Publish them from your projects page.")).toBeVisible();
    expect(screen.getByText("You neither own this repository nor can push to it.")).toBeVisible();
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(mocks.save).toHaveBeenCalledWith({
      repoIds: [1, 2],
      edits: { "1": { title: "My thesis" } },
    });
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Edit draft" })).toHaveAttribute(
      "href",
      "/projects/p1/edit",
    );
  });

  it("a double click on Save sends one request", async () => {
    await toReview();
    mocks.save.mockReturnValue(new Promise(() => {}));
    const button = screen.getByRole("button", { name: "Save as drafts" });
    act(() => {
      button.click();
      button.click();
    });
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it("an invalid draft cannot be saved", async () => {
    await toReview();
    fireEvent.change(screen.getByDisplayValue("repo-1"), { target: { value: "  " } });
    expect(screen.getByRole("button", { name: "Save as drafts" })).toBeDisabled();
  });

  it("a failed save stays on the review step with the error and keeps the edits", async () => {
    await toReview();
    fireEvent.change(screen.getByDisplayValue("repo-1"), { target: { value: "Keep me" } });
    mocks.save.mockResolvedValue({ ok: false, code: "GITHUB_RATE_LIMITED", retryAfter: 30 });
    fireEvent.click(screen.getByRole("button", { name: "Save as drafts" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("GitHub’s request limit is reached.");
    expect(alert).toHaveTextContent("Try again in 30 s.");
    expect(screen.getByDisplayValue("Keep me")).toBeVisible();
  });

  it("Back returns to the list with the selection kept", async () => {
    await toReview();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("checkbox", { name: "ani-p/repo-1" })).toBeChecked();
    expect(within(screen.getByRole("dialog")).getByText("Selected: 2 of 10")).toBeVisible();
  });
});
