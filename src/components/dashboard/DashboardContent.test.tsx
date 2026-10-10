import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { profileCompleteness } from "@/lib/profile/completeness";
import { dashboard } from "@/testing/fixtures";
import { DashboardContent } from "./DashboardContent";

vi.mock("@/lib/dashboard/actions", () => ({ loadMoreActivitiesAction: vi.fn() }));

const PARTIAL = profileCompleteness({
  name: "Ani Petrosyan",
  headline: "CS",
  bio: "x",
  location: "Yerevan",
  contactEmail: null,
  avatarUrl: null,
});
const COMPLETE = profileCompleteness({
  name: "Ani Petrosyan",
  headline: "CS",
  bio: "x",
  location: "Yerevan",
  contactEmail: "a@b.co",
  avatarUrl: "https://x.test/a.png",
});

describe("DashboardContent", () => {
  it("welcomes the user by name and shows the meter with one next step", () => {
    renderInApp(
      <DashboardContent firstName="Ani" completeness={PARTIAL} dashboard={dashboard()} />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Welcome back, Ani" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Profile completeness" })).toHaveAttribute(
      "aria-valuenow",
      "33",
    );
    expect(screen.getByText("1 of 3 done")).toBeVisible();
    const next = screen.getByRole("link", { name: "Add a contact email" });
    expect(next).toHaveAttribute("href", "/profile/edit");
  });

  it("offers no next step once the profile is complete", () => {
    renderInApp(
      <DashboardContent firstName="Ani" completeness={COMPLETE} dashboard={dashboard()} />,
    );
    expect(screen.getByText("Your profile is complete. Nice work.")).toBeVisible();
    expect(screen.queryByText("Next step")).toBeNull();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("leaves the meter out, rather than showing 0%, when completeness is unknown", () => {
    renderInApp(<DashboardContent firstName={null} completeness={null} dashboard={dashboard()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/% complete/)).toBeNull();
  });

  it("lists recent projects as links with their category, and quick actions", () => {
    renderInApp(
      <DashboardContent firstName="Ani" completeness={PARTIAL} dashboard={dashboard()} />,
    );
    const recent = screen.getByRole("region", { name: "Recent Projects" });
    const link = within(recent).getByRole("link", { name: /EcoRoute/ });
    expect(link).toHaveAttribute("href", "/projects/5c1d9a3e-aaaa-4bbb-8ccc-ddddeeeeffff");
    expect(within(link).getByText("Personal")).toBeVisible();
    const actions = screen.getByRole("region", { name: "Quick Actions" });
    expect(within(actions).getByRole("link", { name: "New Project" })).toHaveAttribute(
      "href",
      "/projects/new",
    );
  });

  it("speaks Russian and keeps long Armenian/Russian first names readable", () => {
    renderInApp(
      <DashboardContent firstName="Александра" completeness={PARTIAL} dashboard={dashboard()} />,
      "ru",
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "С возвращением, Александра" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Добавить почту" })).toBeVisible();
  });
});
