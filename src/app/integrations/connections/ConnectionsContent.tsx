"use client";

import Link from "next/link";
import { Button, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { GithubCard } from "@/components/integrations/GithubCard";
import { GithubReturnNotice } from "@/components/integrations/GithubReturnNotice";
import { LinkedinCard } from "@/components/integrations/LinkedinCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stepper, Step } from "@/components/stepper";
import { useLanguage } from "@/components/i18n/LanguageContext";
import type { Integrations } from "@/lib/api/types";

/**
 * The onboarding flow (`Connect accounts` in the first-login dialog): the same cards as
 * `/integrations`, one per step, on what the API says. Every step can be skipped; nothing is
 * saved here, because connecting is done by the cards themselves.
 */
export const ConnectionsContent: FC<{ integrations: Integrations }> = ({ integrations }) => {
  const { t } = useLanguage();
  const text = t.integrations.setup;

  return (
    <PageContainer maxWidth={720}>
      <PageHeader title={text.title} subtitle={text.subtitle} />
      <GithubReturnNotice connected={integrations.github.status === "connected"} />

      <Stepper
        initialStep={1}
        backButtonText={text.back}
        nextButtonText={text.next}
        completeButtonText={text.complete}
        stepLabel={(step, total) =>
          text.stepOf.replace("{step}", String(step)).replace("{total}", String(total))
        }
        completedContent={
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="h5" component="h2">
              {text.doneTitle}
            </Typography>
            <Typography color="text.secondary">{text.doneBody}</Typography>
            <Button component={Link} href="/profile" variant="contained">
              {text.toProfile}
            </Button>
          </Stack>
        }
        sx={{ width: "100%" }}
      >
        <Step>
          <GithubCard github={integrations.github} />
        </Step>
        <Step>
          <LinkedinCard linkedin={integrations.linkedin} />
        </Step>
      </Stepper>
    </PageContainer>
  );
};
