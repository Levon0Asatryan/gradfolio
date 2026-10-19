"use client";

import { type FC, useState } from "react";
import { Button } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { SuggestionItem } from "@/lib/api/types";
import { errorCode } from "@/lib/integrations/errors";
import { refreshInboxAction } from "@/lib/integrations/suggestionActions";
import { SUGGESTION_GROUPS } from "@/lib/integrations/suggestionKinds";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { useSuggestions } from "./SuggestionsProvider";

/**
 * The suggestions inbox on `/integrations`: every group, with a button that asks the API to read
 * GitHub again (it throttles itself and says so; the answer is shown, never hidden).
 */
export const SuggestionsInbox: FC<{
  githubConnected: boolean;
  initial?: { items: SuggestionItem[]; more: boolean } | null;
}> = ({ githubConnected, initial = null }) => {
  const { t } = useLanguage();
  const s = t.suggestions;
  const list = useSuggestions();
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "info" | "warning" | "error" | "success";
    text: string;
  } | null>(null);

  async function check() {
    if (checking) return;
    setChecking(true);
    setNotice({ tone: "info", text: s.checking });
    let result;
    try {
      result = await refreshInboxAction();
    } catch {
      result = { ok: false as const, code: "UNKNOWN" };
    }
    setChecking(false);
    if (!result.ok) {
      setNotice({
        tone: "error",
        text:
          (s.errors as Record<string, string | undefined>)[result.code] ??
          t.integrations.errors[errorCode(result.code)],
      });
      return;
    }
    await list.reload();
    setNotice({
      tone: result.github === "refreshed" || result.github === "unchanged" ? "success" : "info",
      text: s.checked[result.github],
    });
  }

  return (
    <SuggestionsPanel
      groups={SUGGESTION_GROUPS}
      variant="inbox"
      initial={initial}
      externalNotice={notice}
      headerAction={
        githubConnected ? (
          <Button
            size="small"
            variant="outlined"
            aria-disabled={checking}
            onClick={() => void check()}
            sx={{ minHeight: 40, flex: "none" }}
          >
            {checking ? s.checking : s.checkNow}
          </Button>
        ) : undefined
      }
    />
  );
};
