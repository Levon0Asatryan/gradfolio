"use client";

import { type FC } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Dictionary } from "@/data/locales/types";
import type { Me } from "@/lib/api/client";
import { safeImageUrl } from "@/utils/helpers/safeImageUrl";

/** What the server page hands over: the account, or the API's error code. */
export type AccountResult = { me: Me } | { errorCode: string };

type AccountText = Dictionary["account"];

/** Which message a failure shows; the API's codes are its stable contract. */
function errorMessage(code: string): keyof AccountText {
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

export const AccountSummary: FC<{ result: AccountResult }> = ({ result }) => {
  const { t } = useLanguage();
  const text = t.account;

  return (
    <Stack component="main" spacing={2} sx={{ p: 3, maxWidth: 640 }}>
      <Typography variant="h4" component="h1">
        {text.title}
      </Typography>

      {"errorCode" in result ? (
        <Alert severity={result.errorCode === "UNAUTHENTICATED" ? "warning" : "error"}>
          {text[errorMessage(result.errorCode)]}
          {result.errorCode === "UNAUTHENTICATED" && (
            <>
              {" "}
              <Link href="/auth/login?returnTo=/account">{t.common.login}</Link>
            </>
          )}
        </Alert>
      ) : (
        <>
          <Typography color="text.secondary">{text.intro}</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={safeImageUrl(result.me.avatarUrl)} alt={result.me.name} />
            <Stack>
              <Typography variant="h6" component="p">
                {result.me.name}
              </Typography>
              <Typography color="text.secondary">{result.me.email ?? text.noEmail}</Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color={result.me.verified ? "success" : "default"}
              label={result.me.verified ? text.emailVerified : text.emailNotVerified}
            />
            {result.me.identities.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {text.loginMethods} {result.me.identities.join(", ")}
              </Typography>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
};
