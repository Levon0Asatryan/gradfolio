"use client";

import type { FC } from "react";
import { Alert, AlertTitle, Button, Link } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { errorCode } from "@/lib/integrations/errors";

/** A failed load of the integrations, shown as an error and never as "nothing connected". */
export const IntegrationsError: FC<{ code: string; returnTo: string }> = ({ code, returnTo }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const signIn = code === "UNAUTHENTICATED";
  return (
    <PageContainer>
      <Alert
        severity={signIn ? "warning" : "error"}
        action={
          signIn ? undefined : (
            <Button color="inherit" size="small" onClick={() => router.refresh()}>
              {t.integrations.retry}
            </Button>
          )
        }
      >
        <AlertTitle>{t.integrations.loadErrorTitle}</AlertTitle>
        {t.integrations.errors[errorCode(code)]}
        {signIn && (
          <>
            {" "}
            <Link href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
              {t.integrations.signIn}
            </Link>
          </>
        )}
      </Alert>
    </PageContainer>
  );
};
