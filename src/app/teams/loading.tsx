"use client";

import { Skeleton } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";

/** The teams route's loading state: section-sized blocks, so nothing jumps when the data lands. */
export default function Loading() {
  const { t } = useLanguage();
  return (
    <PageContainer maxWidth={1000}>
      <div role="status" aria-busy="true" aria-label={t.teamsPage.loading}>
        <Skeleton width="30%" height={44} />
        <Skeleton width="60%" />
        <Skeleton variant="rounded" height={120} sx={{ my: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ my: 2 }} />
        <Skeleton variant="rounded" height={200} />
      </div>
    </PageContainer>
  );
}
