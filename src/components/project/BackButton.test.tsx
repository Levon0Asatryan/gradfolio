import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import BackButton from "./BackButton";

describe("project detail back link", () => {
  it("returns an anonymous viewer of a public project to public browsing", () => {
    renderInApp(<BackButton isOwner={false} />);
    expect(screen.getByRole("link", { name: "Back to Projects" })).toHaveAttribute(
      "href",
      "/browse/projects",
    );
  });

  it("returns the owner to their personal project list", () => {
    renderInApp(<BackButton isOwner />);
    expect(screen.getByRole("link", { name: "Back to Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
