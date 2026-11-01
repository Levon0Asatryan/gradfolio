import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import type { LinkedinPreview } from "@/lib/api/types";

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  preview: vi.fn(),
  confirm: vi.fn(),
  put: vi.fn(),
}));
vi.mock("@/lib/linkedin/actions", () => ({
  startLinkedinUploadAction: mocks.start,
  previewLinkedinAction: mocks.preview,
  confirmLinkedinAction: mocks.confirm,
}));
vi.mock("@/lib/uploads/putFile", () => ({ putFile: mocks.put }));

const { LinkedinImportModal } = await import("./LinkedinImportModal");

const base: LinkedinPreview = {
  experience: [
    {
      status: "new",
      fields: {
        title: "Placeholder Engineer",
        organization: "Example Co",
        start: "2020-01",
        end: null,
        summary: "",
        achievements: [],
        skills: [],
      },
      problems: [],
    },
    {
      status: "duplicate",
      fields: {
        title: "Already Here",
        organization: "Example Co",
        start: "2019-01",
        end: null,
        summary: "",
      },
      problems: [],
    },
  ],
  education: [
    {
      status: "invalid",
      fields: {
        institution: "Placeholder Institute",
        degree: "BSc",
        startYear: 2015,
        endYear: null,
      },
      problems: [{ field: "field", code: "REQUIRED" }],
    },
  ],
  certifications: [],
  skills: [
    { name: "Faking", status: "new" },
    { name: "Mocking", status: "duplicate" },
  ],
  skippedColumns: [{ file: "Positions.csv", column: "Location" }],
  missingFiles: [],
  skippedFileCount: 3,
  extensions: {},
};

const zip = (size = 1000, name = "export.zip") =>
  new File([new Uint8Array(size)], name, { type: "application/zip" });

function renderModal() {
  const onClose = vi.fn();
  const onImported = vi.fn();
  renderInApp(<LinkedinImportModal open onClose={onClose} onImported={onImported} />, "en");
  return { onClose, onImported };
}

