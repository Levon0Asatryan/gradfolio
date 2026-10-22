"use client";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLanguage } from "@/components/i18n/LanguageContext";

export function EmailUnsubscribe() {
  const { t } = useLanguage();
  const text = t.emailPreferences;
  const [token, setToken] = useState<string | null>(null);
  const captured = useRef(false);
  const [status, setStatus] = useState<"ready" | "busy" | "done" | "invalid" | "unavailable">(
    "ready",
  );
  useEffect(() => {
    if (captured.current) return;
    captured.current = true;
    setToken(window.location.hash.slice(1));
    // Keep the email token out of subsequent navigations and analytics URLs.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function unsubscribe() {
    setStatus("busy");
    try {
      const response = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) setStatus("done");
      else {
        const body = (await response.json().catch(() => null)) as { code?: string } | null;
        setStatus(
          response.status === 400 && body?.code === "INVALID_UNSUBSCRIBE_TOKEN"
            ? "invalid"
            : "unavailable",
        );
      }
    } catch {
      setStatus("unavailable");
    }
  }
  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography component="h1" variant="h4">
          {text.unsubscribeTitle}
        </Typography>
        <Typography>{text.unsubscribeHelp}</Typography>
        {status === "done" ? (
          <Alert severity="success">{text.unsubscribed}</Alert>
        ) : (
          <>
            {(status === "invalid" || token === "") && (
              <Alert severity="error">{text.invalidLink}</Alert>
            )}
            {status === "unavailable" && (
              <Alert severity="error">{text.unsubscribeUnavailable}</Alert>
            )}
            <Button
              variant="contained"
              disabled={!token || status === "busy"}
              onClick={() => void unsubscribe()}
            >
              {text.unsubscribe}
            </Button>
          </>
        )}
      </Stack>
    </PageContainer>
  );
}
