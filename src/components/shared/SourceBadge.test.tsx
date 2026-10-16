import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import SourceBadge from "./SourceBadge";

describe("SourceBadge", () => {
  it("says 'From GitHub' in words for an imported project", () => {
    renderInApp(<SourceBadge source="github" />);
    expect(screen.getByText("From GitHub")).toBeVisible();
  });
  it("is translated", () => {
    renderInApp(<SourceBadge source="github" />, "ru");
    expect(screen.getByText("Из GitHub")).toBeVisible();
  });
  it.each(["manual", undefined] as const)("shows nothing for %s", (source) => {
    renderInApp(<SourceBadge source={source} />);
    expect(screen.queryByText(/GitHub/)).toBeNull();
  });
});
