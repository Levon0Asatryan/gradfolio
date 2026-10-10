import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import NotFound from "./not-found";

vi.mock("@/components/layout/SidebarVisibilityContext", () => ({
  useSidebarVisibility: () => ({ setHidden: vi.fn() }),
}));
vi.mock("@/components/effects/Noise", () => ({ Noise: () => null }));

describe("404 page", () => {
  it("has one heading, in the UI language", () => {
    renderInApp(<NotFound />, "ru");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Страница не найдена");
    expect(screen.getByRole("link", { name: "Перейти на дашборд" })).toHaveAttribute("href", "/");
    expect(screen.queryByText(/Page not found/)).not.toBeInTheDocument();
  });

  it("hides the navigation in the server HTML, so it is never painted and the page does not shift (M4 F4)", () => {
    const { container } = renderInApp(<NotFound />);
    const css = Array.from(container.querySelectorAll("style")).map((n) => n.textContent ?? "");
    expect(css.some((c) => /\[data-app-nav\]\s*\{\s*display:\s*none/.test(c))).toBe(true);
  });
});
