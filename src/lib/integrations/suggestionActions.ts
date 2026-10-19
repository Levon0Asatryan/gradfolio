"use server";

import {
  ApiError,
  acceptSuggestion,
  dismissSuggestion,
  listSuggestions,
  refreshSuggestions,
} from "@/lib/api/client";
import type { SuggestionAcceptOverrides, SuggestionItem, SuggestionRefresh } from "@/lib/api/types";
import { isInboxItem } from "./suggestionKinds";
import { parseOverrides } from "./suggestionOverrides";

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
        (i) =>
          i.status === "open" &&
          i.source === "github" &&
          i.kind.startsWith("profile.") &&
          // The dialog labels these fields only; links to LinkedIn and X are for the inbox.
          i.kind !== "profile.links.linkedin" &&
          i.kind !== "profile.links.twitter",
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

/** Open suggestions for the inbox, the profile strips and the navigation count (one list). */
export async function loadInboxAction(): Promise<
  { ok: true; items: SuggestionItem[]; more: boolean } | Failure
> {
  try {
    const page = await listSuggestions({ limit: 100 });
    return { ok: true, items: page.items.filter(isInboxItem), more: page.nextCursor !== null };
  } catch (error) {
    return failed(error);
  }
}

/** Ask the API to read GitHub again (it throttles itself and says so). */
export async function refreshInboxAction(): Promise<
  { ok: true; github: SuggestionRefresh["github"]; created: number } | Failure
> {
  try {
    const r = await refreshSuggestions();
    return { ok: true, github: r.github, created: r.created };
  } catch (error) {
    return failed(error);
  }
}

/**
 * Accept one suggestion from the inbox. Never called without a click. `overrides` only for an
 * education or experience entry. A refusal carries the API's code (`SUGGESTION_STALE` and
 * `SUGGESTION_RESOLVED` among them) so the card can say what happened.
 */
export async function acceptOneSuggestionAction(
  input: unknown,
): Promise<{ ok: true; projectId: string | null } | Failure> {
  if (typeof input !== "object" || input === null) return invalid;
  const { id, overrides } = input as { id?: unknown; overrides?: unknown };
  if (typeof id !== "string" || !UUID.test(id)) return invalid;
  let parsed: SuggestionAcceptOverrides | undefined;
  if (overrides !== undefined) {
    const p = parseOverrides(overrides);
    if (!p) return invalid;
    parsed = p;
  }
  try {
    const r = await acceptSuggestion(id, parsed);
    return { ok: true, projectId: r.projectId ?? null };
  } catch (error) {
    return failed(error);
  }
}
