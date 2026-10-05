import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/components/i18n/LanguageContext";
import { SkillsEditor } from "./SkillsEditor";

const nav = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
const action = vi.hoisted(() => ({ replaceSkillsAction: vi.fn() }));
vi.mock("@/lib/profile/actions", () => action);

const dirty = vi.fn();
const show = (skills = ["TypeScript"]) =>
  render(
    <LanguageProvider>
      <SkillsEditor skills={skills} onDirtyChange={dirty} />
    </LanguageProvider>,
  );
const add = (name: string) => {
  fireEvent.change(screen.getByLabelText("New Skill"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
};

beforeEach(() => vi.resetAllMocks());

describe("SkillsEditor", () => {
  it("replaces the whole list in one call, and reloads", async () => {
    action.replaceSkillsAction.mockResolvedValue({ ok: true });
    show();
    add(" React ");
    fireEvent.click(screen.getByRole("button", { name: "Save skills" }));
    await waitFor(() =>
      expect(action.replaceSkillsAction).toHaveBeenCalledWith(["TypeScript", "React"]),
    );
    await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  });

  it("does not show a case-insensitive duplicate the server would collapse", () => {
    show();
    add("typescript");
    expect(screen.getAllByText(/typescript/i)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Save skills" })).toBeDisabled();
  });

  it("shows the API's canonical spelling after a save, and is clean", async () => {
    action.replaceSkillsAction.mockResolvedValue({ ok: true, skills: ["TypeScript", "Go"] });
    show(["Go"]);
    add("typescript");
    fireEvent.click(screen.getByRole("button", { name: "Save skills" }));
    expect(await screen.findByText("TypeScript")).toBeInTheDocument();
    expect(screen.queryByText("typescript")).not.toBeInTheDocument();
    // refresh() keeps client state, so the editor must already be clean without the new props.
    await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(false));
    expect(screen.getByText("Skills saved.")).toBeInTheDocument();
  });

  it("counts a typed-but-not-added skill as an unsaved change", () => {
    show();
    fireEvent.change(screen.getByLabelText("New Skill"), { target: { value: "Go" } });
    expect(dirty).toHaveBeenLastCalledWith(true);
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(dirty).toHaveBeenLastCalledWith(false);
    expect(screen.getByLabelText("New Skill")).toHaveValue("");
  });

  it("refuses a skill past 255 characters and says why", () => {
    show();
    add("x".repeat(256));
    expect(screen.getByText("Too long: at most 255 characters.")).toBeInTheDocument();
    expect(screen.queryByText("x".repeat(256))).not.toBeInTheDocument();
  });

  it("removes a skill by its accessible remove control", async () => {
    action.replaceSkillsAction.mockResolvedValue({ ok: true });
    show(["TypeScript", "Go"]);
    fireEvent.click(screen.getByLabelText("Remove skill Go"));
    fireEvent.click(screen.getByRole("button", { name: "Save skills" }));
    await waitFor(() => expect(action.replaceSkillsAction).toHaveBeenCalledWith(["TypeScript"]));
  });

  it("reports dirty state to the parent, and Cancel discards", () => {
    show();
    expect(dirty).toHaveBeenLastCalledWith(false);
    add("Go");
    expect(dirty).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(dirty).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText("Go")).not.toBeInTheDocument();
  });

  it("warns before the tab closes only while there are unsaved changes", () => {
    show();
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    add("Go");
    const unsaved = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unsaved);
    expect(unsaved.defaultPrevented).toBe(true);
  });

  it("asks before an in-app link drops unsaved skill changes", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const link = document.createElement("a");
    link.href = "/projects";
    document.body.append(link);
    show();
    add("Go");
    const e = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    link.remove();
    confirm.mockRestore();
  });

  it("keeps the edits and says so when the save fails", async () => {
    action.replaceSkillsAction.mockResolvedValue({ ok: false, code: "DATABASE_UNAVAILABLE" });
    show();
    add("Go");
    fireEvent.click(screen.getByRole("button", { name: "Save skills" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save your changes");
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(nav.refresh).not.toHaveBeenCalled();
  });
});
