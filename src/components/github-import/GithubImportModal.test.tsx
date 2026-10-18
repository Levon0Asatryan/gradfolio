import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { renderInApp } from "@/testing/render";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  preview: vi.fn(),
  refresh: vi.fn(),
  suggestions: vi.fn(),
  accept: vi.fn(),
  dismiss: vi.fn(),
  setDraft: vi.fn(),
}));
vi.mock("@/lib/projects/actions", () => ({ setDraftStateAction: mocks.setDraft }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/integrations/importActions", () => ({
  listGithubReposAction: mocks.list,
  importGithubReposAction: mocks.save,
  previewGithubImportAction: mocks.preview,
}));

vi.mock("@/lib/integrations/suggestionActions", () => ({
  loadProfileSuggestionsAction: mocks.suggestions,
  acceptSuggestionsAction: mocks.accept,
  dismissSuggestionAction: mocks.dismiss,
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

const draft = (id: number) => ({
  title: `repo-${id}`,
  summary: `Summary ${id}`,
  descriptionHtml: `<p>README of <b>repo ${id}</b></p><img src=x onerror=alert(1)>`,
  technologies: ["Go"],
  links: [],
  repoUrl: `https://github.com/ani-p/repo-${id}`,
  isPublic: true,
});
const previewOf = (ids: number[], over: Record<number, Record<string, unknown>> = {}) => ({
  ok: true,
  response: {
    results: ids.map((id) => ({
      repoId: id,
      outcome: "draft",
      reason: null,
      projectId: null,
      draft: draft(id),
      notes: [],
      ...(over[id] ?? {}),
    })),
    rateLimit: { remaining: 100, resetsAt: null },
  },
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
    mocks.preview.mockResolvedValue(previewOf([1, 2]));
    mocks.list.mockResolvedValue(page([repo(1), repo(2)]));
    open();
    fireEvent.click(await screen.findByRole("checkbox", { name: "ani-p/repo-1" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "ani-p/repo-2" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "Review before saving" });
  };

  it("shows the README-derived draft from the preview as text, never as markup", async () => {
    await toReview();
    expect(mocks.preview).toHaveBeenCalledWith({ repoIds: [1, 2] });
    expect(screen.getAllByText(/README of repo 1/).length).toBeGreaterThan(0);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getAllByText("https://github.com/ani-p/repo-1").length).toBeGreaterThan(0);
  });

  it("a repository the preview skips or already has is shown, and is not saved", async () => {
    mocks.list.mockResolvedValue(page([repo(1), repo(2), repo(3)]));
    mocks.preview.mockResolvedValue(
      previewOf([1, 2, 3], {
        2: { outcome: "skipped", reason: "not_owner", draft: null },
        3: { outcome: "exists", projectId: "p3", draft: null },
      }),
    );
    open();
    for (const i of [1, 2, 3]) {
      fireEvent.click(await screen.findByRole("checkbox", { name: `ani-p/repo-${i}` }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByText("You neither own this repository nor can push to it."),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Open project" })).toHaveAttribute(
      "href",
      "/projects/p3",
    );
    mocks.save.mockResolvedValue({ ok: true, response: { results: [], rateLimit: {} } });
    fireEvent.click(screen.getByRole("button", { name: "Save as drafts" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ repoIds: [1], overrides: {} }));
  });

  it("a failed preview is an error with Retry, and nothing can be saved meanwhile", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    mocks.preview.mockResolvedValueOnce({ ok: false, code: "GITHUB_UNAVAILABLE" });
    open();
    fireEvent.click(await screen.findByRole("checkbox", { name: "ani-p/repo-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("GitHub is not responding");
    expect(screen.getByRole("button", { name: "Save as drafts" })).toBeDisabled();
    mocks.preview.mockResolvedValueOnce(previewOf([1]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByDisplayValue("repo-1")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save as drafts" })).toBeEnabled();
  });

  it("coming back and failing to preview again leaves nothing saveable from the old preview", async () => {
    await toReview();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    mocks.preview.mockResolvedValueOnce({ ok: false, code: "GITHUB_UNAVAILABLE" });
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("GitHub is not responding");
    expect(screen.getByRole("button", { name: "Save as drafts" })).toBeDisabled();
  });

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
      overrides: { "1": { title: "My thesis" } },
    });
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Edit draft" })).toHaveAttribute(
      "href",
      "/projects/p1/edit",
    );
  });

  it("the result offers Publish now per created project, and says so once it is published", async () => {
    await toReview();
    mocks.save.mockResolvedValue({
      ok: true,
      response: {
        results: [
          { repoId: 1, outcome: "created", reason: null, projectId: "p1", notes: [] },
          { repoId: 2, outcome: "exists", reason: null, projectId: "p2", notes: [] },
        ],
        rateLimit: { remaining: 1, resetsAt: null },
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save as drafts" }));
    await screen.findByText("Projects created as drafts: 1");
    // Only the created one: an existing project is not ours to publish from here.
    expect(screen.getAllByRole("button", { name: "Publish now" })).toHaveLength(1);
    mocks.setDraft.mockResolvedValue({ ok: true, isDraft: false, isPublic: true });
    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: /Publish/ })).getByRole("button", {
        name: "Publish",
      }),
    );
    await waitFor(() => expect(mocks.setDraft).toHaveBeenCalledWith({ id: "p1", draft: false }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Publish now" })).toBeNull());
    // The button that had the focus is gone: the focus is on the row's status line, not lost.
    await waitFor(() => {
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Published.");
      expect(status).toHaveFocus();
    });
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

const item = (
  id: string,
  kind: string,
  current: string | null,
  proposed: string,
  mode: "fill" | "replace",
) => ({
  id,
  kind,
  source: "github",
  status: "open",
  field: kind.replace("profile.", ""),
  current,
  proposed,
  mode,
  lastSyncedAt: null,
  createdAt: "2026-10-16T10:00:00Z",
  resolvedAt: null,
});
const A = "0b6f2c1e-1111-4222-8333-444455556661";
const B = "0b6f2c1e-1111-4222-8333-444455556662";

describe("profile data tab", () => {
  const withProfile = async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    mocks.suggestions.mockResolvedValue({
      ok: true,
      items: [
        item(A, "profile.bio", null, "I build things", "fill"),
        item(B, "profile.location", "Yerevan", "Gyumri", "replace"),
      ],
      refresh: null,
      refreshError: null,
    });
    open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    fireEvent.click(screen.getByRole("tab", { name: "Profile data" }));
    await screen.findByText("I build things");
  };

  it("is read only when its tab is opened, not when the dialog opens", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    expect(mocks.suggestions).not.toHaveBeenCalled();
  });

  it("shows now beside GitHub's value; an empty field is pre-ticked, a replacement is not", async () => {
    await withProfile();
    expect(screen.getByRole("checkbox", { name: "Bio" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Location" })).not.toBeChecked();
    expect(screen.getByText("Yerevan")).toBeVisible();
    expect(screen.getByText("Gyumri")).toBeVisible();
    expect(screen.getByText("(empty)")).toBeVisible();
  });

  it("nothing is written until Save: ticked fields are accepted, the others left alone", async () => {
    await withProfile();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Profile fields to update")).toBeVisible();
    expect(mocks.accept).not.toHaveBeenCalled();
    mocks.accept.mockResolvedValue({ ok: true, results: [{ id: A, ok: true }] });
    fireEvent.click(screen.getByRole("button", { name: "Save as drafts" }));
    expect(await screen.findByText("Profile fields updated: 1")).toBeVisible();
    expect(mocks.accept).toHaveBeenCalledWith({ ids: [A] });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("repositories are saved first; if that fails the profile is not touched", async () => {
    await withProfile();
    fireEvent.click(screen.getByRole("tab", { name: "Repositories" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "ani-p/repo-1" }));
    mocks.preview.mockResolvedValue(previewOf([1]));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByDisplayValue("repo-1");
    mocks.save.mockResolvedValue({ ok: false, code: "GITHUB_UNAVAILABLE" });
    fireEvent.click(screen.getByRole("button", { name: "Save as drafts" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("GitHub is not responding");
    expect(mocks.accept).not.toHaveBeenCalled();
  });

  it("an answer for an earlier opening of the dialog is ignored", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    let late!: (v: unknown) => void;
    mocks.suggestions.mockReturnValueOnce(new Promise((resolve) => (late = resolve)));
    const { rerender } = renderInApp(<GithubImportModal open onClose={vi.fn()} />);
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    fireEvent.click(screen.getByRole("tab", { name: "Profile data" }));
    await waitFor(() => expect(mocks.suggestions).toHaveBeenCalledTimes(1));
    // Close and reopen while the read is in flight.
    rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider initialLanguage="en">
          <GithubImportModal open={false} onClose={vi.fn()} />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider initialLanguage="en">
          <GithubImportModal open onClose={vi.fn()} />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    await act(async () =>
      late({
        ok: true,
        items: [item(A, "profile.bio", null, "Stale bio", "fill")],
        refresh: null,
        refreshError: null,
      }),
    );
    // The fresh opening is untouched: still on Repositories, nothing pre-ticked, Continue off.
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByText("Stale bio")).toBeNull();
  });

  it("profile fields can be saved when every selected repository is already imported or skipped", async () => {
    mocks.list.mockResolvedValue(page([repo(1), repo(2)]));
    mocks.suggestions.mockResolvedValue({
      ok: true,
      items: [item(A, "profile.bio", null, "I build things", "fill")],
      refresh: null,
      refreshError: null,
    });
    mocks.preview.mockResolvedValue(
      previewOf([1, 2], {
        1: { outcome: "exists", projectId: "p1", draft: null },
        2: { outcome: "skipped", reason: "not_owner", draft: null },
      }),
    );
    open();
    fireEvent.click(await screen.findByRole("checkbox", { name: "ani-p/repo-1" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "ani-p/repo-2" }));
    fireEvent.click(screen.getByRole("tab", { name: "Profile data" }));
    await screen.findByText("I build things");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByText("You neither own this repository nor can push to it.");
    const save = screen.getByRole("button", { name: "Save as drafts" });
    expect(save).toBeEnabled();
    mocks.accept.mockResolvedValue({ ok: true, results: [{ id: A, ok: true }] });
    fireEvent.click(save);
    expect(await screen.findByText("Profile fields updated: 1")).toBeVisible();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("with nothing to import and no profile field ticked, Save stays off", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    mocks.preview.mockResolvedValue(
      previewOf([1], { 1: { outcome: "exists", projectId: "p1", draft: null } }),
    );
    open();
    fireEvent.click(await screen.findByRole("checkbox", { name: "ani-p/repo-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByText("Imported", { exact: false });
    expect(screen.getByRole("button", { name: "Save as drafts" })).toBeDisabled();
  });

  it("a field that fails to update is reported, not hidden", async () => {
    await withProfile();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByText("Profile fields to update");
    mocks.accept.mockResolvedValue({
      ok: true,
      results: [{ id: A, ok: false, code: "SUGGESTION_INVALID" }],
    });
    fireEvent.click(screen.getByRole("button", { name: "Save as drafts" }));
    expect(await screen.findByText("Profile fields not updated: 1")).toBeVisible();
  });

  it("dismissing removes the row and asks the API to remember it", async () => {
    await withProfile();
    mocks.dismiss.mockResolvedValue({ ok: true });
    fireEvent.click(screen.getAllByRole("button", { name: "Do not suggest this again" })[0]!);
    await waitFor(() => expect(screen.queryByText("I build things")).toBeNull());
    expect(mocks.dismiss).toHaveBeenCalledWith({ id: A });
  });

  it("nothing from GitHub is its own state; a failed read is an error with Retry", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    mocks.suggestions.mockResolvedValueOnce({ ok: false, code: "GITHUB_NOT_LINKED" });
    open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    fireEvent.click(screen.getByRole("tab", { name: "Profile data" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "no longer accepts the saved sign-in",
    );
    expect(screen.queryByText("Nothing new from your GitHub profile.")).toBeNull();
    mocks.suggestions.mockResolvedValueOnce({
      ok: true,
      items: [],
      refresh: null,
      refreshError: null,
    });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Nothing new from your GitHub profile.")).toBeVisible();
  });

  it("a refresh that failed is shown beside the stored suggestions", async () => {
    mocks.list.mockResolvedValue(page([repo(1)]));
    mocks.suggestions.mockResolvedValue({
      ok: true,
      items: [item(A, "profile.bio", null, "Hi", "fill")],
      refresh: null,
      refreshError: "GITHUB_RATE_LIMITED",
    });
    open();
    await screen.findByRole("checkbox", { name: "ani-p/repo-1" });
    fireEvent.click(screen.getByRole("tab", { name: "Profile data" }));
    expect(await screen.findByText("GitHub’s request limit is reached.")).toBeVisible();
    expect(screen.getByText("Hi")).toBeVisible();
  });
});
