"use client";

import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { SuggestionAcceptOverrides, SuggestionItem } from "@/lib/api/types";
import { errorCode } from "@/lib/integrations/errors";
import {
  acceptOneSuggestionAction,
  dismissSuggestionAction,
} from "@/lib/integrations/suggestionActions";
import {
  SUGGESTION_GROUPS,
  type SuggestionGroup,
  groupOf,
} from "@/lib/integrations/suggestionKinds";
import { describe } from "./describe";
import { SuggestionCard, acceptId, titleId } from "./SuggestionCard";
import { useSuggestions } from "./SuggestionsProvider";

type Notice = { tone: "success" | "info" | "warning" | "error"; text: string };

/** Codes after which the API no longer holds the suggestion open: the card goes. */
const GONE = new Set([
  "SUGGESTION_STALE",
  "SUGGESTION_RESOLVED",
  "SUGGESTION_INVALID",
  "NOT_FOUND",
]);

/**
 * The suggestions of some groups, as cards: the whole inbox on `/integrations`, or one kind in a
 * small strip on the profile. Both read the one shared list, so an answer here moves the other
 * places (the strip, the inbox, the navigation count) at once.
 *
 * Nothing is applied without a click. Focus: after an answer the card is gone, so focus moves to
 * the next card's heading, or to this panel's heading when it was the last. The message lives in
 * a status region that is always in the page, so a screen reader hears it.
 */
