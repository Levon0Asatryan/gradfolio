import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HighlightedText from "./HighlightedText";

const marked = (container: HTMLElement) =>
  [...container.querySelectorAll("mark")].map((m) => m.textContent);

describe("HighlightedText", () => {
  it("marks every case-insensitive match and keeps the rest as text", () => {
    const { container } = render(<HighlightedText text="React and react.js" query="react" />);
    expect(marked(container)).toEqual(["React", "react"]);
    expect(container).toHaveTextContent("React and react.js");
  });

  it("renders the text unmarked without a query", () => {
    const { container } = render(<HighlightedText text="TypeScript" />);
    expect(marked(container)).toEqual([]);
    expect(container).toHaveTextContent("TypeScript");
  });

  // F7: the search box passes whatever the user types, so a query is text, not
  // a pattern. `C++` used to throw "Nothing to repeat" during render.
  it.each([
    ["C++ and C", "C++", ["C++"]],
    ["f(x) = y", "(x)", ["(x)"]],
    ["a[0] or a0", "[0]", ["[0]"]],
    ["a.b and axb", "a.b", ["a.b"]],
    ["cost $5", "$5", ["$5"]],
    ["path\\to", "\\", ["\\"]],
  ])("treats regex syntax in the query literally: %j / %j", (text, query, expected) => {
    const { container } = render(<HighlightedText text={text} query={query} />);
    expect(marked(container)).toEqual(expected);
  });
});
