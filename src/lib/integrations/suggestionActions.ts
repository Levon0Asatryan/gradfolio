"use server";

import {
  ApiError,
  acceptSuggestion,
  dismissSuggestion,
  listSuggestions,
  refreshSuggestions,
} from "@/lib/api/client";
import type { SuggestionItem, SuggestionRefresh } from "@/lib/api/types";

/** Public endpoints, like every server action: no user id; arguments checked here, then by the API. */
type Failure = { ok: false; code: string; retryAfter?: number };
const invalid: Failure = { ok: false, code: "VALIDATION_FAILED" };

function failed(error: unknown): Failure {
  if (error instanceof ApiError) {
    return {
      ok: false,
      code: error.code,
      ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
    };
  }
  throw error;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Most suggestions one accept call takes: the profile has seven fields. */
const ACCEPT_MAX = 10;

/**
 * GitHub's profile data as suggestions: ask the API to refresh (it throttles itself and says
 * so), then list the open ones. Only `profile.*` suggestions from GitHub are returned here: the
 * dialog is GitHub's, and a LinkedIn reminder belongs elsewhere.
 */
export async function loadProfileSuggestionsAction(): Promise<
  | {
      ok: true;
      items: SuggestionItem[];
      refresh: SuggestionRefresh | null;
      refreshError: string | null;
    }
  | Failure
> {
  let refresh: SuggestionRefresh | null = null;
  let refreshError: string | null = null;
  try {
    refresh = await refreshSuggestions();
  } catch (error) {
    // A failed refresh still lets the stored suggestions show, with the reason beside them.
    if (!(error instanceof ApiError)) throw error;
    if (error.code === "UNAUTHENTICATED") return failed(error);
    refreshError = error.code; // shown next to the stored suggestions, never hidden
  }
  try {
    const page = await listSuggestions({ limit: 100 });
    return {
      ok: true,
      items: page.items.filter(
        (i) => i.status === "open" && i.source === "github" && i.kind.startsWith("profile."),
      ),
      refresh,
      refreshError,
    };
  } catch (error) {
    return failed(error);
  }
}

/** Accept the ticked suggestions, one request each (the API writes one field per accept). */
export async function acceptSuggestionsAction(
  input: unknown,
): Promise<{ ok: true; results: Array<{ id: string; ok: boolean; code?: string }> } | Failure> {
  if (
    typeof input !== "object" ||
    input === null ||
    !Array.isArray((input as { ids?: unknown }).ids)
  ) {
    return invalid;
  }
  const ids = (input as { ids: unknown[] }).ids;
  if (
    ids.length < 1 ||
    ids.length > ACCEPT_MAX ||
    ids.some((id) => typeof id !== "string" || !UUID.test(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return invalid;
  }
  const results: Array<{ id: string; ok: boolean; code?: string }> = [];
  for (const id of ids as string[]) {
    try {
      await acceptSuggestion(id);
      results.push({ id, ok: true });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      results.push({ id, ok: false, code: error.code });
    }
  }
  return { ok: true, results };
}

/** Dismiss one suggestion; the API remembers it. */
export async function dismissSuggestionAction(input: unknown): Promise<{ ok: true } | Failure> {
  const id = (input as { id?: unknown } | null)?.id;
  if (typeof id !== "string" || !UUID.test(id)) return invalid;
  try {
    await dismissSuggestion(id);
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}
