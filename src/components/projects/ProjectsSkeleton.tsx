"use client";

import { FC } from "react";
import { Box, Skeleton } from "@mui/material";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { PageContainer } from "@/components/layout/PageContainer";

/** The projects route's loading state: the cards' own dimensions, so nothing shifts when data lands. */
export const ProjectsSkeleton: FC = () => {
  const { t } = useLanguage();
  return (
    <PageContainer>
      <div aria-busy="true" aria-label={t.projects.loading}>
        <Skeleton width="30%" height={44} />
        <Skeleton width="50%" />
        <Skeleton variant="rounded" height={56} sx={{ my: 2 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: 3,
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={330} />
          ))}
        </Box>
      </div>
    </PageContainer>
  );
};
