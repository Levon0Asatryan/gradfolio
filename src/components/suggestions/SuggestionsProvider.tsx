"use client";

import {
  type FC,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { SuggestionItem } from "@/lib/api/types";

/** How often the list is read while the tab is visible, like the bell's unread count. */
const SUGGESTIONS_POLL_MS = 60_000;
const MIN_GAP_MS = 2_000;

export type SuggestionsStatus = "idle" | "loading" | "ready" | "error";

export interface SuggestionsState {
  /** The open suggestions the inbox lists; `null` until the first read succeeds. */
  items: SuggestionItem[] | null;
  /** The API has further pages than the 100 read. */
  more: boolean;
  status: SuggestionsStatus;
  /** The API's code for the last failed read, while `status` is `error`. */
  error: string | null;
  /** Read the list now (the Retry button, a refresh that opened new ones). */
  reload: () => Promise<void>;
  /** Drop a suggestion the student answered (or that the API says is gone). */
  remove: (id: string) => void;
}

const NONE: SuggestionsState = {
  items: null,
  more: false,
  status: "idle",
  error: null,
  reload: async () => {},
  remove: () => {},
};

const Context = createContext<SuggestionsState>(NONE);

/** The shared list: the inbox, the strips on the profile and the navigation count read this one. */
export const useSuggestions = (): SuggestionsState => useContext(Context);

/** How many open suggestions the inbox lists; `null` until the first read (or with no provider). */
export function useSuggestionCount(): number | null {
  return useContext(Context).items?.length ?? null;
}

async function read(): Promise<
  { ok: true; items: SuggestionItem[]; more: boolean } | { ok: false; code: string }
> {
  try {
    const response = await fetch("/api/suggestions", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const body: unknown = await response.json().catch(() => undefined);
    if (response.ok && typeof body === "object" && body !== null) {
      const b = body as { items?: SuggestionItem[]; more?: boolean };
      if (Array.isArray(b.items)) return { ok: true, items: b.items, more: b.more === true };
    }
    const code = (body as { code?: unknown } | undefined)?.code;
    return { ok: false, code: typeof code === "string" ? code : `HTTP_${response.status}` };
  } catch {
    return { ok: false, code: "NETWORK" };
  }
}

/**
 * One source of truth for the open suggestions. Read on mount, on navigation, on focus and every
 * `pollMs` while the tab is visible. Mounted for a signed-in user only. Nothing here changes a
 * suggestion: answering is the cards' action, and `remove` only forgets what was answered.
 */
export const SuggestionsProvider: FC<{ children: ReactNode; pollMs?: number }> = ({
  children,
  pollMs = SUGGESTIONS_POLL_MS,
}) => {
  const pathname = usePathname();
  const [items, setItems] = useState<SuggestionItem[] | null>(null);
  const [more, setMore] = useState(false);
  const [status, setStatus] = useState<SuggestionsStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  // A later read wins; so does a removal: an answer read before it must not bring the card back.
  const generation = useRef(0);
  const lastAt = useRef(0);
  const signedOut = useRef(false);
  const loaded = useRef(false);

  const reload = useCallback(async () => {
    if (signedOut.current) return;
    lastAt.current = Date.now();
    const mine = ++generation.current;
    if (!loaded.current) setStatus("loading");
    const result = await read();
    if (mine !== generation.current) return;
    if (result.ok) {
      loaded.current = true;
      setItems(result.items);
      setMore(result.more);
      setError(null);
      setStatus("ready");
      return;
    }
    if (result.code === "UNAUTHENTICATED") signedOut.current = true;
    // A failed poll keeps what was read; only a list never read is an error.
    if (!loaded.current || signedOut.current) {
      setError(result.code);
      setStatus("error");
    }
  }, []);

  const remove = useCallback((id: string) => {
    generation.current++;
    setItems((current) => current?.filter((i) => i.id !== id) ?? current);
  }, []);

  useEffect(() => {
    void reload();
  }, [pathname, reload]);

  useEffect(() => {
    const due = () => {
      if (document.visibilityState === "visible" && Date.now() - lastAt.current >= MIN_GAP_MS) {
        void reload();
      }
    };
    window.addEventListener("focus", due);
    document.addEventListener("visibilitychange", due);
    const timer =
      pollMs > 0
        ? setInterval(() => {
            if (document.visibilityState === "visible") void reload();
          }, pollMs)
        : undefined;
    return () => {
      window.removeEventListener("focus", due);
      document.removeEventListener("visibilitychange", due);
      if (timer !== undefined) clearInterval(timer);
    };
  }, [pollMs, reload]);

  const value = useMemo(
    () => ({ items, more, status, error, reload, remove }),
    [items, more, status, error, reload, remove],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
};
