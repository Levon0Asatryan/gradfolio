import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import { BrowsePeopleList, BrowseProjectsList } from "./BrowseLists";
import { LandingSections } from "./LandingSections";
import { PeopleFilters } from "./PeopleFilters";
import { ProjectFilters } from "./ProjectFilters";

describe("ProjectFilters", () => {
  it("each filter is a link that keeps the others and drops the cursor", () => {
    renderInApp(<ProjectFilters query={{ category: "course", cursor: "abc" }} />);
    expect(screen.getByRole("link", { name: "Hackathon" })).toHaveAttribute(
      "href",
      "/browse/projects?category=hackathon",
    );
    expect(screen.getByRole("link", { name: "ongoing" })).toHaveAttribute(
      "href",
      "/browse/projects?category=course&status=ongoing",
    );
    expect(screen.getByRole("link", { name: "Recently updated" })).toHaveAttribute(
      "href",
      "/browse/projects?category=course&sort=updated",
    );
  });

  it("marks the chosen filter with aria-current, and All when none is chosen", () => {
    renderInApp(<ProjectFilters query={{ category: "course" }} />);
    const category = screen.getByRole("group", { name: "Category" });
    expect(within(category).getByRole("link", { name: "Course" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    const status = screen.getByRole("group", { name: "Status" });
    expect(within(status).getByRole("link", { name: "All" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});

describe("PeopleFilters", () => {
  const facets = {
    schools: [{ value: "NPUA", count: 3 }],
    majors: [{ value: "Informatics", count: 2 }],
    years: [{ value: 2026, count: 3 }],
  };

  it("is a GET form to /browse/people with a select per filter", () => {
    renderInApp(<PeopleFilters facets={facets} query={{}} />);
    const form = screen.getByRole("form", { name: "Filters" });
    expect(form).toHaveAttribute("action", "/browse/people");
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear filters" })).toBeNull();
  });

  it("offers Clear when a filter is set, and keeps a chosen value the facets no longer list", () => {
    renderInApp(<PeopleFilters facets={facets} query={{ school: "Old School", gradYear: 2026 }} />);
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/browse/people",
    );
    expect(screen.getByText("Old School")).toBeInTheDocument();
  });

  it("still renders when the facets could not be loaded", () => {
    renderInApp(<PeopleFilters facets={null} query={{}} />);
    expect(screen.getByRole("form", { name: "Filters" })).toBeInTheDocument();
  });
});

describe("browse lists", () => {
  it("an empty filtered list says so and offers a way out; the first page link keeps it findable", () => {
    renderInApp(<BrowseProjectsList items={[]} pager={{}} />);
    expect(screen.getByText("No projects match these filters.")).toBeInTheDocument();
  });

  it("an empty page after the first still has First page (a stale cursor)", () => {
    renderInApp(<BrowsePeopleList items={[]} pager={{ firstHref: "/browse/people" }} />);
    expect(screen.getByRole("link", { name: "First page" })).toHaveAttribute(
      "href",
      "/browse/people",
    );
  });
});

describe("LandingSections", () => {
  it("shows a section that failed as an error and the others as normal", () => {
    renderInApp(
      <LandingSections
        cloud={{ items: [{ name: "ML", projects: 1, people: 1 }] }}
        projects={{ failed: true }}
        people={{ items: [] }}
      />,
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByText("This section could not be loaded.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^ML:/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse all people" })).toHaveAttribute(
      "href",
      "/browse/people",
    );
    expect(screen.getByRole("link", { name: "Browse all projects" })).toHaveAttribute(
      "href",
      "/browse/projects",
    );
  });

  it("a failed tag cloud is an error line, not an empty cloud, and the lists still show", () => {
    renderInApp(
      <LandingSections cloud={{ failed: true }} projects={{ items: [] }} people={{ items: [] }} />,
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.queryByText("No tags yet.")).toBeNull();
    expect(screen.getByText("No projects match these filters.")).toBeInTheDocument();
  });
});
