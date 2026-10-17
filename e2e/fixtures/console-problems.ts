import type { Page } from "@playwright/test";

/** Vercel serves these scripts only on its hosting; inspect other HTTP errors by URL. */
export function consoleProblems(page: Page): string[] {
  const found: string[] = [];
  const hostingOnly = (url: string) => new URL(url).pathname.startsWith("/_vercel/");
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return;
    // Chromium omits the URL here. The response/requestfailed listeners below
    // distinguish the hosting scripts from broken application requests.
    if (message.text().startsWith("Failed to load resource")) return;
    if (/was detected as the Largest Contentful Paint/.test(message.text())) return;
    found.push(message.text());
  });
  page.on("pageerror", (error) => found.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400 && !hostingOnly(response.url())) {
      found.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    // Next cancels superseded server-component prefetches during hydration.
    if (
      request.failure()?.errorText === "net::ERR_ABORTED" &&
      new URL(request.url()).searchParams.has("_rsc")
    )
      return;
    if (!hostingOnly(request.url())) {
      found.push(`${request.failure()?.errorText ?? "request failed"} ${request.url()}`);
    }
  });
  return found;
}
