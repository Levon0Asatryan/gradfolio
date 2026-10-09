import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { putFile } from "./putFile";

/** A scriptable XMLHttpRequest: the test decides how the request ends. */
class FakeXhr {
  static last: FakeXhr;
  method = "";
  url = "";
  headers: Record<string, string> = {};
  body: unknown;
  status = 0;
  upload: { onprogress?: (e: unknown) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  ontimeout?: () => void;
  onabort?: () => void;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
}

beforeEach(() => vi.stubGlobal("XMLHttpRequest", FakeXhr));
afterEach(() => vi.unstubAllGlobals());

const blob = new Blob(["x"], { type: "image/png" });
const start = (extra = {}) =>
  putFile({
    url: "https://bucket.storage.googleapis.com/u/1/a.png?sig=1",
    headers: { "Content-Type": "image/png", "x-goog-content-length-range": "1,1" },
    file: blob,
    ...extra,
  });

describe("putFile", () => {
  it("PUTs the file to the signed URL with exactly the signed headers, and no Authorization", async () => {
    const result = start();
    const xhr = FakeXhr.last;
    expect(xhr.method).toBe("PUT");
    expect(xhr.url).toContain("storage.googleapis.com");
    expect(xhr.headers).toEqual({
      "Content-Type": "image/png",
      "x-goog-content-length-range": "1,1",
    });
    expect(xhr.body).toBe(blob);
    xhr.status = 200;
    xhr.onload?.();
    expect(await result).toEqual({ ok: true });
  });

  it("sends every header of the ticket, even ones it has never heard of, and no others", async () => {
    const result = putFile({
      url: "https://b.storage.googleapis.com/u/1/a.png?sig=1",
      headers: {
        "Content-Type": "image/png",
        "x-goog-content-length-range": "1,1",
        "x-goog-if-generation-match": "0",
        "x-goog-future-header": "v",
      },
      file: blob,
    });
    expect(FakeXhr.last.headers).toEqual({
      "Content-Type": "image/png",
      "x-goog-content-length-range": "1,1",
      "x-goog-if-generation-match": "0",
      "x-goog-future-header": "v",
    });
    FakeXhr.last.status = 200;
    FakeXhr.last.onload?.();
    await result;
  });

  it("reports progress as a fraction", async () => {
    const seen: number[] = [];
    const result = start({ onProgress: (f: number) => seen.push(f) });
    FakeXhr.last.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    FakeXhr.last.upload.onprogress?.({ lengthComputable: false, loaded: 1, total: 0 });
    FakeXhr.last.status = 200;
    FakeXhr.last.onload?.();
    await result;
    expect(seen).toEqual([0.25]);
  });

  it.each([400, 403])("a %i from the bucket is 'rejected' with its status", async (status) => {
    const result = start();
    FakeXhr.last.status = status;
    FakeXhr.last.onload?.();
    expect(await result).toEqual({ ok: false, reason: "rejected", status });
  });

  it("no answer at all (status 0, the missing-CORS case) is 'unreachable', not 'rejected'", async () => {
    const result = start();
    FakeXhr.last.status = 0;
    FakeXhr.last.onerror?.();
    expect(await result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("a timeout is 'unreachable'", async () => {
    const result = start();
    FakeXhr.last.ontimeout?.();
    expect(await result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("aborts on the caller's signal, and not at all if it is already aborted", async () => {
    const controller = new AbortController();
    const result = start({ signal: controller.signal });
    controller.abort();
    expect(await result).toEqual({ ok: false, reason: "aborted" });
    const before = FakeXhr.last;
    expect(await start({ signal: AbortSignal.abort() })).toEqual({ ok: false, reason: "aborted" });
    expect(FakeXhr.last).toBe(before);
  });
});
