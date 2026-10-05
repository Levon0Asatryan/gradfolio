"use client";

import { useEffect } from "react";

/**
 * While `dirty`, ask before anything throws the edit away: closing or reloading
 * the tab (`beforeunload`) and following a link inside the app. Next's `<Link>`
 * navigates without unloading the document, so `beforeunload` alone misses the
 * sidebar and every other in-app link; the click is caught on the way down.
 *
 * Not covered: the browser's Back button (a `popstate` cannot be cancelled).
 */
export function useUnsavedGuard(dirty: boolean, leavePrompt: string): void {
  useEffect(() => {
    if (!dirty) return;

    const onUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      const here = window.location;
      // A hash on this page, or a link to this very page, drops nothing.
      if (
        url.origin === here.origin &&
        url.pathname === here.pathname &&
        url.search === here.search
      ) {
        return;
      }
      if (!window.confirm(leavePrompt)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onUnload);
    // Capture phase: runs before Next's Link handler, which respects defaultPrevented.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, leavePrompt]);
}
