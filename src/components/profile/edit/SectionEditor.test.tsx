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
      startYear: 2024,
      endYear: null,
      description: null,
      highlights: ["GPA 4.0", "Award"],
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

  it("makes every year a number input with the API's bounds", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    for (const label of [/^Start year/, /^End year/]) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute("type", "number");
      expect(input).toHaveAttribute("min", "1900");
      expect(input).toHaveAttribute("max", "2100");
      expect(input).toHaveAttribute("step", "1");
    }
    expect(screen.getByLabelText(/^Institution/)).toHaveAttribute("type", "text");
  });

  it("does not let the scroll wheel change a focused year", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const input = screen.getByLabelText(/^Start year/);
    input.focus();
    expect(input).toHaveFocus();
    fireEvent.wheel(input);
    expect(input).not.toHaveFocus();
  });

  it.each(["e", "E", "+", "-", "."])("does not accept %s in a year", (key) => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    screen.getByLabelText(/^Start year/).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    const digit = new KeyboardEvent("keydown", { key: "7", bubbles: true, cancelable: true });
    screen.getByLabelText(/^Start year/).dispatchEvent(digit);
    expect(digit.defaultPrevented).toBe(false);
  });

  it("sends the years as numbers", async () => {
    action.saveEntryAction.mockResolvedValue({ ok: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fill(/^Institution/, "MIT");
    fill(/^Degree/, "M");
    fill(/^Field of study/, "CS");
    fill(/^Start year/, "2020");
    fill(/^End year/, "2024");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(action.saveEntryAction).toHaveBeenCalled());
    expect(action.saveEntryAction.mock.calls[0]?.[2]).toMatchObject({
      startYear: 2020,
      endYear: 2024,
    });
  });

  describe("unsaved dialog values", () => {
    const openAdd = () => {
      show();
      fireEvent.click(screen.getByRole("button", { name: "Add" }));
    };
    const link = () => {
      const a = document.createElement("a");
      a.href = "/projects";
      document.body.append(a);
      return a;
    };
    const click = (a: HTMLAnchorElement) => {
      const e = new MouseEvent("click", { bubbles: true, cancelable: true });
      a.dispatchEvent(e);
      return e;
    };

    it("asks before an in-app link or a reload drops typed values, and not while untouched", () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const a = link();
      openAdd();
      expect(click(a).defaultPrevented).toBe(false);
      const clean = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(clean);
      expect(clean.defaultPrevented).toBe(false);
      fill(/^Institution/, "MIT");
      expect(click(a).defaultPrevented).toBe(true);
      const dirty = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(dirty);
      expect(dirty.defaultPrevented).toBe(true);
      a.remove();
      confirm.mockRestore();
    });

    it("counts a ticked checkbox and a typed-but-not-added skill as changes", () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const a = link();
      render(
        <LanguageProvider>
          <SectionEditor
            section="experience"
            items={[]}
            empty="none"
            describe={() => ({ primary: "", label: "" })}
          />
        </LanguageProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Add" }));
      expect(click(a).defaultPrevented).toBe(false);
      fireEvent.change(screen.getByLabelText("Skills"), { target: { value: "Rust" } });
      expect(click(a).defaultPrevented).toBe(true);
      a.remove();
      confirm.mockRestore();
    });

    it("Escape on a dirty dialog asks first; Cancel is the explicit discard", () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      openAdd();
      fill(/^Institution/, "MIT");
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(confirm).toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      confirm.mockRestore();
    });
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

  describe("the experience form", () => {
    const EXP: EditableItem[] = [
      {
        id: "x",
        title: "Intern",
        organization: "Acme",
        start: "2024-06",
        end: null,
        summary: "Built.",
        achievements: [],
        skills: ["Go"],
      },
    ];
    const showExp = (items = EXP) =>
      render(
        <LanguageProvider>
          <SectionEditor
            section="experience"
            items={items}
            empty="none"
            describe={(e) => ({ primary: `${e.title}`, label: `${e.title}, ${e.organization}` })}
          />
        </LanguageProvider>,
      );

    it("edits with the checkbox ticked when the entry has no end, and sends a null end", async () => {
      action.saveEntryAction.mockResolvedValue({ ok: true });
      showExp();
      fireEvent.click(screen.getByRole("button", { name: "Edit: Intern, Acme" }));
      expect(screen.getByRole("checkbox", { name: "I currently work here" })).toBeChecked();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(action.saveEntryAction).toHaveBeenCalled());
      expect(action.saveEntryAction.mock.calls[0]?.[2]).toMatchObject({
        start: "2024-06",
        end: null,
        skills: ["Go"],
      });
    });

    it("unticking lets you pick an end; ticking again clears it", () => {
      showExp([{ ...EXP[0]!, end: "2025-01" } as EditableItem]);
      fireEvent.click(screen.getByRole("button", { name: "Edit: Intern, Acme" }));
      const current = screen.getByRole("checkbox", { name: "I currently work here" });
      expect(current).not.toBeChecked();
      expect(screen.getByLabelText("End (YYYY-MM, blank if current): Year")).toHaveValue(2025);
      fireEvent.click(current);
      expect(screen.getByLabelText("End (YYYY-MM, blank if current): Year")).toBeDisabled();
      expect(screen.getByLabelText("End (YYYY-MM, blank if current): Year")).toHaveValue(null);
    });

    it("says when the end is before the start, and sends nothing", () => {
      showExp([{ ...EXP[0]!, end: "2024-05" } as EditableItem]);
      fireEvent.click(screen.getByRole("button", { name: "Edit: Intern, Acme" }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(screen.getByText("The end must not be before the start.")).toBeInTheDocument();
      expect(action.saveEntryAction).not.toHaveBeenCalled();
    });

    it("adds skills as chips: Enter adds without submitting the dialog, x removes", () => {
      showExp();
      fireEvent.click(screen.getByRole("button", { name: "Edit: Intern, Acme" }));
      const input = screen.getByLabelText("Skills");
      fireEvent.change(input, { target: { value: "Rust" } });
      const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      fireEvent(input, enter);
      // A default Enter in a form field submits the form; it must be stopped.
      expect(enter.defaultPrevented).toBe(true);
      expect(screen.getByText("Rust")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(action.saveEntryAction).not.toHaveBeenCalled();
      fireEvent.click(screen.getByLabelText("Remove Go"));
      expect(screen.queryByText("Go")).not.toBeInTheDocument();
    });

    it("lets the summary stay blank", async () => {
      action.saveEntryAction.mockResolvedValue({ ok: true });
      showExp();
      fireEvent.click(screen.getByRole("button", { name: "Edit: Intern, Acme" }));
      fireEvent.change(screen.getByLabelText(/^Summary/), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(action.saveEntryAction).toHaveBeenCalled());
      expect(action.saveEntryAction.mock.calls[0]?.[2]).toMatchObject({ summary: "" });
    });

    it("shows how much of the long text column is used, in the API's unit", () => {
      showExp();
      fireEvent.click(screen.getByRole("button", { name: "Edit: Intern, Acme" }));
      expect(screen.getByText("6 / 65535 bytes")).toBeInTheDocument();
    });

    it("refuses a title past 500 characters with the limit in the message", () => {
      showExp();
      fireEvent.click(screen.getByRole("button", { name: "Edit: Intern, Acme" }));
      fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: "x".repeat(501) } });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(screen.getByText("Too long: at most 500 characters.")).toBeInTheDocument();
      expect(action.saveEntryAction).not.toHaveBeenCalled();
    });
  });
});
