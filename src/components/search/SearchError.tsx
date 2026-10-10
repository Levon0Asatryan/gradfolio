"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import { useLanguage } from "@/components/i18n/LanguageContext";

/** A failed search, shown as an error and never as "nothing found". */
export const SearchError: FC<{ code: string }> = ({ code }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const message =
    code === "RATE_LIMITED"
      ? t.search.errorRateLimited
      : code === "API_UNREACHABLE" ||
          code === "API_NOT_CONFIGURED" ||
          code === "DATABASE_UNAVAILABLE"
        ? t.search.errorUnavailable
        : t.search.errorGeneric;
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={() => router.refresh()}>
          {t.search.tryAgain}
        </Button>
      }
    >
      <AlertTitle>{t.search.loadErrorTitle}</AlertTitle>
      {message}
    </Alert>
  );
};
