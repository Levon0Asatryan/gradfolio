import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { SectionEditor, type EditableItem } from "./SectionEditor";

const nav = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
const action = vi.hoisted(() => ({
  saveEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
  reorderEntriesAction: vi.fn(),
}));
vi.mock("@/lib/profile/actions", () => action);

const ITEMS: EditableItem[] = [
  {
    id: "a",
    institution: "NPUA",
    degree: "B.Sc.",
    field: "Informatics",
    startYear: 2021,
    endYear: null,
    description: null,
    highlights: [],
  },
  {
    id: "b",
    institution: "Lyceum",
    degree: "Diploma",
    field: "Math",
    startYear: 2017,
    endYear: 2021,
    description: "x",
    highlights: ["y"],
  },
];

const show = (items = ITEMS) =>
  render(
    <LanguageProvider>
      <SectionEditor
        section="education"
        items={items}
        empty="No education entries yet."
        describe={(e) => ({
          primary: `${e.degree}`,
          secondary: `${e.institution}`,
          label: `${e.degree}, ${e.institution}`,
        })}
      />
    </LanguageProvider>,
  );

const fill = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => vi.resetAllMocks());

describe("SectionEditor", () => {
  it("shows the empty state", () => {
    show([]);
    expect(screen.getByText("No education entries yet.")).toBeInTheDocument();
  });

  it("adds an entry through the action and reloads the page data", async () => {
    action.saveEntryAction.mockResolvedValue({ ok: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fill(/^Institution/, "MIT");
    fill(/^Degree/, "M.Sc.");
    fill(/^Field of study/, "CS");
    fill(/^Start year/, "2024");
    fill(/^Highlights/, "GPA 4.0\n\nAward");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
    expect(action.saveEntryAction).toHaveBeenCalledWith("education", null, {
      institution: "MIT",
      degree: "M.Sc.",
      field: "CS",
      startYear: "2024",
      endYear: "",
      description: "",
      highlights: ["GPA 4.0", "", "Award"],
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not send an entry with a required field empty, and says which", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fill(/^Institution/, "MIT");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(action.saveEntryAction).not.toHaveBeenCalled();
    expect(screen.getAllByText("This field is required.").length).toBe(3);
  });

  it("flags a year outside 1900-2100", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fill(/^Institution/, "MIT");
    fill(/^Degree/, "M");
    fill(/^Field of study/, "CS");
    fill(/^Start year/, "1800");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Enter a year between 1900 and 2100.")).toBeInTheDocument();
    expect(action.saveEntryAction).not.toHaveBeenCalled();
  });

  it("edits an entry with its values filled in, sending its id", async () => {
    action.saveEntryAction.mockResolvedValue({ ok: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Edit: B.Sc., NPUA" }));
    expect(screen.getByLabelText(/^Institution/)).toHaveValue("NPUA");
    fill(/^Degree/, "B.Eng.");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(action.saveEntryAction).toHaveBeenCalled());
    expect(action.saveEntryAction.mock.calls[0]?.[1]).toBe("a");
    expect(action.saveEntryAction.mock.calls[0]?.[2]).toMatchObject({ degree: "B.Eng." });
  });

  it.each([
    ["LIMIT_REACHED", "This section is full"],
    ["NOT_FOUND", "no longer exists"],
    ["DATABASE_UNAVAILABLE", "Could not save your changes"],
  ])("keeps the dialog and the typed text on %s", async (code, message) => {
    action.saveEntryAction.mockResolvedValue({ ok: false, code });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fill(/^Institution/, "MIT");
    fill(/^Degree/, "M");
    fill(/^Field of study/, "CS");
    fill(/^Start year/, "2024");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText(/^Institution/)).toHaveValue("MIT");
    expect(nav.refresh).toHaveBeenCalledTimes(code === "NOT_FOUND" ? 1 : 0);
  });

  it("deletes only after confirming", async () => {
    action.deleteEntryAction.mockResolvedValue({ ok: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete: B.Sc., NPUA" }));
    expect(action.deleteEntryAction).not.toHaveBeenCalled();
    expect(screen.getByText("Delete this entry?")).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(action.deleteEntryAction).toHaveBeenCalledWith("education", "a"));
    await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  });

  it("cancelling the confirmation deletes nothing", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete: B.Sc., NPUA" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(action.deleteEntryAction).not.toHaveBeenCalled();
  });

  it("moves an entry by sending the whole list in the new order", async () => {
    action.reorderEntriesAction.mockResolvedValue({ ok: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Move up: Diploma, Lyceum" }));
    await waitFor(() =>
      expect(action.reorderEntriesAction).toHaveBeenCalledWith("education", ["b", "a"]),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Move down: B.Sc., NPUA" }));
  });

  it("cannot move the first entry up or the last one down", () => {
    show();
    expect(screen.getByRole("button", { name: "Move up: B.Sc., NPUA" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move down: Diploma, Lyceum" })).toBeDisabled();
  });

  it("says the list was stale and reloads it on ORDER_STALE", async () => {
    action.reorderEntriesAction.mockResolvedValue({ ok: false, code: "ORDER_STALE" });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Move up: Diploma, Lyceum" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The list changed elsewhere");
    expect(nav.refresh).toHaveBeenCalled();
  });
});
