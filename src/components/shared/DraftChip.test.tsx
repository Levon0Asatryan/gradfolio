import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import DraftChip from "./DraftChip";

describe("DraftChip", () => {
  it.each([
    ["en", "Draft"],
    ["ru", "Черновик"],
    ["am", "Սևագիր"],
  ] as const)("says it in words, in %s", (lang, word) => {
    renderInApp(<DraftChip />, lang);
    expect(screen.getByText(word)).toBeVisible();
  });
});
