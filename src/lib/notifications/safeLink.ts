/**
 * The notification's `link` is data from the API. It is followed only when it is an app
 * path (`/projects/<id>`): one slash, no scheme, no `//host`, no backslash tricks.
 */
export function safeAppPath(link: string | null): string | null {
  if (link === null) return null;
  if (!/^\/(?![/\\])[^\s\\]*$/.test(link)) return null;
  if ([...link].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) return null;
  return link;
}
