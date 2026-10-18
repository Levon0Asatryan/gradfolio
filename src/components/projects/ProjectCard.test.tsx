import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { projectSummary } from "@/testing/fixtures";
import ProjectCard from "./ProjectCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/projects/actions", () => ({ setDraftStateAction: vi.fn() }));

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
