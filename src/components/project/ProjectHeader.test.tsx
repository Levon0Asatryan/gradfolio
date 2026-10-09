import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import { projectDetail } from "@/testing/fixtures";
import ProjectHeader from "./ProjectHeader";

const repo = (url: string | null) => ({ ...projectDetail().repo, url });

describe("ProjectHeader", () => {
  it("shows the title, category and http(s) links", () => {
    renderInApp(
      <ProjectHeader
        title="EcoRoute"
        summary="Routes."
        category="hackathon"
        heroImageUrl={null}
        repo={repo("https://github.com/x/y")}
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
        summary="Routes."
        heroImageUrl={null}
        repo={repo("javascript:alert(1)")}
        liveDemoUrl="data:text/html,x"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("does not load a hero image over http", () => {
    renderInApp(
      <ProjectHeader
        title="T"
        summary={null}
        heroImageUrl="http://x.test/a.png"
        repo={repo(null)}
        liveDemoUrl={null}
      />,
    );
    expect(document.querySelector("img")).toBeNull();
  });
});
