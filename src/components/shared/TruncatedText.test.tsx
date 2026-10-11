import { act, fireEvent, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { renderInApp } from "@/testing/render";
import TruncatedText from "./TruncatedText";

/*
 * jsdom lays nothing out: every box measures 0. The browser's answer is stubbed here, one box
 * for the measured text, and ResizeObserver (absent in jsdom) is a fake the test fires.
 */
const box = { scrollWidth: 100, clientWidth: 100, scrollHeight: 40, clientHeight: 40 };
const fits = () => Object.assign(box, { scrollWidth: 100, clientWidth: 100, scrollHeight: 40 });
const overflowsWidth = () => Object.assign(box, { scrollWidth: 260 });
const overflowsHeight = () => Object.assign(box, { scrollHeight: 120 });

let observers: Array<() => void> = [];
class FakeResizeObserver {
  constructor(private readonly callback: () => void) {}
  observe() {
    observers.push(this.callback);
  }
  disconnect() {
    observers = observers.filter((cb) => cb !== this.callback);
  }
}
const resize = () => act(() => observers.forEach((cb) => cb()));

beforeAll(() => {
  for (const key of Object.keys(box) as Array<keyof typeof box>) {
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => box[key],
    });
  }
});
afterAll(() => {
  for (const key of Object.keys(box)) Reflect.deleteProperty(HTMLElement.prototype, key);
});
beforeEach(() => {
  fits();
  observers = [];
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const LONG = "A project title long enough to be cut off at the end of the card";
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
/** The popup is hidden from the accessibility tree on purpose (it repeats the text). */
const tooltip = () => screen.queryByRole("tooltip", { hidden: true });
/** The measured text itself, not the tooltip's copy of it. */
const text = () => {
  const found = screen.getAllByText(LONG).find((el) => !el.closest('[role="tooltip"]'));
  if (!found) throw new Error("the text is not rendered");
  return found;
};

/** Focus as the Tab key does: jsdom's `:focus-visible` follows the browser's heuristic. */
function tabTo(el: HTMLElement) {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: "Tab" });
  act(() => el.focus());
  fireEvent.keyUp(el, { key: "Tab" });
}

/** Nothing the tooltip adds may name or describe the text a second time. */
function expectNoSecondAnnouncement(el: HTMLElement) {
  expect(el).not.toHaveAttribute("aria-label");
  expect(el).not.toHaveAttribute("aria-labelledby");
  expect(el).not.toHaveAttribute("aria-describedby");
  expect(el).not.toHaveAttribute("title");
}

