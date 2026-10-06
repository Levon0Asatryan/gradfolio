import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageContainer } from "./PageContainer";

describe("PageContainer", () => {
  it("renders its children in one frame with the shared gutters and gap", () => {
    render(
      <PageContainer maxWidth={960} gap={2}>
        <p>One</p>
        <p>Two</p>
      </PageContainer>,
    );
    const frame = screen.getByText("One").parentElement as HTMLElement;
    const css = getComputedStyle(frame);
    expect(frame).toContainElement(screen.getByText("Two"));
    expect(css.maxWidth).toBe("960px");
    expect(css.display).toBe("flex");
    expect(frame).toHaveStyle({ maxWidth: "960px" });
    expect(css.paddingLeft).not.toBe("0px");
  });
});
