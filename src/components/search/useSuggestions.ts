"use client";

import { useEffect, useState } from "react";
import { MAX_SUGGEST_LENGTH, MIN_SUGGEST_LENGTH, cleanQuery } from "@/lib/discovery/query";
import type { Suggestions } from "@/lib/api/types";

const DEBOUNCE_MS = 200;

export type SuggestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; query: string; data: Suggestions }
  | { status: "error" };

/**
 * Suggestions for `text`, from the same-origin route (the browser never calls the API, Q11).
 * Debounced; a newer query aborts the older request, and an answer for a query that is no
 * longer the current one is dropped, so a slow answer cannot overwrite a newer one.
 */
export function useSuggestions(text: string, enabled: boolean): SuggestState {
  const [state, setState] = useState<SuggestState>({ status: "idle" });

  useEffect(() => {
    const query = Array.from(cleanQuery(text)).slice(0, MAX_SUGGEST_LENGTH).join("").trim();
    if (!enabled || Array.from(query).length < MIN_SUGGEST_LENGTH) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => (s.status === "ready" ? s : { status: "loading" }));
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          setState({ status: "error" });
          return;
        }
        const data = (await response.json()) as Suggestions;
        if (!controller.signal.aborted) setState({ status: "ready", query, data });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, enabled]);

  return state;
}