describe("TruncatedText", () => {
  it("has no tooltip and no tab stop when the text fits", async () => {
    renderInApp(<TruncatedText text={LONG} />);
    fireEvent.mouseOver(text());
    await wait(500);
    expect(tooltip()).toBeNull();
    expect(text()).not.toHaveAttribute("tabindex");
  });

  it("shows the full text on hover when one line is cropped", async () => {
    overflowsWidth();
    renderInApp(<TruncatedText text={LONG} />);
    fireEvent.mouseOver(text());
    await wait(200);
    expect(tooltip()).toHaveTextContent(LONG);
  });

  it("measures a clamped text by its height, not its width", async () => {
    overflowsWidth(); // a clamped block wraps: its width says nothing
    const { unmount } = renderInApp(<TruncatedText text={LONG} lines={2} />);
    expect(text()).not.toHaveAttribute("tabindex");
    unmount();

    fits();
    overflowsHeight();
    renderInApp(<TruncatedText text={LONG} lines={2} />);
    expect(text()).toHaveAttribute("tabindex", "0");
    fireEvent.mouseOver(text());
    await wait(200);
    expect(tooltip()).toHaveTextContent(LONG);
  });

  it("measures again when its box is resized", async () => {
    renderInApp(<TruncatedText text={LONG} />);
    expect(text()).not.toHaveAttribute("tabindex");
    overflowsWidth();
    await resize();
    expect(text()).toHaveAttribute("tabindex", "0");
    fits();
    await resize();
    expect(text()).not.toHaveAttribute("tabindex");
  });

  it("measures again when the text changes, even if its box does not", () => {
    const { rerender } = renderInApp(<TruncatedText text="Short" />);
    expect(screen.getByText("Short")).not.toHaveAttribute("tabindex");
    overflowsWidth();
    rerender(
      <ThemeWrapper initialMode="light">
        <LanguageProvider initialLanguage="en">
          <TruncatedText text={LONG} />
        </LanguageProvider>
      </ThemeWrapper>,
    );
    expect(text()).toHaveAttribute("tabindex", "0");
  });

  it("measures again once the web fonts have loaded", async () => {
    let loaded: () => void = () => undefined;
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: new Promise<void>((resolve) => (loaded = resolve)) },
    });
    try {
      renderInApp(<TruncatedText text={LONG} />);
      expect(text()).not.toHaveAttribute("tabindex");
      overflowsWidth();
      await act(async () => loaded());
      expect(text()).toHaveAttribute("tabindex", "0");
    } finally {
      Reflect.deleteProperty(document, "fonts");
    }
  });

  it("takes keyboard focus only when cropped, and focus shows the full text", async () => {
    overflowsWidth();
    renderInApp(<TruncatedText text={LONG} />);
    expect(text()).toHaveAttribute("tabindex", "0");
    tabTo(text());
    await wait(200);
    expect(tooltip()).toHaveTextContent(LONG);
    fireEvent.keyDown(document, { key: "Escape" });
    await wait(500);
    expect(tooltip()).toBeNull();
  });

  it("keeps the theme's focus ring (3px, ui-plan): its own focus rule sets no outline", () => {
    overflowsWidth();
    renderInApp(<TruncatedText text={LONG} />);
    const classes = [...text().classList].filter((c) => c.startsWith("css-"));
    const css = [...document.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n");
    const ownFocusRules = css
      .split("}")
      .filter((rule) => rule.includes(":focus-visible") && classes.some((c) => rule.includes(c)));
    expect(ownFocusRules.length).toBeGreaterThan(0);
    expect(ownFocusRules.join("}")).not.toMatch(/outline/);
  });

  it("adds no name or description: the visible text already carries the full string", async () => {
    overflowsWidth();
    renderInApp(<TruncatedText text={LONG} />);
    expectNoSecondAnnouncement(text());
    fireEvent.mouseOver(text());
    await wait(200);
    expect(tooltip()).toHaveTextContent(LONG);
    expectNoSecondAnnouncement(text());
    expect(tooltip()?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("opens on a tap when it is not inside a control", async () => {
    overflowsWidth();
    renderInApp(<TruncatedText text={LONG} />);
    fireEvent.touchStart(text());
    await wait(150); // no touch delay; MUI's enter delay (100 ms) still applies
    expect(tooltip()).toHaveTextContent(LONG);
  });

  describe("inside a link", () => {
    const card = () => (
      <a href="https://example.org/projects/1">
        <TruncatedText text={LONG} lines={2} component="h3" />
      </a>
    );

    it("leaves the link the only tab stop and reveals the text on the link's keyboard focus", async () => {
      overflowsHeight();
      renderInApp(card());
      const link = screen.getByRole("link", { name: LONG });
      expect(text()).not.toHaveAttribute("tabindex");
      tabTo(link);
      expect(tooltip()).toHaveTextContent(LONG);
      expectNoSecondAnnouncement(text());
      expect(link).toHaveAccessibleDescription("");
      fireEvent.keyDown(document, { key: "Escape" });
      await wait(500);
      expect(tooltip()).toBeNull();
    });

    it("does not reveal anything on the link's focus when the text fits", () => {
      renderInApp(card());
      tabTo(screen.getByRole("link"));
      expect(tooltip()).toBeNull();
    });

    it("keeps a tap for the link: the tooltip needs MUI's long press", async () => {
      overflowsHeight();
      renderInApp(card());
      fireEvent.touchStart(text());
      await wait(100);
      expect(tooltip()).toBeNull();
      await wait(700);
      expect(tooltip()).toHaveTextContent(LONG);
    });
  });

  it("measures nothing on the server, so hydration matches", async () => {
    overflowsWidth();
    const ui = (
      <ThemeWrapper initialMode="light">
        <LanguageProvider initialLanguage="am">
          <TruncatedText text={LONG} />
        </LanguageProvider>
      </ThemeWrapper>
    );
    const container = document.createElement("div");
    // The server has no window: render without one, so a client-only branch shows up as a mismatch.
    vi.stubGlobal("window", undefined);
    container.innerHTML = renderToString(ui);
    vi.unstubAllGlobals();
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    document.body.append(container);
    expect(container.querySelector("[tabindex]")).toBeNull();
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = await act(async () =>
      hydrateRoot(container, ui, { onRecoverableError: recoverable }),
    );
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(container.querySelector("[tabindex]")).toHaveTextContent(LONG);
    errors.mockRestore();
    act(() => root.unmount());
    container.remove();
  });
});
