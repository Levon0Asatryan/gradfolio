import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/projects/actions", () => ({ setDraftStateAction: vi.fn() }));

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
