import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  start: vi.fn(),
  disconnect: vi.fn(),
  assign: vi.fn(),
  query: "",
}));
vi.mock("@/lib/projects/actions", () => ({ setDraftStateAction: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.query),
}));
vi.mock("@/lib/integrations/importActions", () => ({
  listGithubReposAction: vi.fn(),
  importGithubReposAction: vi.fn(),
  previewGithubImportAction: vi.fn(),
}));
vi.mock("@/lib/integrations/suggestionActions", () => ({
  loadProfileSuggestionsAction: vi.fn(),
  acceptSuggestionsAction: vi.fn(),
  dismissSuggestionAction: vi.fn(),
}));
vi.mock("@/lib/integrations/actions", () => ({
  startGithubConnectAction: mocks.start,
  disconnectGithubAction: mocks.disconnect,
}));

const { GithubCard } = await import("./GithubCard");

const off = { available: true, status: "not_connected", login: null, lastSyncedAt: null } as const;
const on = {
  available: true,
  status: "connected",
  login: "ani-p",
  lastSyncedAt: "2026-10-09T12:00:00Z",
} as const;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.query = "";
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, assign: mocks.assign },
  });
});

describe("connect", () => {
  it("follows the authorize URL the server built", async () => {
    mocks.start.mockResolvedValue({
      ok: true,
      state: "redirect",
      url: "https://tenant.auth0.com/authorize?connection=github",
    });
    renderInApp(<GithubCard github={off} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() =>
      expect(mocks.assign).toHaveBeenCalledWith(
        "https://tenant.auth0.com/authorize?connection=github",
      ),
    );
  });

  it("never follows a URL that is not https", async () => {
    mocks.start.mockResolvedValue({ ok: true, state: "redirect", url: "javascript:alert(1)" });
    renderInApp(<GithubCard github={off} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("refreshes when GitHub was already connected through sign-in", async () => {
    mocks.start.mockResolvedValue({ ok: true, state: "connected", login: "ani-p" });
    renderInApp(<GithubCard github={off} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(await screen.findByText("GitHub is connected.")).toBeVisible();
  });

  it("starts only once for a double click", async () => {
    mocks.start.mockReturnValue(new Promise(() => {}));
    renderInApp(<GithubCard github={off} />);
    const button = screen.getByRole("button", { name: "Connect" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });

  it("is disabled, with the reason, when the server has no GitHub connection", () => {
    renderInApp(<GithubCard github={{ ...off, available: false }} />);
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
    expect(screen.getByText(/not set up on this server/)).toBeVisible();
  });

  it("says a change is still finishing, with the wait the API gave", async () => {
    mocks.start.mockResolvedValue({ ok: false, code: "GITHUB_RATE_LIMITED", retryAfter: 42 });
    renderInApp(<GithubCard github={off} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("GitHub’s request limit is reached.");
    expect(alert).toHaveTextContent("Try again in 42 s.");
  });

  it("answers GITHUB_LINK_IN_PROGRESS honestly, in Russian too", async () => {
    mocks.start.mockResolvedValue({ ok: false, code: "GITHUB_LINK_IN_PROGRESS" });
    renderInApp(<GithubCard github={off} />, "ru");
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Изменение подключения GitHub ещё завершается",
    );
  });
});

describe("disconnect", () => {
  const open = () => {
    renderInApp(<GithubCard github={on} />);
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    return screen.getByRole("dialog", { name: "Disconnect GitHub?" });
  };

  it("shows the account and asks before anything is sent; Cancel changes nothing", async () => {
    const dialog = open();
    expect(screen.getByText("Connected as ani-p")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });

  it("names what it does: revoke first, projects stay, verified falls back", () => {
    const dialog = open();
    expect(dialog).toHaveTextContent(/asks GitHub to remove its access first/);
    expect(dialog).toHaveTextContent(/Projects you imported stay/);
    expect(dialog).toHaveTextContent(/verified badge falls back/);
  });

  it("success: toast and a refresh of the status", async () => {
    mocks.disconnect.mockResolvedValue({ ok: true });
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: "Disconnect" }));
    expect(await screen.findByText("GitHub is disconnected.")).toBeVisible();
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("an unconfirmed revocation is never reported as 'nothing changed'", async () => {
    mocks.disconnect.mockResolvedValue({ ok: false, code: "GITHUB_REVOKE_FAILED" });
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: "Disconnect" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/may or may not have been removed/);
    expect(alert).not.toHaveTextContent(/nothing (was )?changed/i);
    // The card is refreshed at once: it may already read "not connected".
    expect(mocks.refresh).toHaveBeenCalled();
    expect(within(alert).getByRole("button", { name: "Check status" })).toBeVisible();
  });

  it("a retry during the settling window is told to try again shortly", async () => {
    mocks.disconnect.mockResolvedValue({ ok: false, code: "GITHUB_LINK_IN_PROGRESS" });
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("button", { name: "Disconnect" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /still finishing.*try again shortly/,
    );
  });

  it("sends once for a double click", async () => {
    mocks.disconnect.mockReturnValue(new Promise(() => {}));
    const dialog = open();
    const button = within(dialog).getByRole("button", { name: "Disconnect" });
    act(() => {
      button.click();
      button.click();
    });
    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
  });
});

describe("the import dialog right after connecting", () => {
  const list = async () => (await import("@/lib/integrations/importActions")).listGithubReposAction;
  beforeEach(async () => {
    vi.mocked(await list()).mockResolvedValue({
      ok: true,
      page: { items: [], nextCursor: null, rateLimit: { remaining: null, resetsAt: null } },
    });
  });

  it("opens when the callback's hint arrives and the API says GitHub is connected", async () => {
    mocks.query = "github=connected&import=1";
    renderInApp(<GithubCard github={on} />);
    expect(await screen.findByRole("dialog")).toBeVisible();
  });

  it("opens nothing for a forged hint when the API says not connected", async () => {
    mocks.query = "github=connected&import=1";
    renderInApp(<GithubCard github={off} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await list()).not.toHaveBeenCalled();
  });

  it("opens nothing without the hint, and imports nothing when closed with Not now", async () => {
    renderInApp(<GithubCard github={on} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    cleanup();
    mocks.query = "import=1";
    renderInApp(<GithubCard github={on} />);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Not now" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    const actions = await import("@/lib/integrations/importActions");
    expect(actions.importGithubReposAction).not.toHaveBeenCalled();
  });

  it("returns focus to the Import button when the dialog closes", async () => {
    mocks.query = "import=1";
    renderInApp(<GithubCard github={on} />);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Not now" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Import from GitHub" })).toHaveFocus(),
    );
  });
});
