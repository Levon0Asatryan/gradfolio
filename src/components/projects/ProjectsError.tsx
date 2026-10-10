"use client";

import { FC } from "react";
import { Alert, AlertTitle, Button, Link } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { messageKey } from "@/components/profile/ProfileError";

/** A failed load of projects, shown as an error and never as "no projects yet". */
export const ProjectsError: FC<{
  code: string;
  returnTo: string;
  what?: "list" | "project" | "teams";
}> = ({ code, returnTo, what = "list" }) => {
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
              {t.projects.tryAgain}
            </Button>
          )
        }
      >
        <AlertTitle>
          {what === "list"
            ? t.projects.loadErrorTitle
            : what === "teams"
              ? t.teamsPage.loadErrorTitle
              : t.projects.projectLoadErrorTitle}
        </AlertTitle>
        {t.projects[messageKey(code)]}
        {signIn && (
          <>
            {" "}
            <Link href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
              {t.common.login}
            </Link>
          </>
        )}
      </Alert>
    </PageContainer>
  );
};
