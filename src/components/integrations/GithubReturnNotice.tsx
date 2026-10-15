"use client";

import { type FC, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, Snackbar } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { toReturnReason } from "@/lib/integrations/githubLink";

/**
 * What the GitHub callback left in the URL: `?github=connected` or `?github=error&reason=…`.
 * It is a **hint, never the truth**: the success toast shows only when the status the page
 * loaded in the same render says connected, so a forged link cannot make the page claim a
 * connection. The reason goes through a closed list (`toReturnReason`) to a fixed message.
 * Both parameters are removed from the URL at once.
 */
export const GithubReturnNotice: FC<{ connected: boolean }> = ({ connected }) => {
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const result = params.get("github");
  const reason = params.get("reason");
  const [notice, setNotice] = useState<
    { kind: "ok" } | { kind: "error"; code: ReturnType<typeof toReturnReason> } | null
  >(null);

  useEffect(() => {
    if (result !== "connected" && result !== "error") return;
    if (result === "connected") {
      if (connected) setNotice({ kind: "ok" });
    } else {
      setNotice({ kind: "error", code: toReturnReason(reason) });
    }
    const next = new URLSearchParams(params.toString());
    next.delete("github");
    next.delete("reason");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // Only a new result matters.
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  if (notice?.kind === "error") {
    return (
      <Alert
        severity="error"
        role="alert"
        onClose={() => setNotice(null)}
        closeText={t.integrations.dismiss}
        sx={{ mb: 3 }}
      >
        {t.integrations.errors[notice.code]}
      </Alert>
    );
  }
  return (
    <Snackbar
      open={notice?.kind === "ok"}
      autoHideDuration={5000}
      onClose={() => setNotice(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity="success" onClose={() => setNotice(null)} closeText={t.integrations.dismiss}>
        {t.integrations.github.connectedToast}
      </Alert>
    </Snackbar>
  );
};
