import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import TeamList from "./TeamList";

describe("TeamList", () => {
  it("links a member to their profile only when the API gave a visible account", () => {
    renderInApp(
      <TeamList
        members={[
          { id: "m1", name: "Ani", role: "Backend", avatarUrl: null, userId: "u-1" },
          { id: "m2", name: "Gone", role: null, avatarUrl: "http://x.test/a.png", userId: null },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Ani" })).toHaveAttribute("href", "/profile/u-1");
    expect(screen.getByText("Gone")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Gone" })).toBeNull();
    expect(document.querySelector('img[src^="http:"]')).toBeNull();
  });

  it("renders nothing without members", () => {
    const { container } = renderInApp(<TeamList members={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
