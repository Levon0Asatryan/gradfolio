import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { SearchBox } from "./SearchBox";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("SearchBox", () => {
  it("is a GET form to /search, so it works without JavaScript", () => {
    renderInApp(<SearchBox initialQuery="" />);
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/search");
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByRole("searchbox", { name: "Search people and projects" })).toHaveAttribute(
      "name",
      "q",
    );
  });

  it("replaces the URL with /search?q=... 300 ms after the last key, never /projects", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = screen.getByRole("searchbox");
    fireEvent.change(box, { target: { value: "C#" } });
    fireEvent.change(box, { target: { value: "C# go" } });
    await act(async () => vi.advanceTimersByTime(299));
    expect(router.replace).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(1));
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/search?q=C%23+go");
  });

  it("clearing the box goes back to /search", async () => {
    renderInApp(<SearchBox initialQuery="ml" />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    await act(async () => vi.advanceTimersByTime(300));
    expect(router.replace).toHaveBeenCalledWith("/search");
  });

  it("does not navigate for the query it already shows", async () => {
    renderInApp(<SearchBox initialQuery="ml" />);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(router.replace).not.toHaveBeenCalled();
  });
});
