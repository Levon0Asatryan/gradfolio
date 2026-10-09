import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import type { ProjectAttachment } from "@/lib/api/types";
import { AttachmentsEditor, failedKey } from "./AttachmentsEditor";

const nav = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));
const act_ = vi.hoisted(() => ({
  add: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  reorder: vi.fn(),
  sign: vi.fn(),
}));
vi.mock("@/lib/projects/attachmentActions", () => ({
  addAttachmentAction: act_.add,
  updateAttachmentAction: act_.update,
  deleteAttachmentAction: act_.del,
  reorderAttachmentsAction: act_.reorder,
}));
const put = vi.hoisted(() => ({ putFile: vi.fn() }));
vi.mock("@/lib/uploads/putFile", () => ({ putFile: put.putFile }));
vi.mock("@/lib/uploads/actions", () => ({ signUploadAction: act_.sign }));

const att = (id: string, over: Partial<ProjectAttachment> = {}): ProjectAttachment => ({
  id,
  type: "link",
  url: `https://x.test/${id}`,
  title: `Item ${id}`,
  thumbnailUrl: null,
  embedUrl: null,
  ...over,
});
const three = [att("a"), att("b"), att("c")];

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
});

const live = (initial = three) =>
  renderInApp(<AttachmentsEditor projectId="p1" initial={initial} />);
const names = () => screen.queryAllByRole("listitem", { hidden: true }).map((li) => li.textContent);

