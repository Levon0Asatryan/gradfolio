"use client";

import { FC } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * "First page" and "Next page" as links: a page is a URL, so it can be shared and the browser's
 * Back is the previous page. The API's cursors have no page numbers (plan D1).
 */
export const Pager: FC<{ firstHref?: string; nextHref?: string }> = ({ firstHref, nextHref }) => {
  const { t } = useLanguage();
  if (!firstHref && !nextHref) return null;
  return (
    <Box component="nav" aria-label={t.search.nextPage} sx={{ display: "flex", gap: 2 }}>
      {firstHref && (
        <Button component={Link} href={firstHref} variant="outlined" sx={{ minHeight: 44 }}>
          {t.search.firstPage}
        </Button>
      )}
      {nextHref && (
        <Button component={Link} href={nextHref} variant="contained" sx={{ minHeight: 44 }}>
          {t.search.nextPage}
        </Button>
      )}
    </Box>
  );
};
