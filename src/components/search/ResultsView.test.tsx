import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import type { DiscoveryProject, PersonSummary } from "@/lib/api/types";
import { ResultsView } from "./ResultsView";

const person = (over: Partial<PersonSummary> = {}): PersonSummary => ({
  id: "0b6f2c1e-1111-4222-8333-444455556666",
  name: "Ani Petrosyan",
  headline: "IoT engineer",
  avatarUrl: null,
  verified: true,
  location: "Yerevan",
  skills: ["IoT", "C#", "Go", "ML", "AI"],
  projectCount: 3,
  ...over,
});

const project = (over: Partial<DiscoveryProject> = {}): DiscoveryProject => ({
  id: "5c1d9a3e-aaaa-4bbb-8ccc-ddddeeeeffff",
  title: "Smart Garden IoT",
  summary: "Soil moisture with MQTT.",
  category: "course",
  status: "completed",
  heroImageUrl: null,
  technologies: ["Arduino", "IoT"],
  tags: [],
  owner: { id: "o1", name: "Ani Petrosyan", avatarUrl: null },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("ResultsView", () => {
  it("shows People and Projects with a link to each profile and project", () => {
    renderInApp(
      <ResultsView query="iot" people={{ items: [person()] }} projects={{ items: [project()] }} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ani Petrosyan/ })).toHaveAttribute(
      "href",
      "/profile/0b6f2c1e-1111-4222-8333-444455556666",
    );
    expect(screen.getByRole("link", { name: /Smart Garden/ })).toHaveAttribute(
      "href",
      "/projects/5c1d9a3e-aaaa-4bbb-8ccc-ddddeeeeffff",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Results: 2");
  });

  it("highlights the query in a name, without building a RegExp from user text unescaped", () => {
    renderInApp(
      <ResultsView
        query="c++ (x"
        people={{ items: [person({ name: "C++ (x guru", headline: "" })] }}
      />,
    );
    expect(document.querySelector("mark")?.textContent).toBe("C++ (x");
  });

  it("offers See all only when the group has more", () => {
    renderInApp(
      <ResultsView
        query="iot"
        people={{ items: [person()], seeAllHref: "/search?q=iot&type=people" }}
        projects={{ items: [project()] }}
      />,
    );
    expect(screen.getByRole("link", { name: "See all people" })).toHaveAttribute(
      "href",
      "/search?q=iot&type=people",
    );
    expect(screen.queryByRole("link", { name: "See all projects" })).toBeNull();
  });

  it("says which group is empty and still shows the other", () => {
    renderInApp(
      <ResultsView query="iot" people={{ items: [] }} projects={{ items: [project()] }} />,
    );
    expect(screen.getByText("No people match.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Smart Garden/ })).toBeInTheDocument();
  });

  it("shows nothing found with the query, escaped as text", () => {
    renderInApp(<ResultsView query="<b>x</b>" people={{ items: [] }} projects={{ items: [] }} />);
    expect(
      screen.getByRole("heading", { name: "Nothing found for “<b>x</b>”" }),
    ).toBeInTheDocument();
    expect(document.querySelector("b")).toBeNull();
  });

  it("pages with links: Next page and First page keep the filters in the URL", () => {
    renderInApp(
      <ResultsView
        query="iot"
        people={{ items: [person()] }}
        pager={{
          firstHref: "/search?q=iot&type=people",
          nextHref: "/search?q=iot&type=people&cursor=abc",
        }}
        backHref="/search?q=iot"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Next page" });
    expect(within(nav).getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/search?q=iot&type=people&cursor=abc",
    );
    expect(within(nav).getByRole("link", { name: "First page" })).toHaveAttribute(
      "href",
      "/search?q=iot&type=people",
    );
    expect(screen.getByRole("link", { name: "Back to all results" })).toHaveAttribute(
      "href",
      "/search?q=iot",
    );
  });

  it("is one link per card: skills and technologies are not links", () => {
    renderInApp(
      <ResultsView query="" people={{ items: [person()] }} projects={{ items: [project()] }} />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("renders in Russian and Armenian", () => {
    renderInApp(<ResultsView query="x" people={{ items: [] }} projects={{ items: [] }} />, "ru");
    expect(
      screen.getByRole("heading", { name: "По запросу «x» ничего не найдено" }),
    ).toBeInTheDocument();
  });
});
