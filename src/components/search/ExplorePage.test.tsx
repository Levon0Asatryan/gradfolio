import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import ExplorePage from "./ExplorePage";
import PortfolioCard from "./PortfolioCard";
import { portfoliosMock } from "@/data/portfolios.mock";

const results = () => screen.queryAllByRole("article");

describe("/search", () => {
  it("lists every portfolio, with its count", () => {
    renderInApp(<ExplorePage />);
    expect(results()).toHaveLength(portfoliosMock.length);
    expect(screen.getByRole("status")).toHaveTextContent(`Results: ${portfoliosMock.length}`);
  });

  it("filters by role chip, and the chip says it is pressed", () => {
    renderInApp(<ExplorePage />);
    const chip = screen.getByRole("button", { name: "Designers" });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(results().length).toBeLessThan(portfoliosMock.length);
  });

  it("clears the search and the chip without reloading the page", () => {
    renderInApp(<ExplorePage />);
    fireEvent.click(screen.getByRole("button", { name: "Designers" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "zzzzqq" } });
    expect(screen.getByText("No portfolios found")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
    expect(results()).toHaveLength(portfoliosMock.length);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("gives the count in Russian without gluing an English plural onto it", () => {
    renderInApp(<ExplorePage />, "ru");
    expect(screen.getByRole("status")).toHaveTextContent(`Результатов: ${portfoliosMock.length}`);
  });
});

// Levon's bug: the results flickered without end. The card used to lift 8px on
// hover (motion's whileHover). A pointer resting on its bottom edge was then no
// longer over the card, so it dropped back, regained the hover, lifted again,
// and so on. The hover must not move the card: no JS-driven transform at all.
describe("PortfolioCard hover", () => {
  it("never moves the card, so it cannot slip out from under the pointer", async () => {
    const profile = portfoliosMock[0]!;
    const { container } = renderInApp(<PortfolioCard profile={profile} />);
    const article = screen.getByRole("article");
    fireEvent.pointerEnter(article, { pointerType: "mouse" });
    fireEvent.mouseEnter(article);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    const moved = [...container.querySelectorAll("[style]")].filter((el) =>
      /transform|translate/.test(el.getAttribute("style") ?? ""),
    );
    expect(moved).toEqual([]);
  });
});
