import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
const setDraftMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/projects/actions", () => ({ setDraftStateAction: setDraftMock }));

const { OwnerBar } = await import("./OwnerBar");

const show = (isDraft: boolean, isPublic = true) =>
  renderInApp(<OwnerBar projectId="p1" title="Thesis" isDraft={isDraft} isPublic={isPublic} />);

describe("OwnerBar", () => {
  it("a draft: the Draft chip with its icon and word, and Publish", () => {
    show(true);
    expect(screen.getByText("Draft")).toBeVisible();
    expect(screen.getByRole("button", { name: "Publish" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Move back to drafts" })).toBeNull();
    expect(screen.getByRole("link", { name: "Edit project" })).toBeVisible();
  });
  it("a published project: Move back to drafts, no Draft chip", () => {
    show(false);
    expect(screen.queryByText("Draft")).toBeNull();
    expect(screen.getByRole("button", { name: "Move back to drafts" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
  });
  it("a published private project says Private", () => {
    show(false, false);
    expect(screen.getByText("Private")).toBeVisible();
  });
});

describe("OwnerBar after a quick publish", () => {
  it("says it in a status line that holds the focus, as the Publish button is replaced", async () => {
    setDraftMock.mockResolvedValue({ ok: true, isDraft: false, isPublic: true });
    // The page re-renders the bar as published once the server data arrives; here the bar
    // itself keeps its draft props, which is the harder case: the status must not depend on it.
    show(true);
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publish" }));
    const status = await screen.findByText("Published.");
    expect(status).toHaveAttribute("role", "status");
    await waitFor(() => expect(status).toHaveFocus());
  });
});
