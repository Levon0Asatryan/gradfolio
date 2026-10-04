/**
 * Which pages need a signed-in user (tracker 2.10).
 *
 * Public, so a recruiter can follow a shared link without an account (spec
 * §8d): a profile (`/profile/<id>`), a project (`/projects/<id>`), search,
 * settings (language and theme, stored in the browser), and the auth routes.
 * Everything that shows or edits the signed-in user's own data needs a login.
 * `/` is the personal dashboard, so it is protected too.
 */
const PROTECTED_EXACT = new Set([
  "/",
  "/dashboard",
  "/profile",
  "/profile/edit",
  "/projects",
  "/projects/new",
  "/account",
]);

const PROTECTED_PREFIXES = ["/integrations"];

const PROJECT_EDIT = /^\/projects\/[^/]+\/edit$/;

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isProtectedPath(pathname: string): boolean {
  const path = normalize(pathname);
  if (PROTECTED_EXACT.has(path)) return true;
  if (PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  return PROJECT_EDIT.test(path);
}
