import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import DetailDialog from "./DetailDialog";

describe("DetailDialog", () => {
  it("labels its close button in the UI language", () => {
    renderInApp(
      <DetailDialog open title="T" onClose={vi.fn()}>
        x
      </DetailDialog>,
      "ru",
    );
    expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
  });
});
