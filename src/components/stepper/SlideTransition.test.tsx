import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlideTransition } from "./SlideTransition";

let notify: () => void = () => {};
afterEach(() => vi.unstubAllGlobals());

describe("SlideTransition height", () => {
  it("reports again when the step's own content grows, not only when children change", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          notify = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    let height = 100;
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => height);
    const onHeightReady = vi.fn();
    render(
      <SlideTransition direction={1} onHeightReady={onHeightReady}>
        <p>step</p>
      </SlideTransition>,
    );
    expect(onHeightReady).toHaveBeenLastCalledWith(100);
    // An alert appears inside the step: same children prop, taller box.
    height = 180;
    act(() => notify());
    expect(onHeightReady).toHaveBeenLastCalledWith(180);
  });
});
