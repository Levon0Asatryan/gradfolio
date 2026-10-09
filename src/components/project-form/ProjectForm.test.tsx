import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { projectDetail } from "@/testing/fixtures";
import { toFormValues } from "@/lib/projects/form";
import { ProjectForm } from "./ProjectForm";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }) }));
const act_ = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/lib/projects/actions", () => ({
  createProjectAction: act_.create,
  updateProjectAction: act_.update,
  deleteProjectAction: act_.del,
}));
// Tiptap needs a real browser selection API; the editor has its own test.
vi.mock("./RichTextEditorLazy", () => ({
  RichTextEditorLazy: ({
    onChange,
    labelId,
  }: {
    onChange: (h: string) => void;
    labelId: string;
  }) => (
    <div
      role="textbox"
      aria-labelledby={labelId}
      tabIndex={0}
      onInput={() => onChange("<p>desc</p>")}
    />
  ),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const title = () => screen.getByRole("textbox", { name: /^Title/ });
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const save = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));

describe("ProjectForm, create", () => {
  it("shows the sections and the Create button", () => {
    renderInApp(<ProjectForm mode="create" />);
    expect(screen.getByRole("heading", { level: 1, name: "New project" })).toBeVisible();
    for (const name of [
      "Basics",
      "Description",
      "Details",
      "Technologies and tags",
      "Links and cover",
      "Visibility",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "Create project" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Delete project" })).toBeNull();
  });

  it("refuses an empty title on the field and in a focused summary, and calls nothing", async () => {
    renderInApp(<ProjectForm mode="create" />);
    save("Create project");
    const alerts = await screen.findAllByRole("alert");
    expect(alerts[0]).toHaveTextContent("Please fix 1 field(s)");
    expect(alerts[0]).toHaveTextContent("This field is required.");
    expect(title()).toHaveAttribute("aria-invalid", "true");
    expect(act_.create).not.toHaveBeenCalled();
  });

  it("saves the typed values, then goes to the project with a flag, not text", async () => {
    act_.create.mockResolvedValue({ ok: true, id: "p-1" });
    renderInApp(<ProjectForm mode="create" />);
    type(title(), "EcoRoute");
    type(screen.getByRole("textbox", { name: /^Course/ }), "Databases");
    save("Create project");
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/projects/p-1?flash=created"));
    expect(act_.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "EcoRoute", course: "Databases" }),
    );
  });

  it("keeps every typed value and says so when the save fails", async () => {
    act_.create.mockResolvedValue({ ok: false, code: "API_UNREACHABLE" });
    renderInApp(<ProjectForm mode="create" />);
    type(title(), "EcoRoute");
    save("Create project");
    expect(await screen.findByText(/Could not save the project/)).toBeVisible();
    expect(title()).toHaveValue("EcoRoute");
    expect(nav.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create project" })).toBeEnabled();
  });

  it("shows the API's field refusal on the field, and a thrown action as a save error", async () => {
    act_.create.mockResolvedValueOnce({
      ok: false,
      code: "VALIDATION_FAILED",
      fields: { endDate: "invalid" },
    });
    renderInApp(<ProjectForm mode="create" />);
    type(title(), "EcoRoute");
    save("Create project");
    expect(await screen.findByText(/The server rejected some values/)).toBeVisible();
    expect(screen.getByLabelText("End date")).toHaveAttribute("aria-invalid", "true");
    act_.create.mockRejectedValueOnce(new Error("network"));
    save("Create project");
    await waitFor(() => expect(screen.getByText(/Could not save the project/)).toBeVisible());
  });

  it("asks an expired session to sign in again, back to this form", async () => {
    act_.create.mockResolvedValue({ ok: false, code: "UNAUTHENTICATED" });
    renderInApp(<ProjectForm mode="create" />);
    type(title(), "x");
    save("Create project");
    expect(await screen.findByRole("link", { name: "Auth0 Login" })).toHaveAttribute(
      "href",
      "/auth/login?returnTo=%2Fprojects%2Fnew",
    );
  });

  it("checks the dates and the URLs before sending", async () => {
    renderInApp(<ProjectForm mode="create" />);
    type(title(), "EcoRoute");
    type(screen.getByLabelText("Start date"), "2025-09-02");
    type(screen.getByLabelText("End date"), "2025-09-01");
    type(screen.getByLabelText("Live demo URL"), "javascript:alert(1)");
    type(screen.getByLabelText("Cover image URL"), "http://x.test/a.png");
    save("Create project");
    expect(await screen.findAllByText("The end must not be before the start.")).not.toHaveLength(0);
    expect(screen.getAllByText("Enter a full https:// address.").length).toBeGreaterThan(0);
    expect(act_.create).not.toHaveBeenCalled();
  });

  it("adds, edits and removes a link row, up to ten", () => {
    renderInApp(<ProjectForm mode="create" />);
    const add = () => fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    add();
    type(screen.getByLabelText("Label 1"), "Docs");
    type(screen.getByLabelText("Address 1"), "https://docs.test");
    fireEvent.click(screen.getByRole("button", { name: "Remove link 1" }));
    expect(screen.queryByLabelText("Label 1")).toBeNull();
    for (let i = 0; i < 10; i++) add();
    expect(screen.getByRole("button", { name: "Add link" })).toBeDisabled();
  });

  it("adds technologies as chips and removes one by its button", () => {
    renderInApp(<ProjectForm mode="create" />);
    const box = screen.getByRole("combobox", { name: "Technologies" });
    for (const word of ["React", "react", "  Go  "]) {
      type(box, word);
      fireEvent.keyDown(box, { key: "Enter" });
    }
    expect(screen.getAllByText(/^(React|Go)$/)).toHaveLength(2);
    fireEvent.click(
      within(
        screen.getByRole("combobox", { name: "Technologies" }).closest("div")!.parentElement!,
      ).getAllByTestId("CancelIcon")[0]!,
    );
    expect(screen.queryByText("React")).toBeNull();
  });

  it("says how many items are allowed when there are too many, not how long one may be", async () => {
    renderInApp(<ProjectForm mode="create" />);
    type(title(), "EcoRoute");
    const box = screen.getByRole("combobox", { name: "Technologies" });
    for (let i = 0; i < 31; i++) {
      type(box, `tech${i}`);
      fireEvent.keyDown(box, { key: "Enter" });
    }
    save("Create project");
    expect((await screen.findAllByText("At most 30 items.")).length).toBeGreaterThan(0);
    expect(screen.queryByText(/255/)).toBeNull();
    expect(act_.create).not.toHaveBeenCalled();
  });

  it("leaves at once on Cancel when nothing changed", () => {
    const confirm = vi.spyOn(window, "confirm");
    renderInApp(<ProjectForm mode="create" />);
    save("Cancel");
    expect(confirm).not.toHaveBeenCalled();
    expect(nav.push).toHaveBeenCalledWith("/projects");
    confirm.mockRestore();
  });

  it("asks before Cancel throws away edits: staying keeps them, confirming leaves", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderInApp(<ProjectForm mode="create" />);
    type(title(), "x");
    save("Cancel");
    expect(confirm).toHaveBeenCalledWith(
      "You have unsaved changes. Leave this page and discard them?",
    );
    expect(nav.push).not.toHaveBeenCalled();
    expect(title()).toHaveValue("x");
    confirm.mockReturnValue(true);
    save("Cancel");
    expect(nav.push).toHaveBeenCalledWith("/projects");
    confirm.mockRestore();
  });

  it("warns before the tab closes with unsaved changes, and not after a save", async () => {
    act_.create.mockResolvedValue({ ok: true, id: "p-1" });
    renderInApp(<ProjectForm mode="create" />);
    const unloads = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(unloads()).toBe(false);
    type(title(), "x");
    expect(screen.getByRole("status")).toHaveTextContent("You have unsaved changes.");
    expect(unloads()).toBe(true);
    save("Create project");
    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    expect(unloads()).toBe(false);
  });

  it("labels the form in Russian", () => {
    renderInApp(<ProjectForm mode="create" />, "ru");
    expect(screen.getByRole("heading", { level: 1, name: "Новый проект" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Создать проект" })).toBeVisible();
  });
});

describe("ProjectForm, edit", () => {
  const project = projectDetail({ id: "p-9", title: "EcoRoute", isDraft: true });
  const show = () =>
    renderInApp(<ProjectForm mode="edit" projectId="p-9" initial={toFormValues(project)} />);

  it("starts from the stored values and offers Save, Cancel and Delete", () => {
    show();
    expect(title()).toHaveValue("EcoRoute");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete project" })).toBeVisible();
    expect(screen.getByText(/This project is a draft/)).toBeVisible();
  });

  it("publishes a draft from the form: the body carries isDraft false", async () => {
    act_.update.mockResolvedValue({ ok: true, id: "p-9" });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Publish this draft" }));
    save("Save changes");
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/projects/p-9?flash=saved"));
    expect(act_.update).toHaveBeenCalledWith("p-9", expect.objectContaining({ isDraft: false }));
  });

  it("shows the API's 404 for a project that is not the caller's", async () => {
    act_.update.mockResolvedValue({ ok: false, code: "NOT_FOUND" });
    show();
    save("Save changes");
    expect(await screen.findByText(/no longer exists, or it is not yours/)).toBeVisible();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("goes back to the project on Cancel", () => {
    show();
    save("Cancel");
    expect(nav.push).toHaveBeenCalledWith("/projects/p-9");
  });

  it("deletes after a confirmation that names the project, and Cancel has the focus", async () => {
    act_.del.mockResolvedValue({ ok: true });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete “EcoRoute”?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(act_.del).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete project" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/projects?flash=deleted"));
    expect(act_.del).toHaveBeenCalledWith("p-9");
  });

  it("does not warn about unsaved edits once the project is deleted", async () => {
    act_.del.mockResolvedValue({ ok: true });
    show();
    type(title(), "EcoRoute 2");
    const unloads = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(unloads()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete project" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/projects?flash=deleted"));
    expect(unloads()).toBe(false);
  });

  it("does not call a 404 a success: the dialog stays open and says the project is gone", async () => {
    act_.del.mockResolvedValue({ ok: false, code: "NOT_FOUND" });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete project" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "no longer exists, or it is not yours",
    );
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("keeps the dialog open with an error when the delete fails", async () => {
    act_.del.mockResolvedValue({ ok: false, code: "API_UNREACHABLE" });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete project" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Could not delete");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("cancelling the dialog deletes nothing", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = await screen.findByRole("dialog");
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" })));
    expect(act_.del).not.toHaveBeenCalled();
  });
});
