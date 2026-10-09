/** The API's page size cap (NOTIFICATIONS_PAGE_MAX) and its cursor length bound. */
const MAX_LIMIT = 50;
const MAX_CURSOR = 600;

export interface ListParams {
  limit?: number;
  cursor?: string;
}

/** Checks what the browser sent before it is forwarded; `null` means refuse with 400. */
export function parseListParams(params: URLSearchParams): ListParams | null {
  const out: ListParams = {};
  const limit = params.get("limit");
  if (limit !== null) {
    if (!/^\d{1,3}$/.test(limit)) return null;
    const n = Number(limit);
    if (n < 1 || n > MAX_LIMIT) return null;
    out.limit = n;
  }
  const cursor = params.get("cursor");
  if (cursor !== null) {
    if (cursor.length < 1 || cursor.length > MAX_CURSOR) return null;
    out.cursor = cursor;
  }
  return out;
}
