"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import { WelcomeCard } from "./WelcomeCard";
import DashboardStats from "./DashboardStats";
import RecentProjects from "./RecentProjects";
import QuickActions from "./QuickActions";
import ActivityFeed from "./ActivityFeed";
import { activitiesMock, projectsMock, statsMock } from "@/data/dashboard.mock";
import type { Completeness } from "@/lib/profile/completeness";

export interface DashboardContentProps {
  firstName: string | null;
  completeness: Completeness | null;
}

const EDIT_PROFILE = "/profile/edit";

/** The dashboard. The welcome card is real; stats, projects and activity are mock until M4-M6. */
export const DashboardContent: FC<DashboardContentProps> = ({ firstName, completeness }) => (
  <PageContainer>
    <WelcomeCard firstName={firstName} completeness={completeness} editHref={EDIT_PROFILE} />
    <DashboardStats stats={statsMock} />
    <RecentProjects items={projectsMock} />
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
        alignItems: "stretch",
      }}
    >
      <QuickActions editProfileHref={EDIT_PROFILE} />
      <ActivityFeed items={activitiesMock} />
    </Box>
  </PageContainer>
);
