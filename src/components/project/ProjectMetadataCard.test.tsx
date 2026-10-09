import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import { projectDetail } from "@/testing/fixtures";
import ProjectMetadataCard from "./ProjectMetadataCard";

const meta = (over = {}) => ({ ...projectDetail().metadata, ...over });

describe("ProjectMetadataCard", () => {
  it("prints the timeline in the UI language, not the machine's", () => {
    renderInApp(
      <ProjectMetadataCard metadata={meta({ startDate: "2025-12-06" })} category="course" />,
      "ru",
    );
    expect(screen.getByText(/6.*дек.*2025/)).toBeInTheDocument();
    expect(screen.queryByText(/N\/A/)).not.toBeInTheDocument();
  });

  it("shows the top-level category with the course and professor", () => {
    renderInApp(
      <ProjectMetadataCard
        metadata={meta({ course: "Databases", professor: "Dr. Ghazaryan" })}
        category="research"
      />,
    );
    expect(screen.getByText("Research")).toBeVisible();
    expect(screen.getByText("Databases")).toBeVisible();
    expect(screen.getByText("Dr. Ghazaryan")).toBeVisible();
  });
});
