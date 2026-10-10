"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import { WelcomeCard } from "./WelcomeCard";
import DashboardStats from "./DashboardStats";
import RecentProjects from "./RecentProjects";
import QuickActions from "./QuickActions";
import ActivityFeed from "./ActivityFeed";
import type { Dashboard } from "@/lib/api/types";
import type { Completeness } from "@/lib/profile/completeness";

export interface DashboardContentProps {
  firstName: string | null;
  completeness: Completeness | null;
  /**
   * What the API counted, or `null` when it could not be read: then each section says so.
   * (The welcome card has its own soft fallback and does not depend on it.)
   */
  dashboard: Dashboard | null;
}

const EDIT_PROFILE = "/profile/edit";

/** The dashboard: the welcome card, the API's numbers, recent projects, quick actions and the feed. */
export const DashboardContent: FC<DashboardContentProps> = ({
  firstName,
  completeness,
  dashboard,
}) => (
  <PageContainer>
    <WelcomeCard firstName={firstName} completeness={completeness} editHref={EDIT_PROFILE} />
    <DashboardStats stats={dashboard?.stats ?? null} />
    <RecentProjects items={dashboard?.recentProjects ?? null} />
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
        alignItems: "stretch",
      }}
    >
      <QuickActions editProfileHref={EDIT_PROFILE} />
      <ActivityFeed items={dashboard?.activities ?? null} />
    </Box>
  </PageContainer>
);
