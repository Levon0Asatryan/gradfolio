"use client";

import { type FC } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useLanguage } from "@/components/i18n/LanguageContext";

/**
 * A confirmation that does not move the page: bottom centre, closes itself after
 * four seconds, announced to screen readers (`role="status"`). Errors stay inline
 * next to what failed; this is for "saved".
 */
export const Toast: FC<{ message: string | null; onClose: () => void }> = ({
  message,
  onClose,
}) => {
  const { t } = useLanguage();
  return (
    <Snackbar
      open={message !== null}
      autoHideDuration={4000}
      onClose={(_, reason) => reason !== "clickaway" && onClose()}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      // Above the phone navigation bar.
      sx={{ bottom: { xs: "calc(88px + env(safe-area-inset-bottom, 0px)) !important", sm: 24 } }}
    >
      {message ? (
        <Alert
          severity="success"
          variant="filled"
          role="status"
          closeText={t.sectionEdit.closeToast}
          onClose={onClose}
        >
          {message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
};