export const SuggestionsPanel: FC<{
  groups: readonly SuggestionGroup[];
  variant: "inbox" | "strip";
  /** The section's own data changed (a skill was added): update it without waiting for a reload. */
  onAccepted?: (item: SuggestionItem) => void;
  /** Inbox only: the "check GitHub now" control, when GitHub is connected. */
  headerAction?: ReactNode;
  /**
   * What the server read with the page (the inbox). Drawn until the browser's own read arrives,
   * so the cards are in the first paint and nothing below them jumps.
   */
  initial?: { items: SuggestionItem[]; more: boolean } | null;
  /** Announce a message from outside (a refresh result) in this panel's status region. */
  externalNotice?: Notice | null;
}> = ({ groups, variant, onAccepted, headerAction, initial = null, externalNotice = null }) => {
  const { t } = useLanguage();
  const s = t.suggestions;
  const router = useRouter();
  const list = useSuggestions();
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [formFor, setFormFor] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [everHad, setEverHad] = useState(false);
  // A second click while a call is out is no second call; a ref, because state lags a click.
  const answering = useRef(new Set<string>());
  const focusNext = useRef<string | null>(null);
  const headingId = `suggestions-heading-${groups.join("-")}-${variant}`;

  const known = list.items ?? initial?.items ?? null;
  const more = list.items ? list.more : (initial?.more ?? false);
  const mine = (known ?? []).filter((i) => {
    const g = groupOf(i.kind);
    return g !== null && groups.includes(g);
  });

  // A message from outside replaces the last one; the next answer replaces it in turn.
  useEffect(() => {
    if (externalNotice) setNotice(externalNotice);
  }, [externalNotice]);

  useEffect(() => {
    if (mine.length > 0) setEverHad(true);
  }, [mine.length]);

  // After a card went: put focus where the student can go on (see the component comment).
  const ids = mine.map((i) => i.id).join(",");
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    document.getElementById(target)?.focus();
  }, [ids]);

  const messageFor = useCallback(
    (code: string): string => {
      const own = (s.errors as Record<string, string | undefined>)[code];
      return own ?? t.integrations.errors[errorCode(code)];
    },
    [s.errors, t.integrations.errors],
  );

  const planFocus = (id: string) => {
    const at = mine.findIndex((i) => i.id === id);
    const next = mine[at + 1] ?? mine[at - 1];
    focusNext.current = next ? titleId(next.id) : headingId;
  };

  const finish = (id: string, set: (n: Set<string>) => void) => {
    answering.current.delete(id);
    set(new Set(answering.current));
  };

  async function answer(
    item: SuggestionItem,
    verb: "accept" | "dismiss",
    overrides?: SuggestionAcceptOverrides,
  ) {
    if (answering.current.has(item.id)) return;
    answering.current.add(item.id);
    setBusy(new Set(answering.current));
    setNotice(null);
    setFormError(null);
    const title = describe(item, t).title;
    let result;
    try {
      result =
        verb === "accept"
          ? await acceptOneSuggestionAction({ id: item.id, ...(overrides ? { overrides } : {}) })
          : await dismissSuggestionAction({ id: item.id });
    } catch {
      result = { ok: false as const, code: "UNKNOWN" };
    }
    finish(item.id, setBusy);
    if (result.ok) {
      planFocus(item.id);
      setFormFor(null);
      list.remove(item.id);
      setNotice({
        tone: "success",
        text: (verb === "accept" ? s.done.accepted : s.done.dismissed).replace("{title}", title),
      });
      if (verb === "accept") {
        onAccepted?.(item);
        // The page's own data (the skills, the links) is read again from the API.
        router.refresh();
      }
      return;
    }
    const code = result.code;
    if (GONE.has(code)) {
      // The API no longer holds it open; nothing was applied. Say so, and drop the card.
      planFocus(item.id);
      setFormFor(null);
      list.remove(item.id);
      setNotice({ tone: "warning", text: `${title}: ${messageFor(code)}` });
      void list.reload();
      return;
    }
    if (code === "VALIDATION_FAILED" && overrides) {
      setFormError(messageFor(code));
      return;
    }
    setNotice({ tone: "error", text: `${title}: ${messageFor(code)}` });
  }

  const shown = notice;
  const count = mine.length;
  const heading = s.stripTitle.replace("{count}", String(count));
  const visible = variant === "inbox" || count > 0 || everHad;

  // The region is always in the page, so a message appearing in it is announced.
  const status = (
    <Box role="status" aria-live="polite" sx={{ minHeight: shown ? undefined : 0 }}>
      {shown && (
        <Alert severity={shown.tone} sx={{ mt: 1 }}>
          {shown.text}
        </Alert>
      )}
    </Box>
  );

  // A strip with nothing to review renders nothing; once it has shown cards its region stays.
  if (!visible) return null;

  const Heading = (
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <Typography
        id={headingId}
        component={variant === "inbox" ? "h2" : "h3"}
        variant={variant === "inbox" ? "h6" : "subtitle2"}
        tabIndex={-1}
        sx={{ fontWeight: 700, outlineOffset: 2 }}
      >
        {heading}
      </Typography>
      {headerAction}
    </Stack>
  );

  const card = (item: SuggestionItem) => (
    <SuggestionCard
      key={item.id}
      item={item}
      busy={busy.has(item.id)}
      formOpen={formFor === item.id}
      formError={formFor === item.id ? formError : null}
      onAccept={(overrides) => void answer(item, "accept", overrides)}
      onDismiss={() => void answer(item, "dismiss")}
      onOpenForm={() => {
        setNotice(null);
        setFormError(null);
        setFormFor(item.id);
      }}
      onCloseForm={() => {
        setFormFor(null);
        setFormError(null);
        // The button that opened the form is back; the student returns to it.
        requestAnimationFrame(() => document.getElementById(acceptId(item.id))?.focus());
      }}
    />
  );

  let body;
  if (list.status === "error" && known === null) {
    body = (
      <Alert
        severity="error"
        role="alert"
        action={
          <Button color="inherit" size="small" onClick={() => void list.reload()}>
            {s.retry}
          </Button>
        }
      >
        {s.loadError}: {messageFor(list.error ?? "UNKNOWN")}
      </Alert>
    );
  } else if (known === null) {
    body = (
      <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <CircularProgress size={18} />
        <Typography variant="body2">{s.loading}</Typography>
      </Box>
    );
  } else if (count === 0) {
    body = (
      <Typography variant="body2" color="text.secondary">
        {variant === "inbox" ? s.empty : s.stripDone}
      </Typography>
    );
  } else if (variant === "inbox") {
    body = (
      <Stack spacing={2.5}>
        {SUGGESTION_GROUPS.filter((g) => groups.includes(g)).map((g) => {
          const rows = mine.filter((i) => groupOf(i.kind) === g);
          if (rows.length === 0) return null;
          const gid = `suggestions-group-${g}`;
          return (
            <Box key={g} component="section" aria-labelledby={gid}>
              <Typography
                id={gid}
                component="h3"
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {s.groups[g]} ({rows.length})
              </Typography>
              <Stack component="ul" spacing={1} sx={{ m: 0, p: 0 }}>
                {rows.map(card)}
              </Stack>
            </Box>
          );
        })}
        {more && (
          <Typography variant="caption" color="text.secondary">
            {s.moreNote}
          </Typography>
        )}
      </Stack>
    );
  } else {
    body = (
      <Stack component="ul" spacing={1} sx={{ m: 0, p: 0 }}>
        {mine.map(card)}
      </Stack>
    );
  }

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={
        variant === "strip"
          ? { mb: 2, p: 1.5, borderRadius: 2, border: 1, borderColor: "divider" }
          : { mb: 4 }
      }
    >
      {Heading}
      {variant === "inbox" && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, mt: 0.5 }}>
          {s.intro}
        </Typography>
      )}
      {status}
      <Box sx={{ mt: 1 }}>{body}</Box>
    </Box>
  );
};
