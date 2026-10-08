import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import ProjectMetadataCard from "./ProjectMetadataCard";

describe("ProjectMetadataCard", () => {
  it("prints the timeline in the UI language, not the machine's", () => {
    renderInApp(
      <ProjectMetadataCard metadata={{ startDate: "2025-12-06T00:00:00Z" } as never} />,
      "ru",
    );
    expect(screen.getByText(/6.*дек.*2025/)).toBeInTheDocument();
    expect(screen.queryByText(/N\/A/)).not.toBeInTheDocument();
  });
});
