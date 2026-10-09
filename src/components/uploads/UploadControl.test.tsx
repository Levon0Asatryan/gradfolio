import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderInApp } from "@/testing/render";
import { UploadControl, type SignResult } from "./UploadControl";

const put = vi.hoisted(() => ({ putFile: vi.fn() }));
vi.mock("@/lib/uploads/putFile", () => ({ putFile: put.putFile }));

const SIGNED: SignResult = {
  ok: true,
  uploadUrl: "https://b.storage.googleapis.com/u/1/a.png?sig",
  headers: { "Content-Type": "image/png", "x-goog-content-length-range": "3,3" },
  fileUrl: "https://b.storage.googleapis.com/u/1/a.png",
};

const png = (size = 3) => new File([new Uint8Array(size)], "pic.png", { type: "image/png" });
const choose = (file: File) =>
  fireEvent.change(screen.getByTestId("upload-input"), { target: { files: [file] } });

beforeEach(() => vi.resetAllMocks());

const show = (sign = vi.fn().mockResolvedValue(SIGNED), kind: "image" | "file" = "image") => {
  const onUploaded = vi.fn();
  renderInApp(<UploadControl kind={kind} sign={sign} onUploaded={onUploaded} />);
  return { sign, onUploaded };
};

describe("UploadControl", () => {
  it("has a button, the limits, and a picker that offers only allowed types", () => {
    show();
    expect(screen.getByRole("button", { name: "Upload an image" })).toBeEnabled();
    expect(screen.getByText("PNG, JPEG, WebP or GIF, up to 5 MB.")).toBeVisible();
    expect(screen.getByTestId("upload-input")).toHaveAttribute(
      "accept",
      "image/png,image/jpeg,image/webp,image/gif",
    );
  });

  it("signs with the type and size only, PUTs with the signed headers, then hands over the file URL", async () => {
    put.putFile.mockResolvedValue({ ok: true });
    const { sign, onUploaded } = show();
    const file = png();
    choose(file);
    await waitFor(() => expect(onUploaded).toHaveBeenCalled());
    expect(sign).toHaveBeenCalledWith({ contentType: "image/png", size: 3 });
    expect(put.putFile).toHaveBeenCalledWith(
      expect.objectContaining({
        url: SIGNED.ok && SIGNED.uploadUrl,
        headers: SIGNED.ok && SIGNED.headers,
        file,
      }),
    );
    expect(onUploaded).toHaveBeenCalledWith("https://b.storage.googleapis.com/u/1/a.png", {
      name: "pic.png",
      type: "image/png",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Uploaded pic.png");
  });

  it("shows determinate progress with a name, and Cancel stops the upload", async () => {
    let finish: (v: unknown) => void = () => {};
    put.putFile.mockImplementation(
      ({ onProgress, signal }: { onProgress: (f: number) => void; signal: AbortSignal }) =>
        new Promise((resolve) => {
          onProgress(0.4);
          finish = resolve;
          signal.addEventListener("abort", () => resolve({ ok: false, reason: "aborted" }));
        }),
    );
    const { onUploaded } = show();
    choose(png());
    const bar = await screen.findByRole("progressbar", { name: "Upload progress" });
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "40"));
    expect(screen.getByRole("button", { name: "Upload an image" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }));
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
    expect(onUploaded).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
    void finish;
  });

  it.each([
    [
      "a type that is not allowed",
      new File(["x"], "a.svg", { type: "image/svg+xml" }),
      /Only images are allowed/,
    ],
    ["an empty file", new File([], "a.png", { type: "image/png" }), /This file is empty/],
  ])("refuses %s before anything is sent", async (_n, file, message) => {
    const { sign } = show();
    choose(file);
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(sign).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("refuses a file over 5 MB with the limit in the message", async () => {
    const { sign } = show();
    choose(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("at most 5 MB");
    expect(sign).not.toHaveBeenCalled();
  });

  it("takes a PDF only where a file is allowed", async () => {
    const pdf = new File(["x"], "r.pdf", { type: "application/pdf" });
    const image = show();
    choose(pdf);
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(image.sign).not.toHaveBeenCalled();
  });

  it("offers PDF and a 20 MB limit on a file control", async () => {
    put.putFile.mockResolvedValue({ ok: true });
    const { sign } = show(undefined, "file");
    expect(screen.getByText(/PDF up to 20 MB/)).toBeVisible();
    choose(new File(["abc"], "r.pdf", { type: "application/pdf" }));
    await waitFor(() =>
      expect(sign).toHaveBeenCalledWith({ contentType: "application/pdf", size: 3 }),
    );
  });

  it("a failed signing is an error with Retry, and nothing is PUT", async () => {
    const sign = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, code: "API_UNREACHABLE" })
      .mockResolvedValue(SIGNED);
    put.putFile.mockResolvedValue({ ok: true });
    const { onUploaded } = show(sign);
    choose(png());
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not start the upload");
    expect(put.putFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(onUploaded).toHaveBeenCalled());
  });

  it("a thrown signing is the same error", async () => {
    show(vi.fn().mockRejectedValue(new Error("network")));
    choose(png());
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not start the upload");
  });

  it("LIMIT_REACHED and STORAGE_UNAVAILABLE are final: no Retry", async () => {
    show(vi.fn().mockResolvedValue({ ok: false, code: "LIMIT_REACHED" }));
    choose(png());
    expect(await screen.findByRole("alert")).toHaveTextContent("limit of uploaded files");
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("a PUT with no answer says uploads are unavailable here and offers no Retry (missing CORS)", async () => {
    put.putFile.mockResolvedValue({ ok: false, reason: "unreachable" });
    const { onUploaded } = show();
    choose(png());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Uploads are not available on this site",
    );
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("a PUT the bucket refuses can be retried and then succeeds", async () => {
    put.putFile
      .mockResolvedValueOnce({ ok: false, reason: "rejected", status: 403 })
      .mockResolvedValueOnce({ ok: true });
    const { onUploaded } = show();
    choose(png());
    expect(await screen.findByRole("alert")).toHaveTextContent("refused");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
  });

  it("speaks Russian", () => {
    renderInApp(<UploadControl kind="image" sign={vi.fn()} onUploaded={vi.fn()} />, "ru");
    expect(screen.getByRole("button", { name: "Загрузить изображение" })).toBeVisible();
  });
});
