import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import ProjectsContent from "./ProjectsContent";

const cards = () => screen.queryAllByRole("article");

describe("/projects", () => {
  it("shows the user's projects with a header and one primary action", () => {
    renderInApp(<ProjectsContent />);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
    expect(screen.getByRole("link", { name: "New Project" })).toHaveAttribute(
      "href",
      "/projects/new",
    );
    expect(cards().length).toBeGreaterThan(0);
  });

  it("filters by a category chip and marks the chip pressed", () => {
    renderInApp(<ProjectsContent />);
    const all = cards().length;
    const chip = screen.getByRole("button", { name: "Research" });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    expect(cards()).toHaveLength(1);
    expect(cards().length).toBeLessThan(all);
  });

  it("offers the Academic category, which projects use", () => {
    renderInApp(<ProjectsContent />);
    expect(screen.getByRole("button", { name: "Academic" })).toBeVisible();
  });

  it("says 'no match', not 'no projects yet', when a search finds nothing, and clears it", () => {
    renderInApp(<ProjectsContent />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search projects…" }), {
      target: { value: "zzzzqq" },
    });
    expect(screen.getByText("No projects match your search.")).toBeVisible();
    expect(screen.queryByText("No projects yet")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(cards().length).toBeGreaterThan(0);
  });

  it("labels category chips in Russian", () => {
    renderInApp(<ProjectsContent />, "ru");
    expect(screen.getByRole("button", { name: "Хакатон" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Проекты" })).toBeVisible();
  });
});
