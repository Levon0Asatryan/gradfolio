import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

const mocks = vi.hoisted(() => ({ sync: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/integrations/importActions", () => ({ syncProjectAction: mocks.sync }));

const { ResyncCard } = await import("./ResyncCard");

const ID = "0b6f2c1e-1111-4222-8333-444455556666";
const result = (over: Record<string, unknown> = {}) => ({
  ok: true,
  result: {
    dryRun: true,
    fields: [
      { field: "title", outcome: "unchanged" },
      { field: "summary", outcome: "updated" },
      { field: "technologies", outcome: "kept" },
      { field: "descriptionHtml", outcome: "conflict", githubValue: "<b>Their README</b>" },
    ],
    systemUpdated: [{ field: "stars", value: 12 }],
    ...over,
  },
});

beforeEach(() => vi.resetAllMocks());

describe("ResyncCard", () => {
  it("checks first with a dry run, then shows each field's outcome", async () => {
    mocks.sync.mockResolvedValue(result());
    renderInApp(<ResyncCard projectId={ID} repoUrl="https://github.com/ani-p/x" />);
    fireEvent.click(screen.getByRole("button", { name: "Check GitHub for changes" }));
    expect(await screen.findByText("Same as GitHub")).toBeVisible();
    expect(mocks.sync).toHaveBeenCalledWith({ projectId: ID, dryRun: true });
    expect(screen.getByText("Updated from GitHub")).toBeVisible();
    expect(screen.getByText("Kept: you edited it")).toBeVisible();
    expect(screen.getByText("Conflict: your version was kept")).toBeVisible();
    expect(screen.getByText("Stars: 12")).toBeVisible();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("GitHub's value in a conflict is shown as text, never as HTML", async () => {
    mocks.sync.mockResolvedValue(result());
    renderInApp(<ResyncCard projectId={ID} repoUrl={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Check GitHub for changes" }));
    expect(await screen.findByText("<b>Their README</b>")).toBeVisible();
    expect(document.querySelector("b")).toBeNull();
  });

  it("applying is a second, explicit call, and refreshes the page", async () => {
    mocks.sync.mockResolvedValueOnce(result());
    renderInApp(<ResyncCard projectId={ID} repoUrl={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Check GitHub for changes" }));
    await screen.findByText("Same as GitHub");
    mocks.sync.mockResolvedValueOnce(result({ dryRun: false }));
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(await screen.findByText("Synced with GitHub.")).toBeVisible();
    expect(mocks.sync).toHaveBeenLastCalledWith({ projectId: ID, dryRun: false });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("offers no Apply when nothing would change, and says so", async () => {
    mocks.sync.mockResolvedValue(
      result({ fields: [{ field: "title", outcome: "unchanged" }], systemUpdated: [] }),
    );
    renderInApp(<ResyncCard projectId={ID} repoUrl={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Check GitHub for changes" }));
    expect(await screen.findByText("Everything already matches GitHub.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Apply changes" })).toBeNull();
  });

  it("a repository that is gone is an error, not a quiet success", async () => {
    mocks.sync.mockResolvedValue({ ok: false, code: "GITHUB_REPO_UNAVAILABLE" });
    renderInApp(<ResyncCard projectId={ID} repoUrl={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Check GitHub for changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("gone or no longer visible");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a double click checks once", async () => {
    mocks.sync.mockReturnValue(new Promise(() => {}));
    renderInApp(<ResyncCard projectId={ID} repoUrl={null} />);
    const b = screen.getByRole("button", { name: "Check GitHub for changes" });
    act(() => {
      b.click();
      b.click();
    });
    await waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(1));
  });

  it("is translated", async () => {
    mocks.sync.mockResolvedValue(result());
    renderInApp(<ResyncCard projectId={ID} repoUrl={null} />, "ru");
    fireEvent.click(screen.getByRole("button", { name: "Проверить изменения на GitHub" }));
    expect(await screen.findByText("Совпадает с GitHub")).toBeVisible();
  });
});
