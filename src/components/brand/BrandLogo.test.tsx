import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeWrapper } from "@/components/theme/ThemeWrapper";
import { BrandLogo } from "./BrandLogo";

const show = (mode: "light" | "dark", variant?: "mark" | "horizontal") =>
  render(
    <ThemeWrapper initialMode={mode}>
      <BrandLogo variant={variant} />
    </ThemeWrapper>,
  );

describe("BrandLogo", () => {
  it("uses the light wordmark in light and the dark wordmark in dark", () => {
    const light = show("light");
    expect(screen.getByRole("img", { name: "Gradfolio" })).toHaveAttribute(
      "src",
      "/brand/logo-horizontal.svg",
    );
    light.unmount();
    show("dark");
    expect(screen.getByRole("img", { name: "Gradfolio" })).toHaveAttribute(
      "src",
      "/brand/logo-horizontal-dark.svg",
    );
  });

  it("shows only the mark when asked (collapsed navigation)", () => {
    show("light", "mark");
    expect(screen.getByRole("img", { name: "Gradfolio" })).toHaveAttribute(
      "src",
      "/brand/logo-mark.svg",
    );
  });
});
