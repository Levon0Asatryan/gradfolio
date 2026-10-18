"use client";

import Link from "next/link";
import { Button, Stack, Typography } from "@mui/material";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLanguage } from "@/components/i18n/LanguageContext";

export function SignInPrompt({ returnTo }: { returnTo: string }) {
  const { t } = useLanguage();
  return (
    <PageContainer>
      <Stack spacing={3} sx={{ maxWidth: 640, py: 6 }}>
        <Typography component="h1" variant="h4">
          {t.common.signInRequired}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            component="a"
            variant="contained"
            href={`/auth/login?${new URLSearchParams({ returnTo })}`}
          >
            {t.common.login}
          </Button>
          <Button component={Link} variant="outlined" href="/search">
            {t.common.continueBrowsing}
          </Button>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
