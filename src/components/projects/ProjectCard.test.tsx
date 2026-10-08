import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import ProjectCard from "./ProjectCard";

describe("ProjectCard", () => {
  it("prints the date range in the UI language, in UTC", () => {
    renderInApp(
      <ProjectCard
        project={
          {
            id: "p1",
            title: "T",
            technologies: [],
            metadata: { startDate: "2025-12-31T23:30:00Z", category: "personal" },
          } as never
        }
      />,
      "ru",
    );
    expect(screen.getByText(/дек.*2025/)).toBeInTheDocument();
  });
});