async function toReview(preview = base) {
  mocks.start.mockResolvedValue({
    ok: true,
    uploadId: "6f1f0c1e-0d4f-4c53-9f0a-0c9a3b1d2e3f",
    uploadUrl: "https://storage.googleapis.com/b/k",
    headers: {},
  });
  mocks.put.mockResolvedValue({ ok: true });
  mocks.preview.mockResolvedValue({ ok: true, preview });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  fireEvent.change(input, { target: { files: [zip()] } });
  fireEvent.click(screen.getByRole("button", { name: "Upload and read" }));
  await screen.findByRole("heading", { name: "Choose what to add" });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("LinkedIn import wizard", () => {
  it("starts with the guide and moves focus to each step's heading", async () => {
    renderModal();
    const heading = screen.getByRole("heading", { name: "Get your LinkedIn data file" });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText("Upload the ZIP as it is. Do not unzip it.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const next = await screen.findByRole("heading", { name: "Upload the ZIP file" });
    await waitFor(() => expect(next).toHaveFocus());
  });

  it("rejects an empty, a non-ZIP and an oversize file before any request", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    for (const [file, message] of [
      [zip(0), "This file is empty."],
      [zip(10, "notes.txt"), "Choose the ZIP file that LinkedIn sent you."],
    ] as const) {
      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByRole("alert")).toHaveTextContent(message);
      expect(screen.getByRole("button", { name: "Upload and read" })).toBeDisabled();
    }
    const big = zip(1);
    Object.defineProperty(big, "size", { value: 100_000_001 });
    fireEvent.change(input, { target: { files: [big] } });
    expect(screen.getByRole("alert")).toHaveTextContent("too big");
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("ticks only new items, shows duplicates disabled and nothing is saved yet", async () => {
    renderModal();
    await toReview();
    expect(
      screen.getByRole("checkbox", { name: "Placeholder Engineer · Example Co" }),
    ).toBeChecked();
    const dupe = screen.getByRole("checkbox", { name: "Already Here · Example Co" });
    expect(dupe).toBeDisabled();
    expect(dupe).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Mocking/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "BSc · Placeholder Institute" })).toBeDisabled();
    expect(screen.getByText(/Positions\.csv: columns left out: Location/)).toBeInTheDocument();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("will not confirm with nothing selected", async () => {
    renderModal();
    await toReview();
    fireEvent.click(screen.getByRole("checkbox", { name: "Placeholder Engineer · Example Co" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Faking" }));
    expect(screen.getByRole("button", { name: "Add selected" })).toBeDisabled();
    expect(screen.getByText("Select at least one item to add.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add selected" }));
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("lets a broken education item be fixed, then sends exactly what is ticked", async () => {
    renderModal();
    await toReview();
    fireEvent.click(screen.getByRole("button", { name: /Edit: BSc/ }));
    fireEvent.change(screen.getByRole("textbox", { name: /Field of study/i }), {
      target: { value: "Placeholder Studies" },
    });
    const box = screen.getByRole("checkbox", { name: "BSc · Placeholder Institute" });
    expect(box).toBeEnabled();
    fireEvent.click(box);
    fireEvent.click(screen.getByRole("checkbox", { name: "Faking" })); // untick the skill
    mocks.confirm.mockResolvedValue({
      ok: true,
      result: {
        added: { experience: 1, education: 1, certifications: 0, skills: 0 },
        skipped: { experience: 0, education: 0, certifications: 0, skills: 0 },
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add selected" }));
    await screen.findByRole("heading", { name: "Your profile is updated" });
    const sent = mocks.confirm.mock.calls[0]![0];
    expect(sent.experience).toHaveLength(1);
    expect(sent.education).toEqual([
      expect.objectContaining({
        institution: "Placeholder Institute",
        field: "Placeholder Studies",
      }),
    ]);
    expect(sent.skills).toEqual([]);
    expect(JSON.stringify(sent)).not.toContain("Already Here");
  });

  it("sends confirm once on a double click", async () => {
    renderModal();
    await toReview();
    let resolve!: (v: unknown) => void;
    mocks.confirm.mockReturnValue(new Promise((r) => (resolve = r)));
    const add = screen.getByRole("button", { name: "Add selected" });
    fireEvent.click(add);
    fireEvent.click(add);
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    resolve({
      ok: true,
      result: {
        added: { experience: 1, education: 0, certifications: 0, skills: 1 },
        skipped: { experience: 0, education: 0, certifications: 0, skills: 0 },
      },
    });
    await screen.findByRole("heading", { name: "Your profile is updated" });
  });

  it("shows the done counts and reloads the page behind when closed", async () => {
    const { onClose, onImported } = renderModal();
    await toReview();
    mocks.confirm.mockResolvedValue({
      ok: true,
      result: {
        added: { experience: 1, education: 0, certifications: 0, skills: 1 },
        skipped: { experience: 0, education: 0, certifications: 0, skills: 0 },
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add selected" }));
    await screen.findByRole("heading", { name: "Your profile is updated" });
    const added = screen.getByText("Added").parentElement!;
    expect(within(added).getAllByRole("listitem")[0]).toHaveTextContent("Experience1");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onImported).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("maps an API code to text and keeps the file for another try", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    mocks.start.mockResolvedValue({
      ok: true,
      uploadId: "6f1f0c1e-0d4f-4c53-9f0a-0c9a3b1d2e3f",
      uploadUrl: "https://storage.googleapis.com/b/k",
      headers: {},
    });
    mocks.put.mockResolvedValue({ ok: true });
    mocks.preview.mockResolvedValue({ ok: false, code: "IMPORT_LANGUAGE_UNRECOGNISED" });
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [zip()] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload and read" }));
    expect(await screen.findByText(/not in English/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload and read" })).toBeEnabled();
  });

  it("explains a rate limit with the wait", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    mocks.start.mockResolvedValue({ ok: false, code: "RATE_LIMITED", retryAfter: 42 });
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [zip()] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload and read" }));
    expect(await screen.findByText(/Try again in 42 seconds/)).toBeInTheDocument();
  });

  it("shows a storage refusal and an unreachable bucket differently", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    mocks.start.mockResolvedValue({
      ok: true,
      uploadId: "6f1f0c1e-0d4f-4c53-9f0a-0c9a3b1d2e3f",
      uploadUrl: "https://storage.googleapis.com/b/k",
      headers: {},
    });
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [zip()] },
    });
    mocks.put.mockResolvedValue({ ok: false, reason: "unreachable" });
    fireEvent.click(screen.getByRole("button", { name: "Upload and read" }));
    expect(await screen.findByText(/could not be sent/)).toBeInTheDocument();
    mocks.put.mockResolvedValue({ ok: false, reason: "rejected", status: 403 });
    fireEvent.click(screen.getByRole("button", { name: "Upload and read" }));
    expect(await screen.findByText(/refused or has expired/)).toBeInTheDocument();
    expect(mocks.preview).not.toHaveBeenCalled();
  });

  it("asks before closing a proposal that is on screen", async () => {
    const { onClose } = renderModal();
    await toReview();
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps nothing in browser storage", async () => {
    const set = vi.spyOn(Storage.prototype, "setItem");
    renderModal();
    await toReview();
    expect(set).not.toHaveBeenCalled();
  });

  it("drops a preview that arrives after the dialog was closed and reopened", async () => {
    let setOpen: (open: boolean) => void = () => {};
    const Harness = () => {
      const [open, set] = useState(true);
      setOpen = set;
      return <LinkedinImportModal open={open} onClose={() => set(false)} onImported={vi.fn()} />;
    };
    renderInApp(<Harness />, "en");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    mocks.start.mockResolvedValue({
      ok: true,
      uploadId: "6f1f0c1e-0d4f-4c53-9f0a-0c9a3b1d2e3f",
      uploadUrl: "https://storage.googleapis.com/b/k",
      headers: {},
    });
    mocks.put.mockResolvedValue({ ok: true });
    let answer!: (v: unknown) => void;
    mocks.preview.mockReturnValue(new Promise((r) => (answer = r)));
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="file"]')!, {
      target: { files: [zip()] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload and read" }));
    await waitFor(() => expect(mocks.preview).toHaveBeenCalled());
    act(() => setOpen(false));
    act(() => setOpen(true));
    await act(async () => answer({ ok: true, preview: base }));
    expect(
      await screen.findByRole("heading", { name: "Get your LinkedIn data file" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose what to add" })).toBeNull();
  });

  it("freezes the review while the confirmation is in flight", async () => {
    renderModal();
    await toReview();
    mocks.confirm.mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "Add selected" }));
    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: "Placeholder Engineer · Example Co" }),
      ).toBeDisabled(),
    );
    expect(screen.getByRole("checkbox", { name: "Faking" })).toBeDisabled();
  });
});
