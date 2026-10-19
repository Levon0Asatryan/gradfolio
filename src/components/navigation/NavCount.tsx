"use client";

import type { FC } from "react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useSuggestionCount } from "@/components/suggestions/SuggestionsProvider";
import Box from "@mui/material/Box";

/** Where the suggestions are reviewed: the only item that carries a count. */
const SUGGESTIONS_HREF = "/integrations";

const CAP = 99;

/**
 * The number of suggestions waiting, beside the Integrations item. Text and a number, never
 * colour alone: the number is drawn, and a screen reader hears "{count} to review" after the
 * item's name. Hidden at zero, and until the first read.
 */
export const NavCount: FC<{ href: string }> = ({ href }) => {
  const { t } = useLanguage();
  const count = useSuggestionCount();
  if (href !== SUGGESTIONS_HREF || count === null || count <= 0) return null;
  return (
    <>
      <Box
        component="span"
        aria-hidden
        data-testid="nav-suggestions-count"
        sx={{
          flex: "none",
          minWidth: 20,
          height: 20,
          px: 0.75,
          borderRadius: 10,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontSize: "0.6875rem",
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {count > CAP ? `${CAP}+` : count}
      </Box>
      <Box
        component="span"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {t.suggestions.navCount.replace("{count}", String(count))}
      </Box>
    </>
  );
};
