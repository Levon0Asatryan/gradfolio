"use client";

import { FC } from "react";
import { Skeleton, Stack } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";

/** The profile route's loading state. */
export const ProfileSkeleton: FC = () => {
  const { t } = useLanguage();
  return (
    <PageContainer gap={0}>
      <div role="status" aria-busy="true" aria-label={t.profile.loading}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Skeleton variant="circular" width={96} height={96} />
          <Stack sx={{ flex: 1 }}>
            <Skeleton width="40%" height={36} />
            <Skeleton width="70%" />
          </Stack>
        </Stack>
        <Skeleton variant="rounded" height={160} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={160} />
      </div>
    </PageContainer>
  );
};
