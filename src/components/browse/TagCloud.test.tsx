import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import { TagCloud, sizeStep } from "./TagCloud";

describe("sizeStep", () => {
  it("is three steps from the share of the biggest", () => {
    expect(sizeStep(10, 10)).toBe(2);
    expect(sizeStep(5, 10)).toBe(1);
    expect(sizeStep(1, 10)).toBe(0);
    expect(sizeStep(0, 0)).toBe(0);
  });
});

describe("TagCloud", () => {
  const items = [
    { name: "ML", projects: 5, people: 7 },
    { name: "C#", projects: 3, people: 4 },
    { name: "IoT", projects: 14, people: 9 },
  ];

  it("is a list of links to the tag pages, alphabetical, with the counts in the name", () => {
    renderInApp(<TagCloud items={items} />);
    const list = screen.getByRole("list", { name: "Popular tags" });
    const links = within(list).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["C#", "IoT", "ML"]);
    expect(links[0]).toHaveAttribute("href", "/tags/C%23");
    expect(links[1]).toHaveAccessibleName("IoT: 14 projects, 9 people");
  });

  it("says so when there are no tags", () => {
    renderInApp(<TagCloud items={[]} />);
    expect(screen.getByText("No tags yet.")).toBeInTheDocument();
  });

  it("renders in Armenian", () => {
    renderInApp(<TagCloud items={items} />, "am");
    expect(screen.getByRole("list", { name: "Հանրաճանաչ պիտակներ" })).toBeInTheDocument();
  });
});
