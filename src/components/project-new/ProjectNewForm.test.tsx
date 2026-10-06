import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import ProjectNewForm from "./ProjectNewForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("/projects/new", () => {
  it("has one page heading, a Cancel link back to the list and a Create button", () => {
    renderInApp(<ProjectNewForm />);
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("button", { name: "Create Project" })).toBeVisible();
  });

  // The attachment block and its dialog used to be hardcoded English.
  it.each([
    ["ru", "Вложения / Доказательства", "Добавить медиа", "Добавить вложение"],
    ["am", null, null, null],
  ] as const)("translates the attachment block (%s)", (language, heading, add, title) => {
    renderInApp(<ProjectNewForm />, language);
    if (!heading) {
      expect(screen.queryByText("Attachments / Evidence")).toBeNull();
      expect(screen.queryByText("Add Media")).toBeNull();
      return;
    }
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: add }));
    expect(within(screen.getByRole("dialog")).getByText(title)).toBeVisible();
  });

  it("adds an attachment and lets you remove it", async () => {
    renderInApp(<ProjectNewForm />);
    fireEvent.click(screen.getByRole("button", { name: /Add media/i }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("URL"), {
      target: { value: "https://example.com/a.png" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove attachment" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Remove attachment" })).toBeNull(),
    );
  });
});
