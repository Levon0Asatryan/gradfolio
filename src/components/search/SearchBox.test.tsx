import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
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
    expect(screen.getByRole("combobox", { name: "Search people and projects" })).toHaveAttribute(
      "name",
      "q",
    );
  });

  it("replaces the URL with /search?q=... 300 ms after the last key, never /projects", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = screen.getByRole("combobox");
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
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    await act(async () => vi.advanceTimersByTime(300));
    expect(router.replace).toHaveBeenCalledWith("/search");
  });

  it("does not navigate for the query it already shows", async () => {
    renderInApp(<SearchBox initialQuery="ml" />);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("keeps what was typed while a search is in flight: the echo of an older query changes nothing", async () => {
    const view = renderInApp(<SearchBox initialQuery="" />);
    const box = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.change(box, { target: { value: "slow" } });
    await act(async () => vi.advanceTimersByTime(300));
    expect(router.replace).toHaveBeenCalledWith("/search?q=slow");
    // The user goes on typing while "slow" is being fetched...
    fireEvent.change(box, { target: { value: "slow query" } });
    // ...and the page re-renders with the query it was asked for.
    view.rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider>
          <SearchBox initialQuery="slow" />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(box.value).toBe("slow query");
    await act(async () => vi.advanceTimersByTime(300));
    expect(router.replace).toHaveBeenLastCalledWith("/search?q=slow+query");
    // Its echo, then a stale one arriving late: still nothing is erased.
    view.rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider>
          <SearchBox initialQuery="slow query" />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(box.value).toBe("slow query");
  });

  it("follows a navigation from outside (Back, a link): the box shows the URL's query", () => {
    const view = renderInApp(<SearchBox initialQuery="iot" />);
    const box = screen.getByRole("combobox") as HTMLInputElement;
    view.rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider>
          <SearchBox initialQuery="ml" />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(box.value).toBe("ml");
  });

  it("does not search in the middle of an input-method composition, and searches when it ends", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.compositionStart(box);
    fireEvent.change(box, { target: { value: "Արմ" } });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(router.replace).not.toHaveBeenCalled();
    fireEvent.compositionEnd(box, { target: { value: "Արմ" } });
    await act(async () => vi.advanceTimersByTime(300));
    expect(router.replace).toHaveBeenCalledWith(`/search?q=${encodeURIComponent("Արմ")}`);
  });

  it("a composition that never ends does not leave the search stuck: leaving the box releases it", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.compositionStart(box);
    fireEvent.change(box, { target: { value: "ml" } });
    await act(async () => vi.advanceTimersByTime(1000));
    expect(router.replace).not.toHaveBeenCalled();
    fireEvent.blur(box);
    await act(async () => vi.advanceTimersByTime(300));
    expect(router.replace).toHaveBeenCalledWith("/search?q=ml");
  });
});
