import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import IntegrationCard from "./IntegrationCard";

const show = (language: "en" | "ru", syncedAt: string | null = "2025-12-06T23:30:00Z") =>
  renderInApp(
    <IntegrationCard
      id="github"
      name="GitHub"
      description="d"
      connected
      syncLabel="Last synced:"
      syncedAt={syncedAt}
      neverText="Not synced yet"
    />,
    language,
  );

describe("IntegrationCard", () => {
  it("prints the UTC day in English", () => {
    show("en");
    expect(screen.getByText(/Dec 6, 2025/)).toBeInTheDocument();
  });

  it("prints the UTC day in Russian", () => {
    show("ru");
    expect(screen.getByText(/6 дек\. 2025/)).toBeInTheDocument();
  });

  it("says never, not a 1970 date, when nothing has synced", () => {
    show("en", null);
    expect(screen.getByText("Not synced yet")).toBeInTheDocument();
    expect(screen.queryByText(/1970/)).toBeNull();
  });

  it("states the connection in words, not by colour alone", () => {
    renderInApp(
      <IntegrationCard id="linkedin" name="LinkedIn" description="d" connected={false} />,
    );
    expect(screen.getByText("Not connected")).toBeVisible();
    expect(screen.getByRole("region", { name: "LinkedIn" })).toBeInTheDocument();
  });
});
