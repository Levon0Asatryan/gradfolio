"use client";

import { FC } from "react";
import { Alert, AlertTitle, Button, Container, Link } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Dictionary } from "@/data/locales/types";

type ProfileText = Dictionary["profile"];

/** Which message an API failure shows; the API's codes are its stable contract. */
function messageKey(code: string): keyof ProfileText {
  switch (code) {
    case "API_NOT_CONFIGURED":
      return "errorNotConfigured";
    case "API_UNREACHABLE":
    case "AUTH_UNAVAILABLE":
    case "DATABASE_UNAVAILABLE":
    case "RATE_LIMITED":
      return "errorUnreachable";
    case "UNAUTHENTICATED":
      return "errorSignInAgain";
    default:
      return "errorGeneric";
  }
}

/** A failed load, shown as an error and never as an empty profile. */
export const ProfileError: FC<{ code: string; returnTo?: string }> = ({
  code,
  returnTo = "/profile",
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  const signIn = code === "UNAUTHENTICATED";

  return (
    <Container sx={{ py: 3 }}>
      <Alert
        severity={signIn ? "warning" : "error"}
        action={
          signIn ? undefined : (
            <Button color="inherit" size="small" onClick={() => router.refresh()}>
              {t.profile.tryAgain}
            </Button>
          )
        }
      >
        <AlertTitle>{t.profile.loadErrorTitle}</AlertTitle>
        {t.profile[messageKey(code)] as string}
        {signIn && (
          <>
            {" "}
            <Link href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
              {t.common.login}
            </Link>
          </>
        )}
      </Alert>
    </Container>
  );
};
