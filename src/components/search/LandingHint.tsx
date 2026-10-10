"use client";

import { FC } from "react";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";

/** What `/search` shows before a query: one sentence on what to type. */
export const LandingHint: FC = () => {
  const { t } = useLanguage();
  return (
    <Typography color="text.secondary" sx={{ py: 4 }}>
      {t.search.landingHint}
    </Typography>
  );
};
