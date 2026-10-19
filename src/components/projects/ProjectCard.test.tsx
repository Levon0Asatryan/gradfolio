import { useState } from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { projectSummary } from "@/testing/fixtures";
import ProjectCard from "./ProjectCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
const setDraftMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/projects/actions", () => ({ setDraftStateAction: setDraftMock }));

describe("ProjectCard", () => {
  it("prints the date range in the UI language, in UTC", () => {
    renderInApp(
      <ProjectCard
        project={projectSummary({
          metadata: { startDate: "2025-12-31", endDate: null, course: null, professor: null },
        })}
      />,
      "ru",
    );
    expect(screen.getByText(/дек.*2025/)).toBeInTheDocument();
  });

  it("links to the project by its id and shows the summary and category", () => {
    renderInApp(<ProjectCard project={projectSummary()} />);
    expect(screen.getByRole("link", { name: /EcoRoute/ })).toHaveAttribute(
      "href",
      "/projects/5c1d9a3e-aaaa-4bbb-8ccc-ddddeeeeffff",
    );
    expect(screen.getByText("Routes with less CO2.")).toBeVisible();
    expect(screen.getByText("Hackathon")).toBeVisible();
  });

  it("marks a draft or private project for its owner", () => {
    const { unmount } = renderInApp(<ProjectCard project={projectSummary({ isDraft: true })} />);
    expect(screen.getByText("Draft")).toBeVisible();
    unmount();
    renderInApp(<ProjectCard project={projectSummary({ isPublic: false })} />);
    expect(screen.getByText("Private")).toBeVisible();
  });

  it("never loads a hero image that is not https", () => {
    renderInApp(<ProjectCard project={projectSummary({ heroImageUrl: "http://x.test/a.png" })} />);
    expect(document.querySelector("img")).toBeNull();
  });

  it("falls back to the first letter without a summary", () => {
    renderInApp(<ProjectCard project={projectSummary({ summary: null })} />);
    expect(screen.getByRole("article")).toBeVisible();
  });
});

describe("ProjectCard publish", () => {
  it("offers Publish outside the link to the owner of a draft, with the Draft chip", () => {
    renderInApp(<ProjectCard project={projectSummary({ isDraft: true, isOwner: true })} />);
    expect(screen.getByText("Draft")).toBeVisible();
    const publish = screen.getByRole("button", { name: "Publish" });
    expect(publish.closest("a")).toBeNull();
  });
  it("offers nothing to publish on a published project or a draft that is not the caller's", () => {
    renderInApp(<ProjectCard project={projectSummary({ isDraft: false })} />);
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
    renderInApp(<ProjectCard project={projectSummary({ isDraft: true, isOwner: false })} />);
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
  });
});

describe("ProjectCard after a quick publish", () => {
  /** What the feed does: the card is re-rendered as a published project. */
  function Feed() {
    const [draft, setDraft] = useState(true);
    return (
      <ProjectCard
        project={projectSummary({ isDraft: draft, isOwner: true })}
        onDraftChange={(isDraft) => setDraft(isDraft)}
      />
    );
  }

  it("the focus and the announcement outlive the button that is removed", async () => {
    setDraftMock.mockResolvedValue({ ok: true, isDraft: false, isPublic: true });
    renderInApp(<Feed />);
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publish" }));
    // The button and its dialog are gone; the card says what happened and holds the focus.
    await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Published.");
    await waitFor(() => expect(status).toHaveFocus());
    expect(status.isConnected).toBe(true);
    expect(screen.queryByText("Draft")).toBeNull();
  });
});
