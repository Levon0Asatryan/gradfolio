import { listSuggestions } from "@/lib/api/client";
import { isInboxItem } from "@/lib/integrations/suggestionKinds";
import { failure, json } from "@/lib/notifications/http";

/**
 * The open suggestions the inbox lists, for the browser's poll (about once a minute while the
 * tab is visible). `limit=100` is the API's maximum (T28); `more` says there are further pages.
 */
export async function GET() {
  try {
    const page = await listSuggestions({ limit: 100 });
    return json({ items: page.items.filter(isInboxItem), more: page.nextCursor !== null });
  } catch (error) {
    return failure(error);
  }
}
