import { previewAppBaseUrl } from "./appBaseUrl";

/**
 * The absolute base for canonical and Open Graph URLs (`metadataBase`): the preview's own
 * host on a preview, `APP_BASE_URL` elsewhere. Anything that is not an http(s) URL is
 * undefined, so a bad variable cannot break the build.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): URL | undefined {
  const raw = previewAppBaseUrl(env) ?? env.APP_BASE_URL?.split(",")[0]?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}
