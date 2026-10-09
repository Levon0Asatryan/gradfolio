"use client";

import { FC, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, Snackbar } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";

const KEYS = { created: "created", saved: "saved", deleted: "deleted", left: "left" } as const;

/**
 * A one-time confirmation after a redirect: `?flash=created|saved|deleted`. The
 * flag is a fixed word, never text from the user, and is removed from the URL at once.
 */
export const FlashToast: FC = () => {
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const flash = params.get("flash");
  const [shown, setShown] = useState<keyof typeof KEYS | null>(null);

  useEffect(() => {
    if (flash && flash in KEYS) {
      setShown(flash as keyof typeof KEYS);
      const next = new URLSearchParams(params.toString());
      next.delete("flash");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
    // Only a new flag matters.
  }, [flash]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Snackbar
      open={shown !== null}
      autoHideDuration={5000}
      onClose={() => setShown(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        severity="success"
        onClose={() => setShown(null)}
        closeText={t.projects.form.closeToast}
      >
        {shown === "left" ? t.team.left : shown ? t.projects.form[shown] : ""}
      </Alert>
    </Snackbar>
  );
};
