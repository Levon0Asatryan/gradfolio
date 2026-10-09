import { getUnreadNotificationCount } from "@/lib/api/client";
import { failure, json } from "@/lib/notifications/http";

/** The bell's badge; polled about once a minute while the tab is visible. */
export async function GET() {
  try {
    return json(await getUnreadNotificationCount());
  } catch (error) {
    return failure(error);
  }
}
