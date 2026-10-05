/* eslint-disable @next/next/no-html-link-for-pages -- the hook guards plain anchors, which is what Link renders */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUnsavedGuard } from "./useUnsavedGuard";

function Page({ dirty }: { dirty: boolean }) {
  useUnsavedGuard(dirty, "Leave?");
  return (
    <>
      <a href="/projects">projects</a>
      <a href="/projects" target="_blank">
        blank
      </a>
      <a href="#top">hash</a>
      <a href={window.location.pathname}>self</a>
      <a href="https://example.org/x">external</a>
    </>
  );
}

const click = (name: string, init: MouseEventInit = {}) => {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });
  screen.getByText(name).dispatchEvent(event);
  return event;
};

afterEach(() => vi.restoreAllMocks());

describe("useUnsavedGuard", () => {
  it("stops an in-app link when the user declines, and lets it through when they agree", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Page dirty />);
    expect(click("projects").defaultPrevented).toBe(true);
    expect(confirm).toHaveBeenCalledWith("Leave?");
    confirm.mockReturnValue(true);
    expect(click("projects").defaultPrevented).toBe(false);
  });

  it("guards an external link too", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Page dirty />);
    expect(click("external").defaultPrevented).toBe(true);
  });

  it("asks nothing while the form is clean", () => {
    const confirm = vi.spyOn(window, "confirm");
    render(<Page dirty={false} />);
    expect(click("projects").defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([["blank"], ["hash"], ["self"]])("does not ask for %s: it drops nothing", (name) => {
    const confirm = vi.spyOn(window, "confirm");
    render(<Page dirty />);
    click(name);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("leaves modified clicks (new tab) alone", () => {
    const confirm = vi.spyOn(window, "confirm");
    render(<Page dirty />);
    click("projects", { ctrlKey: true });
    expect(confirm).not.toHaveBeenCalled();
  });

  it("warns before the tab closes only while dirty", () => {
    const { rerender } = render(<Page dirty={false} />);
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    rerender(<Page dirty />);
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });

  it("stops guarding once unmounted", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { unmount } = render(<Page dirty />);
    unmount();
    const a = document.createElement("a");
    a.href = "/projects";
    document.body.append(a);
    fireEvent.click(a);
    expect(confirm).not.toHaveBeenCalled();
    a.remove();
  });
});
