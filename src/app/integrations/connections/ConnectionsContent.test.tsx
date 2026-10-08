import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderInApp } from "@/testing/render";
import { ConnectionsContent } from "./ConnectionsContent";

describe("integrations setup stepper", () => {
  it("has step indicators that are named buttons, one marked current", () => {
    renderInApp(<ConnectionsContent />, "ru");
    const first = screen.getByRole("button", { name: "Шаг 1 из 4" });
    expect(first).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Шаг 2 из 4" })).not.toHaveAttribute("aria-current");
  });

  it("moves to a step from its indicator button", async () => {
    renderInApp(<ConnectionsContent />);
    fireEvent.click(screen.getByRole("button", { name: "Step 3 of 4" }));
    expect(
      await screen.findByRole("heading", { name: "Experience & Education" }),
    ).toBeInTheDocument();
  });

  it("ends in a translated finish screen, not a blank card", async () => {
    renderInApp(<ConnectionsContent />, "ru");
    fireEvent.click(screen.getByRole("button", { name: "Шаг 2 из 4" }));
    fireEvent.change(await screen.findByLabelText(/Полное имя/), { target: { value: "Ann" } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "a@b.co" } });
    fireEvent.click(screen.getByRole("button", { name: "Шаг 4 из 4" }));
    fireEvent.click(await screen.findByRole("button", { name: "Завершить" }));
    expect(await screen.findByRole("heading", { name: "Настройка завершена" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Перейти в мой профиль" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });
});
