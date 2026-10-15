"use client";

import type { FC } from "react";
import { Box } from "@mui/material";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Integrations } from "@/lib/api/types";
import { GithubCard } from "./GithubCard";
import { GithubReturnNotice } from "./GithubReturnNotice";
import { LinkedinCard } from "./LinkedinCard";

/** `/integrations`: the two cards, from what the API says (never local state). */
export const IntegrationsView: FC<{ integrations: Integrations }> = ({ integrations }) => {
  const { t } = useLanguage();
  return (
    <PageContainer maxWidth={900}>
      <PageHeader title={t.integrations.title} subtitle={t.integrations.subtitle} />
      <GithubReturnNotice connected={integrations.github.status === "connected"} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        <GithubCard github={integrations.github} />
        <LinkedinCard linkedin={integrations.linkedin} />
      </Box>
    </PageContainer>
  );
};
