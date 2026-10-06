import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import ProjectHeader from "./ProjectHeader";

describe("ProjectHeader", () => {
  it("shows the title, category and http(s) links", () => {
    renderInApp(
      <ProjectHeader
        title="EcoRoute"
        aiSummary="Routes."
        category="hackathon"
        repo={{ url: "https://github.com/x/y" }}
        liveDemoUrl="https://demo.example.com"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "EcoRoute" })).toBeVisible();
    expect(screen.getByText("Hackathon")).toBeVisible();
    expect(screen.getByRole("link", { name: "GitHub Repo" })).toHaveAttribute(
      "href",
      "https://github.com/x/y",
    );
  });

  it("never renders a javascript: or data: link", () => {
    renderInApp(
      <ProjectHeader
        title="EcoRoute"
        aiSummary="Routes."
        repo={{ url: "javascript:alert(1)" }}
        liveDemoUrl="data:text/html,x"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});
