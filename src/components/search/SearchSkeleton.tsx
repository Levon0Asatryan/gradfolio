"use client";

import { FC } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";

/** The search routes' loading state, with the cards' own height so nothing shifts when data lands. */
export const SearchSkeleton: FC = () => {
  const { t } = useLanguage();
  return (
    <PageContainer>
      <div role="status" aria-busy="true" aria-label={t.search.loading}>
        <Skeleton width="30%" height={44} />
        <Skeleton width="50%" />
        <Skeleton variant="rounded" height={56} sx={{ my: 2 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: 3,
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={220} />
          ))}
        </Box>
      </div>
    </PageContainer>
  );
};
