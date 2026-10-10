import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import TagLink from "./TagLink";

describe("TagLink", () => {
  it.each([
    ["ML", "/tags/ML"],
    ["C#", "/tags/C%23"],
    ["CI/CD", "/tags/CI%2FCD"],
    ["Արմեն", `/tags/${encodeURIComponent("Արմեն")}`],
  ])("%s leads to its tag page", (name, href) => {
    renderInApp(<TagLink name={name} />);
    expect(
      screen.getByRole("link", { name: new RegExp(`Tag ${name.replace(/[+#/]/g, ".")}`) }),
    ).toHaveAttribute("href", href);
  });

  it("is named in the reader's language", () => {
    renderInApp(<TagLink name="IoT" />, "ru");
    expect(
      screen.getByRole("link", { name: "Тег IoT: показать проекты и людей" }),
    ).toBeInTheDocument();
  });
});
