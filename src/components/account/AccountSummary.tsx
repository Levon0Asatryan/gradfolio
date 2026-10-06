"use client";

import { type FC } from "react";
import { alpha } from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Dictionary } from "@/data/locales/types";
import { AccountCard, pageSx } from "./AccountCard";
import { DeleteAccount } from "./DeleteAccount";
import { AccountSettings, type AccountSettingsValues } from "./AccountSettings";
import type { Me } from "@/lib/api/types";
import { safeHttpUrl } from "@/utils/helpers/safeHttpUrl";

/** What the server page hands over: the account, or the API's error code. */
export type AccountResult = { me: Me; settings: AccountSettingsValues } | { errorCode: string };

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

/** A friendly name for an Auth0 connection id; unknown ones show as the API sent them. */
function identityLabel(identity: string, text: AccountText): string {
  switch (identity) {
    case "auth0":
      return text.loginMethodPassword;
    case "google-oauth2":
      return "Google";
    case "github":
      return "GitHub";
    case "linkedin":
      return "LinkedIn";
    default:
      return identity;
  }
}

export const AccountSummary: FC<{ result: AccountResult }> = ({ result }) => {
  const { t } = useLanguage();
  const text = t.account;

  return (
    <Stack spacing={3} sx={pageSx}>
      <Stack spacing={0.5}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {text.title}
        </Typography>
        {!("errorCode" in result) && <Typography color="text.secondary">{text.intro}</Typography>}
      </Stack>

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
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "stretch",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            // The summary card, the save/error messages and the danger zone span every column.
            "& > .span-all": { gridColumn: "1 / -1" },
          }}
        >
          <Paper
            className="span-all"
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ columnGap: 2, rowGap: 1.5 }}
            >
              <Avatar
                src={safeHttpUrl(result.me.avatarUrl)}
                alt={result.me.name}
                sx={{ width: 64, height: 64, fontSize: 24, bgcolor: "primary.main" }}
              />
              <Stack sx={{ minWidth: 160, flex: 1 }}>
                <Typography variant="h6" component="p" noWrap>
                  {result.me.name}
                </Typography>
                {result.me.email !== result.me.name && (
                  <Typography color="text.secondary" noWrap>
                    {result.me.email ?? text.noEmail}
                  </Typography>
                )}
              </Stack>
              <Chip
                size="small"
                color={result.me.verified ? "success" : "default"}
                sx={
                  result.me.verified
                    ? undefined
                    : (theme) => ({
                        // Theme tokens: warning.main is an AA text colour on its own tint (tokens.test.ts).
                        bgcolor: alpha(theme.palette.warning.main, 0.14),
                        color: "warning.main",
                      })
                }
                label={result.me.verified ? text.emailVerified : text.emailNotVerified}
              />
            </Stack>
            {!result.me.verified && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {text.emailNotVerifiedHint}
              </Typography>
            )}
          </Paper>
          <AccountCard title={text.linkedAccounts} help={text.linkedAccountsHelp}>
            {result.me.identities.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {result.me.identities.map((identity) => (
                  <Chip key={identity} variant="outlined" label={identityLabel(identity, text)} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {text.noLinked}
              </Typography>
            )}
          </AccountCard>
          <AccountSettings initial={result.settings} />
          <DeleteAccount />
        </Box>
      )}
    </Stack>
  );
};
