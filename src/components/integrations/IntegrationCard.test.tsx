import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import IntegrationCard from "./IntegrationCard";

const show = (language: "en" | "ru") =>
  renderInApp(
    <IntegrationCard
      id="github"
      name="GitHub"
      description="d"
      status="connected"
      lastSyncedAt="2025-12-06T23:30:00Z"
      onConnect={vi.fn()}
      onDisconnect={vi.fn()}
    />,
    language,
  );

describe("IntegrationCard last sync", () => {
  it("prints the UTC day in English", () => {
    show("en");
    expect(screen.getByText(/Dec 6, 2025/)).toBeInTheDocument();
  });

  it("prints the UTC day in Russian", () => {
    show("ru");
    expect(screen.getByText(/6 дек\. 2025/)).toBeInTheDocument();
  });
});
