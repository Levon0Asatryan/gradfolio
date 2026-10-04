/**
 * A URL safe to render as `href` or `src`, or undefined. Only absolute http(s)
 * URLs pass: `data:`, `javascript:` and scheme-relative values are dropped,
 * wherever the URL came from (the API, or the Auth0 profile).
 */
export function safeHttpUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}
