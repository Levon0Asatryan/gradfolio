import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { CategoryChip } from "./CategoryChip";
import { FilterChip } from "./FilterChip";

describe("CategoryChip", () => {
  it.each([
    ["course", "Course"],
    ["personal", "Personal"],
    ["research", "Research"],
    ["hackathon", "Hackathon"],
    ["academic", "Academic"],
    ["other", "Other"],
  ])("names the %s category in text", (category, label) => {
    renderInApp(<CategoryChip category={category} />);
    expect(screen.getByText(label)).toBeVisible();
  });

  it.each([undefined, null, "N/A", "nonsense"])("reads %j as Other", (category) => {
    renderInApp(<CategoryChip category={category} />);
    expect(screen.getByText("Other")).toBeVisible();
  });

  it("names the category in the UI language", () => {
    renderInApp(<CategoryChip category="hackathon" />, "ru");
    expect(screen.getByText("Хакатон")).toBeVisible();
  });
});

describe("FilterChip", () => {
  it("is a button that says whether it is on, and toggles on click", () => {
    const onClick = vi.fn();
    renderInApp(<FilterChip label="Research" selected={false} onClick={onClick} />);
    const chip = screen.getByRole("button", { name: "Research" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("reports the selected state", () => {
    renderInApp(<FilterChip label="Research" selected onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Research" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("is at least 44px tall", () => {
    renderInApp(<FilterChip label="Research" selected={false} onClick={() => {}} />);
    expect(getComputedStyle(screen.getByRole("button")).minHeight).toBe("44px");
  });
});