describe("AttachmentsEditor, live", () => {
  it("lists the attachments with type, name and host, and buttons that name the item", () => {
    live();
    expect(screen.getByRole("heading", { level: 2, name: "Media and evidence" })).toBeVisible();
    expect(names()).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Move Item a up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Item c down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit Item b" })).toBeEnabled();
  });

  it("says there are no attachments yet", () => {
    live([]);
    expect(screen.getByText("No attachments yet.")).toBeVisible();
  });

  it("moves an item down with the server's answer, and announces the new position", async () => {
    act_.reorder.mockResolvedValue({ ok: true, value: [att("b"), att("a"), att("c")] });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Move Item a down" }));
    await waitFor(() => expect(names()[0]).toContain("Item b"));
    expect(act_.reorder).toHaveBeenCalledWith("p1", ["b", "a", "c"]);
    expect(screen.getByText("Moved to position 2 of 3.")).toBeInTheDocument();
  });

  it("keeps the old order and reloads when the API says the list is stale", async () => {
    act_.reorder.mockResolvedValue({ ok: false, code: "ORDER_STALE" });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Move Item a down" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The list changed elsewhere");
    expect(names()[0]).toContain("Item a");
    expect(nav.refresh).toHaveBeenCalled();
  });

  it("adds a link through the dialog: checked, sent, then listed", async () => {
    act_.add.mockResolvedValue({ ok: true, value: att("d", { title: "Docs" }) });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Address (https://)"), {
      target: { value: "http://x.test" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(
      await within(dialog).findByText("Enter a full http:// or https:// address."),
    ).toBeVisible();
    expect(act_.add).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText("Address (https://)"), {
      target: { value: "https://docs.test" },
    });
    fireEvent.change(within(dialog).getByLabelText("Title (optional)"), {
      target: { value: "Docs" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() => expect(names()).toHaveLength(4));
    expect(act_.add).toHaveBeenCalledWith("p1", {
      type: "link",
      url: "https://docs.test",
      title: "Docs",
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the dialog open with the API's reason when an add is refused", async () => {
    act_.add.mockResolvedValue({ ok: false, code: "FILE_IN_USE" });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Address (https://)"), {
      target: { value: "https://docs.test" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "This file was not accepted",
    );
    expect(names()).toHaveLength(3);
  });

  it("refuses a video that is not on YouTube or Vimeo before sending it", async () => {
    live();
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: /Video/ }));
    fireEvent.change(within(dialog).getByLabelText("Address (https://)"), {
      target: { value: "https://evil.test/v" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await within(dialog).findByText("Use a link to YouTube or Vimeo.")).toBeVisible();
    expect(act_.add).not.toHaveBeenCalled();
  });

  it("offers an upload for an image attachment on a saved project, signed for that project", async () => {
    act_.sign.mockResolvedValue({ ok: false, code: "STORAGE_UNAVAILABLE" });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /Upload/ })).toBeNull();
    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Image" }));
    expect(within(dialog).getByRole("button", { name: "Upload an image" })).toBeVisible();
    fireEvent.change(within(dialog).getByTestId("upload-input"), {
      target: { files: [new File([new Uint8Array(3)], "a.png", { type: "image/png" })] },
    });
    // The storage is off (503 STORAGE_UNAVAILABLE): said plainly, the URL field still works.
    expect(await within(dialog).findByText(/Uploads are not available on this site/)).toBeVisible();
    expect(act_.sign).toHaveBeenCalledWith({
      contentType: "image/png",
      size: 3,
      purpose: "attachment",
      projectId: "p1",
    });
    expect(within(dialog).getByLabelText("Address (https://)")).toBeEnabled();
  });

  it("edits a title and url, with the type fixed", async () => {
    act_.update.mockResolvedValue({ ok: true, value: att("b", { title: "New" }) });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Edit Item b" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("combobox", { name: "Type" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    fireEvent.change(within(dialog).getByLabelText("Title (optional)"), {
      target: { value: "New" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(names()[1]).toContain("New"));
    expect(act_.update).toHaveBeenCalledWith("p1", "b", expect.objectContaining({ title: "New" }));
  });

  it("removes only after a confirmation that names it, and not when cancelled", async () => {
    act_.del.mockResolvedValue({ ok: true, value: true });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Remove Item b" }));
    const dialog = await screen.findByRole("dialog", { name: "Remove “Item b”?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(act_.del).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove Item b" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete project" }),
    );
    await waitFor(() => expect(names()).toHaveLength(2));
    expect(act_.del).toHaveBeenCalledWith("p1", "b");
  });

  it("keeps the item and says so when a removal fails", async () => {
    act_.del.mockResolvedValue({ ok: false, code: "API_UNREACHABLE" });
    live();
    fireEvent.click(screen.getByRole("button", { name: "Remove Item b" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete project" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save the change");
    expect(names()).toHaveLength(3);
  });

  it("disables Add at the limit of 20", () => {
    live(Array.from({ length: 20 }, (_, i) => att(`i${i}`)));
    expect(screen.getByRole("button", { name: "Add attachment" })).toBeDisabled();
  });

  it("offers attachments a create could not save, and adds one again", async () => {
    sessionStorage.setItem(
      failedKey("p1"),
      JSON.stringify([
        { type: "link", url: "https://lost.test", title: "Lost", code: "INVALID_FILE" },
      ]),
    );
    act_.add.mockResolvedValue({ ok: true, value: att("z", { title: "Lost" }) });
    live();
    expect(
      await screen.findByText(/1 attachment\(s\) were not saved with the project/),
    ).toBeVisible();
    expect(sessionStorage.getItem(failedKey("p1"))).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add again" }));
    await waitFor(() => expect(names()).toHaveLength(4));
    expect(act_.add).toHaveBeenCalledWith("p1", {
      type: "link",
      url: "https://lost.test",
      title: "Lost",
    });
    expect(screen.queryByText(/were not saved with the project/)).toBeNull();
  });

  it("ignores stored failures that are not attachments", async () => {
    sessionStorage.setItem(failedKey("p1"), JSON.stringify([{ nope: 1 }, "x"]));
    live();
    await waitFor(() => expect(sessionStorage.getItem(failedKey("p1"))).toBeNull());
    expect(screen.queryByText(/were not saved with the project/)).toBeNull();
  });
});

describe("AttachmentsEditor, draft (a new project)", () => {
  it("holds items in the form, and reorders and removes locally", async () => {
    const onChange = vi.fn();
    const draft = [
      { type: "link" as const, url: "https://a.test", title: "A" },
      { type: "link" as const, url: "https://b.test", title: "B" },
    ];
    renderInApp(<AttachmentsEditor draft={draft} onDraftChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Move A down" }));
    expect(onChange).toHaveBeenLastCalledWith([draft[1], draft[0]]);
    fireEvent.click(screen.getByRole("button", { name: "Remove B" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete project" }),
    );
    expect(onChange).toHaveBeenLastCalledWith([draft[0]]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(act_.add).not.toHaveBeenCalled();
  });

  it("keeps Add disabled while a file uploads, so the address cannot change under it", async () => {
    act_.sign.mockResolvedValue({
      ok: true,
      uploadUrl: "https://storage.googleapis.com/b/u/1/a.png?sig",
      headers: {},
      fileUrl: "https://storage.googleapis.com/b/u/1/a.png",
    });
    let finish: (v: unknown) => void = () => {};
    put.putFile.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const onChange = vi.fn();
    renderInApp(<AttachmentsEditor draft={[]} onDraftChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Image" }));
    fireEvent.change(within(dialog).getByTestId("upload-input"), {
      target: { files: [new File([new Uint8Array(3)], "a.png", { type: "image/png" })] },
    });
    const add = within(dialog).getByRole("button", { name: "Add" });
    await waitFor(() => expect(add).toBeDisabled());
    await act(async () => finish({ ok: true }));
    await waitFor(() => expect(add).toBeEnabled());
    fireEvent.click(add);
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ url: "https://storage.googleapis.com/b/u/1/a.png" }),
      ]),
    );
  });

  it("switching the type mid-upload cancels the upload, so its URL never lands in the new type", async () => {
    act_.sign.mockResolvedValue({
      ok: true,
      uploadUrl: "https://storage.googleapis.com/b/u/1/a.png?sig",
      headers: {},
      fileUrl: "https://storage.googleapis.com/b/u/1/a.png",
    });
    let signal: AbortSignal | undefined;
    let finish: (v: unknown) => void = () => {};
    put.putFile.mockImplementation((o: { signal: AbortSignal }) => {
      signal = o.signal;
      return new Promise((resolve) => (finish = resolve));
    });
    renderInApp(<AttachmentsEditor draft={[]} onDraftChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Image" }));
    fireEvent.change(within(dialog).getByTestId("upload-input"), {
      target: { files: [new File([new Uint8Array(3)], "a.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled());
    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Link" }));
    expect(signal?.aborted).toBe(true);
    expect(within(dialog).getByRole("button", { name: "Add" })).toBeEnabled();
    await act(async () => finish({ ok: true }));
    expect(within(dialog).getByLabelText("Address (https://)")).toHaveValue("");
  });

  it("offers the upload for an image or a PDF before the project exists, signed without a project id", async () => {
    act_.sign.mockResolvedValue({ ok: false, code: "STORAGE_UNAVAILABLE" });
    renderInApp(<AttachmentsEditor draft={[]} onDraftChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /Upload/ })).toBeNull();
    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Image" }));
    expect(within(dialog).getByRole("button", { name: "Upload an image" })).toBeVisible();
    fireEvent.change(within(dialog).getByTestId("upload-input"), {
      target: { files: [new File([new Uint8Array(3)], "a.png", { type: "image/png" })] },
    });
    await within(dialog).findByText(/Uploads are not available on this site/);
    expect(act_.sign).toHaveBeenCalledWith({
      contentType: "image/png",
      size: 3,
      purpose: "attachment",
    });
  });

  it("adds a link to the draft without calling the API", async () => {
    const onChange = vi.fn();
    renderInApp(<AttachmentsEditor draft={[]} onDraftChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Add attachment" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Address (https://)"), {
      target: { value: "https://a.test" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([{ type: "link", url: "https://a.test", title: "" }]),
    );
    expect(act_.add).not.toHaveBeenCalled();
  });
});
