import { isProtectedPath } from "./routePolicy";

/** Only personal, same-origin app paths can be restored after this prompt. */
export function signInReturnTo(value: string | string[] | undefined): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\s]/.test(value)
  )
    return "/";
  const url = new URL(value, "https://gradfolio.invalid");
  return url.origin === "https://gradfolio.invalid" && isProtectedPath(url.pathname)
    ? `${url.pathname}${url.search}`
    : "/";
}
