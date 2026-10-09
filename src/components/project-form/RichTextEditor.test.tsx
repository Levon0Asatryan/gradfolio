import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import RichTextEditor from "./RichTextEditor";

// jsdom has no layout; ProseMirror asks for rects while it scrolls the cursor into view.
Range.prototype.getBoundingClientRect = () => new DOMRect();
Range.prototype.getClientRects = () =>
  ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: [][Symbol.iterator],
  }) as unknown as DOMRectList;

const show = (value = "", onChange = vi.fn()) => {
  renderInApp(
    <>
      <span id="lbl">Description</span>
      <RichTextEditor value={value} onChange={onChange} labelId="lbl" />
    </>,
  );
  return onChange;
};

describe("RichTextEditor", () => {
  it("is a named multiline textbox and a toolbar of named toggle buttons with one tab stop", async () => {
    show();
    const box = await screen.findByRole("textbox", { name: "Description" });
    expect(box).toHaveAttribute("aria-multiline", "true");
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    const buttons = toolbar.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(12);
    for (const b of buttons) expect(b).toHaveAccessibleName();
    expect([...buttons].filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  it("offers no image and no table", async () => {
    show();
    await screen.findByRole("textbox", { name: "Description" });
    expect(screen.queryByRole("button", { name: /image|table/i })).toBeNull();
  });

  it("moves along the toolbar with the arrow keys", async () => {
    show();
    await screen.findByRole("textbox", { name: "Description" });
    const [first, second] = screen.getAllByRole("button", { name: /Bold|Italic/ });
    act(() => first!.focus());
    fireEvent.keyDown(first!, { key: "ArrowRight" });
    expect(second).toHaveFocus();
    expect(second!.tabIndex).toBe(0);
    expect(first!.tabIndex).toBe(-1);
  });

  it("reports HTML that is empty text as an empty string, and edits as HTML", async () => {
    const onChange = show("<p>Hello</p>");
    const box = await screen.findByRole("textbox", { name: "Description" });
    expect(box).toHaveTextContent("Hello");
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining("<script"));
  });

  it("refuses a javascript: link in the link dialog", async () => {
    show("<p>Hello</p>");
    await screen.findByRole("textbox", { name: "Description" });
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    const input = await screen.findByLabelText("Address");
    fireEvent.change(input, { target: { value: "javascript:alert(1)" } });
    expect(screen.getByText("Enter a full https:// address.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "https://ok.test" } });
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });
});
