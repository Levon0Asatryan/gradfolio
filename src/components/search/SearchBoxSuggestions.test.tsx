import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { SearchBox } from "./SearchBox";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const SUGGESTIONS = {
  query: "io",
  people: [{ id: "p1", label: "Ioana Petrosyan", avatarUrl: null }],
  projects: [{ id: "j1", label: "IoT Garden", avatarUrl: null }],
  tags: ["IoT"],
};

let fetchMock: ReturnType<typeof vi.fn>;
const respond = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn(() => respond(SUGGESTIONS));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

const type = async (text: string) => {
  const box = screen.getByRole("combobox");
  fireEvent.focus(box);
  fireEvent.change(box, { target: { value: text } });
  await act(async () => vi.advanceTimersByTime(250));
  return box;
};

describe("search suggestions (combobox)", () => {
  it("is a combobox with a collapsed, labelled listbox until there is something to show", () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = screen.getByRole("combobox", { name: "Search people and projects" });
    expect(box).toHaveAttribute("aria-expanded", "false");
    expect(box).toHaveAttribute("aria-autocomplete", "list");
    expect(box).not.toHaveAttribute("aria-activedescendant");
    expect(box.getAttribute("aria-controls")).toBeTruthy();
  });

  it("asks the same-origin route (never the API), debounced, and not for an empty box", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    await type("   ");
    expect(fetchMock).not.toHaveBeenCalled();
    await type("io");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/search/suggest?q=io");
  });

  it("shows grouped options, expands, and announces the count politely", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = await type("io");
    expect(box).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("listbox", { name: "Suggestions" });
    expect(within(list).getByRole("group", { name: "People" })).toBeInTheDocument();
    expect(within(list).getByRole("group", { name: "Projects" })).toBeInTheDocument();
    expect(within(list).getByRole("group", { name: "Tags" })).toBeInTheDocument();
    expect(within(list).getAllByRole("option")).toHaveLength(4); // 3 suggestions + "Search for"
    expect(within(list).getByRole("option", { name: /Search for “io”/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3 suggestions available");
  });

  it("Arrow keys move the chosen option with aria-activedescendant, and wrap", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = await type("io");
    const options = screen.getAllByRole("option");
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(box).toHaveAttribute("aria-activedescendant", options[0]?.id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(box, { key: "ArrowUp" });
    expect(box).toHaveAttribute("aria-activedescendant", options[3]?.id);
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(box).toHaveAttribute("aria-activedescendant", options[0]?.id);
  });

  it("Enter on the chosen option goes there; Enter with none chosen is a plain search", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = await type("io");
    expect(fireEvent.keyDown(box, { key: "Enter" })).toBe(true); // not prevented: the form submits
    expect(router.push).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(fireEvent.keyDown(box, { key: "Enter" })).toBe(false);
    expect(router.push).toHaveBeenCalledWith("/profile/p1");
  });

  it("a click on a tag leads to its page", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    await type("io");
    fireEvent.click(screen.getByRole("option", { name: /^IoT$/ }));
    expect(router.push).toHaveBeenCalledWith("/tags/IoT");
  });

  it("Escape closes the list and keeps the text; typing opens it again", async () => {
    renderInApp(<SearchBox initialQuery="" />);
    const box = (await type("io")) as HTMLInputElement;
    expect(fireEvent.keyDown(box, { key: "Escape" })).toBe(false);
    expect(box).toHaveAttribute("aria-expanded", "false");
    expect(box.value).toBe("io");
    fireEvent.change(box, { target: { value: "iot" } });
    await act(async () => vi.advanceTimersByTime(250));
    expect(box).toHaveAttribute("aria-expanded", "true");
  });

  it("an older answer never replaces a newer one, and the older request is aborted", async () => {
    let finishFirst: (r: Response) => void = () => {};
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishFirst = resolve;
          }),
      )
      .mockImplementationOnce(() =>
        respond({
          ...SUGGESTIONS,
          query: "iot",
          people: [],
          projects: [],
          tags: ["IoT"],
        }),
      );
    renderInApp(<SearchBox initialQuery="" />);
    const box = await type("io");
    const firstSignal = (fetchMock.mock.calls[0]?.[1] as RequestInit).signal as AbortSignal;
    fireEvent.change(box, { target: { value: "iot" } });
    await act(async () => vi.advanceTimersByTime(250));
    expect(firstSignal.aborted).toBe(true);
    await act(async () => finishFirst(new Response(JSON.stringify(SUGGESTIONS))));
    expect(screen.queryByRole("option", { name: /Ioana/ })).toBeNull();
    expect(screen.getByRole("option", { name: /^IoT$/ })).toBeInTheDocument();
  });

  it("a failed or empty suggestion call leaves the box a plain search box", async () => {
    fetchMock.mockImplementation(() => respond({ code: "RATE_LIMITED" }, 429));
    renderInApp(<SearchBox initialQuery="" />);
    const box = await type("io");
    expect(box).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("speaks Russian and Armenian", async () => {
    renderInApp(<SearchBox initialQuery="" />, "ru");
    await type("io");
    expect(screen.getByRole("listbox", { name: "Подсказки" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Искать «io»/ })).toBeInTheDocument();
  });

  it("shows what was typed literally in the Search for option ($& is not a pattern)", async () => {
    fetchMock.mockImplementation(() =>
      respond({ query: "a$&b", people: [], projects: [], tags: [] }),
    );
    renderInApp(<SearchBox initialQuery="" />);
    await type("a$&b");
    expect(screen.getByRole("option", { name: "Search for “a$&b”" })).toBeInTheDocument();
  });
});
