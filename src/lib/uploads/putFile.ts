/**
 * The browser's half of an upload: one `PUT` of the file to the signed URL, with the
 * signed headers and nothing else. The Auth0 token is never here (Q11): the URL is the
 * credential. `XMLHttpRequest`, not `fetch`, because `fetch` reports no upload progress.
 */
export type PutResult =
  | { ok: true }
  /** The bucket answered and said no: the signature expired or does not match (403), or the body is out of range (400). */
  | { ok: false; reason: "rejected"; status: number }
  /**
   * No answer at all (`status` 0): the usual cause is a missing CORS rule for this
   * origin (a Vercel preview that is not listed on the bucket), else the network is down.
   * Retrying cannot help in the first case, so the caller shows a different message.
   */
  | { ok: false; reason: "unreachable" }
  | { ok: false; reason: "aborted" };

export interface PutOptions {
  url: string;
  /** Exactly the headers the ticket returned, whatever they are (the API may sign more, e.g. `x-goog-if-generation-match`). */
  headers: Record<string, string>;
  file: Blob;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export function putFile({
  url,
  headers,
  file,
  onProgress,
  signal,
}: PutOptions): Promise<PutResult> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve({ ok: false, reason: "aborted" });
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () =>
      resolve(
        xhr.status >= 200 && xhr.status < 300
          ? { ok: true }
          : { ok: false, reason: "rejected", status: xhr.status },
      );
    xhr.onerror = () => resolve({ ok: false, reason: "unreachable" });
    xhr.ontimeout = () => resolve({ ok: false, reason: "unreachable" });
    xhr.onabort = () => resolve({ ok: false, reason: "aborted" });
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
