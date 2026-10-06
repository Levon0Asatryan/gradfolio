"use client";

import { type FC } from "react";
import { useTheme } from "@mui/material/styles";
import { useLanguage } from "@/components/i18n/LanguageContext";

export const MAIN_ID = "main-content";

/** First tab stop on every page: jumps over the navigation to the page's main landmark. */
export const SkipLink: FC = () => {
  const { t } = useLanguage();
  const { palette } = useTheme();
  return (
    <a
      href={`#${MAIN_ID}`}
      style={{
        position: "absolute",
        left: 8,
        top: -100,
        zIndex: 2000,
        padding: "10px 16px",
        borderRadius: 12,
        background: palette.primary.main,
        color: palette.primary.contrastText,
        fontWeight: 800,
      }}
      onFocus={(e) => (e.currentTarget.style.top = "8px")}
      onBlur={(e) => (e.currentTarget.style.top = "-100px")}
    >
      {t.common.skipToContent}
    </a>
  );
};
