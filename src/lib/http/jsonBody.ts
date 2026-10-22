import "server-only";
import { ApiError } from "@/lib/api/client";

/** Limit bytes while reading, including requests without Content-Length. */
export async function jsonBody(request: Request, maxBytes = 16_384): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "VALIDATION_FAILED", "body required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "VALIDATION_FAILED", "body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "VALIDATION_FAILED", "invalid JSON");
  }
}
